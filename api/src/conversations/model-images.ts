/**
 * operations-style module: pure.
 *
 * WHICH TOOL-RESULT IMAGES A MODEL IS SENT (docs/architecture/context-management.md, "Images"). An image-bearing
 * MCP result reaches the model as image parts (mediaModelOutput, operations.ts), and every step re-sends the
 * whole history. Before each step:
 *
 * - a model without `imageInput` (api/src/models/operations.ts, resolveImageInput) gets a placeholder for every
 *   image. Sending them anyway is refused by some text-only models and ignored by others (GLM 5.3 on GreenPT
 *   answers "no image");
 * - a model that reads images gets the most recent KEPT_IMAGES of them, and a placeholder for the older ones.
 *   This is the convention of Anthropic's computer-use reference loop (`only_n_most_recent_images`): an old
 *   screenshot shows a page that has since changed, and the model can call the tool again to see it.
 *
 * The placeholder depends on the image alone, and an image only ever moves from shown to replaced, so the
 * prefix before the latest image stays byte-identical from step to step and the provider's cache of it holds.
 * A result left with no image becomes a text output, the shape every provider takes, joined with the same
 * separator each time.
 */
import type { ModelMessage } from 'ai'
import { estimateTokens } from './compaction-policy.ts'
import { redactModelMedia } from './operations.ts'

/** Images sent whole, counted from the end of the history. */
export const KEPT_IMAGES = 1

/**
 * What one image costs in the fill estimate, in tokens. Anthropic resizes to about 1.15 megapixels (about 1,600
 * tokens), OpenAI's high detail bills a 1280x800 image 1,105, and DeepSeek V4.1 Flash on GreenPT about 830 (a
 * 1280x800 screenshot, measured 2026-11-09). The highest, so the estimate errs toward compacting early.
 */
export const IMAGE_TOKEN_ESTIMATE = 1600

type MediaItem = { type: 'image-data' | 'file-data', data: unknown, mediaType: string }
type ContentItem = { type: string, text?: string } | MediaItem

const isMedia = (item: unknown): item is MediaItem =>
  (item as MediaItem)?.type === 'image-data' || (item as MediaItem)?.type === 'file-data'

const sizeKb = (item: MediaItem) => Math.round(String(item.data).length * 3 / 4 / 1024)

export const imagePlaceholder = (item: MediaItem, reason: 'earlier' | 'unsupported') => reason === 'earlier'
  ? `[image ${item.mediaType} ~${sizeKb(item)}kB no longer shown: a later image replaced it, call the tool again to see the current state]`
  : `[image ${item.mediaType} ~${sizeKb(item)}kB not shown: this model does not read images]`

const isContentResult = (part: any): part is { type: 'tool-result', output: { type: 'content', value: ContentItem[] } } =>
  part?.type === 'tool-result' && part.output?.type === 'content' && Array.isArray(part.output.value)

/** How many image parts the messages send to the model. */
export const countModelImages = (messages: ModelMessage[]): number => {
  let count = 0
  for (const message of messages) {
    if (message.role !== 'tool' || !Array.isArray(message.content)) continue
    for (const part of message.content as unknown[]) {
      if (isContentResult(part)) count += part.output.value.filter(isMedia).length
    }
  }
  return count
}

/** The messages with only the images this model is sent (see the module comment); copied, never mutated. */
export function limitModelImages (messages: ModelMessage[], options: { imageInput: boolean, keep?: number }): ModelMessage[] {
  const keep = options.imageInput ? (options.keep ?? KEPT_IMAGES) : 0
  const total = countModelImages(messages)
  if (total <= keep) return messages
  // The first `total - keep` images, in history order, are replaced.
  let toReplace = total - keep
  return messages.map(message => {
    if (toReplace === 0 || message.role !== 'tool' || !Array.isArray(message.content)) return message
    let changed = false
    const content = (message.content as unknown[]).map(part => {
      if (toReplace === 0 || !isContentResult(part) || !part.output.value.some(isMedia)) return part
      const value = part.output.value.map(item => {
        if (!isMedia(item) || toReplace === 0) return item
        toReplace--
        return { type: 'text', text: imagePlaceholder(item, options.imageInput ? 'earlier' : 'unsupported') }
      })
      changed = true
      const output = value.some(isMedia)
        ? { ...part.output, value }
        : { type: 'text', value: value.map(item => (item as { text?: string }).text ?? '').join('\n\n') }
      return { ...part, output }
    })
    return changed ? { ...message, content } as ModelMessage : message
  })
}

/**
 * How full the window is, in tokens: the text as characters, each image at IMAGE_TOKEN_ESTIMATE. Counted as text,
 * an image's base64 reads as tens of thousands of tokens; ignored, as it was before, a run of screenshots never
 * triggered clearing or compaction. Pass the messages as they will be sent (limitModelImages applied), or the
 * images are overcounted.
 */
export const estimateModelFill = (messages: ModelMessage[]): number =>
  estimateTokens(JSON.stringify(redactModelMedia(messages)).length) + countModelImages(messages) * IMAGE_TOKEN_ESTIMATE

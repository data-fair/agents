/**
 * THE CALL PATH (spec §4.4): the layer every tool call goes through, under the provenance envelope
 * (modelTools, conversations/operations.ts). A call made by the model and — plan 4 — a call made from a
 * script are the same call: same file handling, same recording, same guards.
 *
 * In: a file argument is the path of one of the turn's files; it is turned into a signed URL for THIS call
 * only, after the call was recorded (the stream loop records the model's input; the SDK's approval request
 * carries it too). Records, approval cards and transcripts therefore keep the path.
 * Out: anything the target echoes of those URLs is turned back into the path.
 */
import type { Tool } from 'ai'
import { isMediaToolResult } from '@agents/shared/tool-result'
import type { SourcedTool } from '../conversations/operations.ts'
import type { TurnFiles } from './turn-files.ts'
import type { OpenedDownload } from './download.ts'
import { scrubUrls, isLinkedToolResult, storedNameForLink, uniqueName, rewriteLinkText, formatBytes, type LinkedToolResult, type LinkOrigin, type ResourceLink } from './operations.ts'

export interface CallPathContext {
  /** The turn's files; undefined when files are off (the personal assistant, or no store). */
  files?: TurnFiles
  /** Opens a link a tool returned, under the credential rule (api/src/files/download.ts createLinkOpener). Set with files. */
  openLink?: (link: ResourceLink, origin: LinkOrigin, signal?: AbortSignal) => Promise<OpenedDownload>
}

const scrubOutput = (output: unknown, signed: Map<string, string>): unknown => {
  if (!signed.size) return output
  if (typeof output === 'string') return scrubUrls(output, signed)
  if (isMediaToolResult(output)) return { ...output, ...(output.text !== undefined ? { text: scrubUrls(output.text, signed) } : {}) }
  if (output && typeof output === 'object') return JSON.parse(scrubUrls(JSON.stringify(output), signed))
  return output
}

/**
 * A link result becomes stored files (spec §4.2): each link fetched under the credential rule, named from its
 * response, stored, and its URL in the text replaced by the stored path. Without files, the text unchanged —
 * today's behaviour, where links were dropped and the text kept.
 */
const storeLinks = async (result: LinkedToolResult, ctx: CallPathContext, signal?: AbortSignal): Promise<string> => {
  if (!ctx.files || !ctx.openLink) return result.text
  const used = new Set<string>()
  const saved: { uri: string, path: string, line: string }[] = []
  for (const link of result.links) {
    let opened: OpenedDownload
    try {
      opened = await ctx.openLink(link, { catalog: result.catalog, ...(result.site ? { site: result.site } : {}) }, signal)
    } catch (err: any) {
      throw new Error(`Could not save the file linked as "${link.name || link.uri}": ${err?.message ?? err}`)
    }
    const name = uniqueName(storedNameForLink({ contentDisposition: opened.contentDisposition, contentType: opened.contentType, link }), used)
    const file = await ctx.files.save(name, opened.body, opened.contentLength)
    saved.push({ uri: link.uri, path: file.path, line: `${file.path} (${file.mimeType}, ${formatBytes(file.size)})` })
  }
  // Longest URL first: one link's URL may be the start of another's (`…/raw` and `…/raw?format=csv`).
  let text = result.text
  for (const { uri, path } of [...saved].sort((a, b) => b.uri.length - a.uri.length)) text = rewriteLinkText(text, uri, path)
  return `${text}\n\nSaved to your files: ${saved.map(s => s.line).join(', ')}.`
}

/** An error with a signed URL scrubbed from its message, stack and cause chain, in place (the identity is kept for the loop). */
const scrubError = (err: Error, signed: Map<string, string>, depth = 0) => {
  err.message = scrubUrls(err.message, signed)
  if (err.stack) err.stack = scrubUrls(err.stack, signed)
  if (err.cause instanceof Error && depth < 5) scrubError(err.cause, signed, depth + 1)
  else if (err.cause !== undefined) err.cause = scrubUrls(String(err.cause), signed)
}

const toSignedUrls = async (args: unknown, fileArgs: string[], files: TurnFiles, signed: Map<string, string>) => {
  const input: Record<string, unknown> = { ...(args && typeof args === 'object' ? args as Record<string, unknown> : {}) }
  for (const name of fileArgs) {
    const value = input[name]
    if (typeof value !== 'string') continue
    // Checks the file exists (a HEAD on S3): "no file named X here", with the list, rather than a 404 from the target.
    const { url, file } = await files.signedUrl(value)
    signed.set(url, file.path)
    input[name] = url
  }
  return input
}

export const withCallPath = (sourced: SourcedTool, ctx: CallPathContext): Tool => {
  const { tool, fileArgs } = sourced
  if (!tool.execute) return tool
  const execute = tool.execute
  return {
    ...tool,
    execute: async (args: any, opts: any) => {
      const signed = new Map<string, string>()
      const input = fileArgs?.length && ctx.files ? await toSignedUrls(args, fileArgs, ctx.files, signed) : args
      let output: unknown
      try {
        output = await execute(input, opts)
      } catch (err) {
        if (err instanceof Error && signed.size) scrubError(err, signed)
        throw err
      }
      const scrubbed = scrubOutput(output, signed)
      return isLinkedToolResult(scrubbed) ? await storeLinks(scrubbed, ctx, opts?.abortSignal) : scrubbed
    }
  } as Tool
}

/** What a gated call's approval card shows of its files (spec §4.3: path, type, size). */
export const describeFileArguments = async (fileArgs: string[] | undefined, input: unknown, files?: TurnFiles) => {
  if (!fileArgs?.length || !files || !input || typeof input !== 'object') return undefined
  const described: Record<string, { path: string, mimeType?: string, size?: number, missing?: true }> = {}
  for (const name of fileArgs) {
    const value = (input as Record<string, unknown>)[name]
    if (typeof value !== 'string') continue
    try {
      const file = await files.stat(value)
      described[name] = { path: file.path, mimeType: file.mimeType, size: file.size }
    } catch {
      described[name] = { path: value, missing: true }
    }
  }
  return Object.keys(described).length ? described : undefined
}

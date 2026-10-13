/**
 * THE CALL PATH (spec §4.4): the layer every tool call goes through, under the provenance envelope
 * (modelTools, conversations/operations.ts). A call made by the model and a call made from a script
 * (`mode: 'code'`) are the same call: same file handling, same recording, same guards.
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
import { displayUrl } from '../web/operations.ts'
import { FileError, invalidPathMessage, scrubUrls, isLinkedToolResult, storedNameForLink, uniqueName, rewriteLinkText, formatBytes, type LinkedToolResult, type FileRecord, type LinkOrigin, type ResourceLink } from './operations.ts'

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
 *
 * A link that cannot be saved does NOT fail the call: the tool already ran (a retry would repeat its side
 * effects), and turning a file store on must not break tools that worked. The result says which link was not
 * saved and why; its URL (possibly presigned) is reduced to origin and path.
 */
const saveLinks = async (result: LinkedToolResult, ctx: CallPathContext, signal?: AbortSignal) => {
  const used = new Set<string>()
  const saved: { uri: string, record: FileRecord, line: string }[] = []
  const failed: { uri: string, line: string }[] = []
  for (const link of result.links) {
    try {
      const opened = await ctx.openLink!(link, { catalog: result.catalog, ...(result.site ? { site: result.site } : {}) }, signal)
      const name = uniqueName(storedNameForLink({ contentDisposition: opened.contentDisposition, contentType: opened.contentType, link }), used)
      const file = await ctx.files!.save(name, opened.body, opened.contentLength)
      saved.push({ uri: link.uri, record: { file_path: file.path, mimeType: file.mimeType, size: file.size }, line: `${file.path} (${file.mimeType}, ${formatBytes(file.size)})` })
    } catch (err: any) {
      // the turn was stopped: stop, rather than report every remaining link as failed
      if (signal?.aborted) throw err
      const shown = displayUrl(link.uri)
      failed.push({ uri: link.uri, line: `Could not save the file linked as ${link.name || shown}: ${String(err?.message ?? err).split(link.uri).join(shown)}` })
    }
  }
  // Longest URL first: one link's URL may be the start of another's (`…/raw` and `…/raw?format=csv`).
  let text = result.text
  for (const { uri, record } of [...saved].sort((a, b) => b.uri.length - a.uri.length)) text = rewriteLinkText(text, uri, record.file_path)
  for (const { uri } of failed) text = text.split(uri).join(displayUrl(uri))
  return { text, saved, failed }
}

/** For the model: the rewritten text, then what was saved and what was not, as lines. */
const storeLinks = async (result: LinkedToolResult, ctx: CallPathContext, signal?: AbortSignal): Promise<string> => {
  if (!ctx.files || !ctx.openLink) return result.text
  const { text, saved, failed } = await saveLinks(result, ctx, signal)
  return [
    text,
    ...(saved.length ? [`\nSaved to your files: ${saved.map(s => s.line).join(', ')}.`] : []),
    ...(failed.length ? [`${saved.length ? '' : '\n'}${failed.map(f => f.line).join('\n')}`] : [])
  ].join('\n')
}

/** For a script: the rewritten text and the stored files as records; a link not saved is an `errors` line. */
const linkRecords = async (result: LinkedToolResult, ctx: CallPathContext, signal?: AbortSignal): Promise<string | { text: string, files: FileRecord[], errors?: string[] }> => {
  if (!ctx.files || !ctx.openLink) return result.text
  const { text, saved, failed } = await saveLinks(result, ctx, signal)
  return { text, files: saved.map(s => s.record), ...(failed.length ? { errors: failed.map(f => f.line) } : {}) }
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
    if (value === undefined || value === null) continue
    // a path is a string: anything else is refused, never handed to the target as it is
    if (typeof value !== 'string') throw new FileError(invalidPathMessage(JSON.stringify(value)))
    // Checks the file exists (a HEAD on S3): "no file named X here", with the list, rather than a 404 from the target.
    const { url, file } = await files.signedUrl(value)
    signed.set(url, file.path)
    input[name] = url
  }
  return input
}

export const withCallPath = (sourced: SourcedTool, ctx: CallPathContext, mode: 'model' | 'code' = 'model'): Tool => {
  const { tool, fileArgs } = sourced
  // A script gets the tool's data form when it has one (SourcedTool.codeExecute); the model always its text.
  const execute = mode === 'code' ? (sourced.codeExecute ?? tool.execute) : tool.execute
  if (!execute) return tool
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
      if (!isLinkedToolResult(scrubbed)) return scrubbed
      return mode === 'code' ? await linkRecords(scrubbed, ctx, opts?.abortSignal) : await storeLinks(scrubbed, ctx, opts?.abortSignal)
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

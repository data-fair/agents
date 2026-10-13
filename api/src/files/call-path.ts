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
import { scrubUrls } from './operations.ts'

export interface CallPathContext {
  /** The turn's files; undefined when files are off (the personal assistant, or no store). */
  files?: TurnFiles
}

const scrubOutput = (output: unknown, signed: Map<string, string>): unknown => {
  if (!signed.size) return output
  if (typeof output === 'string') return scrubUrls(output, signed)
  if (isMediaToolResult(output)) return { ...output, ...(output.text !== undefined ? { text: scrubUrls(output.text, signed) } : {}) }
  if (output && typeof output === 'object') return JSON.parse(scrubUrls(JSON.stringify(output), signed))
  return output
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
        if (err instanceof Error && signed.size) err.message = scrubUrls(err.message, signed)
        throw err
      }
      return scrubOutput(output, signed)
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

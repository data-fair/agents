/**
 * The file tools, named and shaped after the de-facto convention (Claude Code, LangChain deepagents), so
 * the model meets names it was trained on: ls, read_file, write_file. No edit_file, glob, grep or
 * delete_file: files expire, and nothing needs them yet (spec §4.1). Wired by a service-tools entry.
 */
import { createHash } from 'node:crypto'
import { tool, jsonSchema, type Tool } from 'ai'
import type { TurnFiles } from './turn-files.ts'
import {
  FileError, pagingArgument, isTextType, mimeTypeOf, parseFilePath, renderFileList, renderTextPage, binaryFileMessage, formatBytes,
  READ_LINES_DEFAULT, READ_LINES_MAX, WRITE_MAX_BYTES, READ_MAX_BYTES, type FileRecord
} from './operations.ts'

/**
 * A written file's hash, as a download's (DownloadRecord): the one a tool that takes the file answers (import_table's), so
 * the record shows the file it received is the one written.
 */
const sha256Of = (content: string) => createHash('sha256').update(content).digest('hex')

/** write_file's checks, against the size a caller is held to: the model's WRITE_MAX_BYTES, or a script's. */
const checkWritable = (input: { file_path: string, content: string }, maxBytes: number) => {
  const name = parseFilePath(input.file_path)
  if (!isTextType(mimeTypeOf(name))) throw new FileError(`write_file writes text: give ${input.file_path} the extension of a text type (.csv, .json, .txt, .md…).`)
  if (typeof input.content !== 'string') throw new FileError('content must be a string: the whole text of the file.')
  if (Buffer.byteLength(input.content) > maxBytes) throw new FileError(`write_file writes at most ${formatBytes(maxBytes)} of text.`)
  return name
}

export const createFileTools = (files: TurnFiles): Record<string, Tool> => ({
  ls: tool({
    description: 'List your files: their path, type, size and when they expire. Your files belong to this conversation (or this task run), and each one is deleted 7 days after it was last written.',
    inputSchema: jsonSchema<unknown>({ type: 'object', additionalProperties: false, properties: {} }),
    execute: async () => renderFileList(await files.list())
  }),
  read_file: tool({
    description: `Read one of your text files, a page of lines at a time, numbered (offset is 0-based; ${READ_LINES_DEFAULT} lines by default). A binary file cannot be read: pass its path to a tool that takes a file.`,
    inputSchema: jsonSchema<{ file_path: string, offset?: number, limit?: number }>({
      type: 'object',
      additionalProperties: false,
      required: ['file_path'],
      properties: {
        file_path: { type: 'string', description: 'The path of the file, as ls lists it, e.g. "/data.csv"' },
        offset: { type: 'integer', minimum: 0, description: 'The first line to read, 0-based' },
        limit: { type: 'integer', minimum: 1, maximum: READ_LINES_MAX, description: 'How many lines to read' }
      }
    }),
    execute: async (input: { file_path: string, offset?: number, limit?: number }) => {
      const offset = pagingArgument(input.offset, 'offset', 0, 0)
      const limit = pagingArgument(input.limit, 'limit', READ_LINES_DEFAULT, 1)
      const file = await files.stat(input.file_path)
      if (!isTextType(file.mimeType)) return binaryFileMessage(file)
      const { text, truncated } = await files.readText(file.path)
      return renderTextPage(file, text, offset, limit, truncated)
    }
  }),
  write_file: tool({
    description: `Create or overwrite one of your text files (at most ${formatBytes(WRITE_MAX_BYTES)}): a CSV, JSON, Markdown or plain text file. Its extension gives its type.`,
    inputSchema: jsonSchema<{ file_path: string, content: string }>({
      type: 'object',
      additionalProperties: false,
      required: ['file_path', 'content'],
      properties: {
        file_path: { type: 'string', description: 'A path with one name and an extension, e.g. "/clean.csv"' },
        content: { type: 'string', description: 'The whole content of the file' }
      }
    }),
    // The schema above is advertised, not enforced, by the AI SDK: validated here.
    execute: async (input: { file_path: string, content: string }) => {
      const name = checkWritable(input, WRITE_MAX_BYTES)
      const file = await files.writeText(`/${name}`, input.content)
      return `Wrote ${file.path} (${file.mimeType}, ${formatBytes(file.size)}, sha256 ${sha256Of(input.content)}).`
    }
  })
})

/**
 * What a SCRIPT gets from the file tools (spec §6.4): records and whole files rather than the model's rendered
 * text and pages. write_file takes up to READ_MAX_BYTES from a script — the size it can read back — where the
 * model is held to WRITE_MAX_BYTES of text it would have had to write out in full.
 */
export const createFileCodeExecutes = (files: TurnFiles) => ({
  ls: async (_input?: unknown) => (await files.list()).map(f => ({ file_path: f.path, mimeType: f.mimeType, size: f.size, expiresAt: f.expiresAt.toISOString() })),
  read_file: async (input: { file_path: string }) => {
    const file = await files.stat(input.file_path)
    if (!isTextType(file.mimeType)) throw new FileError(binaryFileMessage(file))
    const { text, truncated } = await files.readText(file.path)
    if (truncated) throw new FileError(`${file.path} is larger than ${formatBytes(READ_MAX_BYTES)}, the most a script reads. Pass its path to a tool that takes a file instead.`)
    return text
  },
  write_file: async (input: { file_path: string, content: string }) => {
    const name = checkWritable(input, READ_MAX_BYTES)
    const file = await files.writeText(`/${name}`, input.content)
    return { file_path: file.path, mimeType: file.mimeType, size: file.size, sha256: sha256Of(input.content) } satisfies FileRecord & { sha256: string }
  }
})

const FILE_RECORD_SCHEMA = {
  type: 'object',
  required: ['file_path', 'mimeType', 'size'],
  properties: { file_path: { type: 'string' }, mimeType: { type: 'string' }, size: { type: 'number' } }
} as const

/**
 * Each code file tool's own signature in code_mode's description: what it says, takes and returns
 * (SourcedTool.codeDescription, codeInputSchema, codeOutputSchema). Not the model's: a script reads a whole file, not
 * numbered pages, and writes up to 10 MB, not 1 MB. With the model's, a script paged through read_file with an
 * offset it ignores, and stripped line numbers it never gets (the code-mode simulation, 2026-10-14).
 */
const PATH_ARGUMENT = { type: 'string', description: 'The path of the file, as ls lists it, e.g. "/data.csv"' }
export const FILE_CODE_SIGNATURES = {
  ls: {
    codeDescription: 'List your files: path, type, size and when each expires.',
    codeInputSchema: { type: 'object', properties: {} },
    codeOutputSchema: { type: 'array', items: { ...FILE_RECORD_SCHEMA, required: [...FILE_RECORD_SCHEMA.required, 'expiresAt'], properties: { ...FILE_RECORD_SCHEMA.properties, expiresAt: { type: 'string' } } } }
  },
  read_file: {
    codeDescription: `Read the whole text of one of your text files (up to ${formatBytes(READ_MAX_BYTES)}), as a string: no line numbers, no pages. Parse a CSV with Papa.parse(text, { header: true, skipEmptyLines: true }). A binary file cannot be read: pass its path to a tool that takes a file.`,
    codeInputSchema: { type: 'object', required: ['file_path'], properties: { file_path: PATH_ARGUMENT } },
    codeOutputSchema: { type: 'string' }
  },
  write_file: {
    codeDescription: `Create or overwrite one of your text files (up to ${formatBytes(READ_MAX_BYTES)}): CSV, JSON, Markdown or plain text, typed by its extension; make CSV content with Papa.unparse(rows). Answers its record, with the content's sha256.`,
    codeInputSchema: { type: 'object', required: ['file_path', 'content'], properties: { file_path: { type: 'string', description: 'A path with one name and an extension, e.g. "/clean.csv"' }, content: { type: 'string', description: 'The whole content of the file' } } },
    codeOutputSchema: { ...FILE_RECORD_SCHEMA, required: [...FILE_RECORD_SCHEMA.required, 'sha256'], properties: { ...FILE_RECORD_SCHEMA.properties, sha256: { type: 'string' } } }
  }
} satisfies Record<keyof ReturnType<typeof createFileCodeExecutes>, { codeDescription: string, codeInputSchema: Record<string, unknown>, codeOutputSchema: Record<string, unknown> }>

/**
 * The file tools, named and shaped after the de-facto convention (Claude Code, LangChain deepagents), so
 * the model meets names it was trained on: ls, read_file, write_file. No edit_file, glob, grep or
 * delete_file: files expire, and nothing needs them yet (spec §4.1). Wired by a service-tools entry.
 */
import { tool, jsonSchema, type Tool } from 'ai'
import type { TurnFiles } from './turn-files.ts'
import {
  FileError, isTextType, mimeTypeOf, parseFilePath, renderFileList, renderTextPage, binaryFileMessage, formatBytes,
  READ_LINES_DEFAULT, READ_LINES_MAX, WRITE_MAX_BYTES
} from './operations.ts'

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
      const file = await files.stat(input.file_path)
      if (!isTextType(file.mimeType)) return binaryFileMessage(file)
      const { text, truncated } = await files.readText(file.path)
      return renderTextPage(file, text, input.offset ?? 0, input.limit ?? READ_LINES_DEFAULT, truncated)
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
      const name = parseFilePath(input.file_path)
      if (!isTextType(mimeTypeOf(name))) throw new FileError(`write_file writes text: give ${input.file_path} the extension of a text type (.csv, .json, .txt, .md…).`)
      if (typeof input.content !== 'string') throw new FileError('content must be a string: the whole text of the file.')
      if (Buffer.byteLength(input.content) > WRITE_MAX_BYTES) throw new FileError(`write_file writes at most ${formatBytes(WRITE_MAX_BYTES)} of text.`)
      const file = await files.writeText(`/${name}`, input.content)
      return `Wrote ${file.path} (${file.mimeType}, ${formatBytes(file.size)}).`
    }
  })
})

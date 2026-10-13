/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 *
 * The rules of the autonomous agents' file store (docs/architecture/agent-files.md): names, keys and
 * scopes, types, signed URLs, the bounds and the messages the model reads.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'
import mime from 'mime-types'
import type { ApiConfig } from '../../config/type/index.ts'

export const FILES_ROOT = 'agent-files'
/** Spec §3: a download over a bound is aborted, never stored truncated. */
export const FILE_MAX_BYTES = 100_000_000
export const SCOPE_MAX_BYTES = 500_000_000
/** Spec §3: the sweep removes what was last written more than this long ago. */
export const FILE_TTL_MS = 7 * 24 * 3600 * 1000
/** Spec §4.3: a signed file URL is valid about ten minutes. */
export const SIGNED_URL_TTL_SECONDS = 600
/** What read_file reads of a text file at most (spec §4.1, §6.4). */
export const READ_MAX_BYTES = 10_000_000
/** write_file writes small text files; anything larger is a download or (plan 4) a script. */
export const WRITE_MAX_BYTES = 1_000_000
export const READ_LINES_DEFAULT = 500
export const READ_LINES_MAX = 2000
/** Characters per read_file page: the web reader's page size (api/src/web/operations.ts PAGE_SIZE). */
export const READ_PAGE_CHARS = 20_000

export const FILE_TOOL_NAMES = ['ls', 'read_file', 'write_file'] as const
/** The source a stored file tool call names, like `agent-web` for the web readers. */
export const FILES_SERVER_ID = 'agent-files'

/** A failure whose message is written for the model: it says what is wrong and what to do. */
export class FileError extends Error {}

// ---- names ----

const MAX_NAME_LENGTH = 100
const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*\.[A-Za-z0-9]{1,10}$/

/** One segment, 1–100 characters of [A-Za-z0-9._-], starting with a letter or digit, no `..`, an extension. */
export const isStoredName = (name: string): boolean =>
  name.length <= MAX_NAME_LENGTH && NAME_PATTERN.test(name) && !name.includes('..')

export const extensionOf = (name: string): string | undefined => /\.([A-Za-z0-9]{1,10})$/.exec(name)?.[1]

export const invalidPathMessage = (input: string): string =>
  `"${input}" is not a valid file path: use one name with an extension, made of letters, digits, ".", "-" and "_", like "/report.csv".`

/** The bare name of a path the MODEL gave. Refused, not repaired: the model must know the exact name. */
export const parseFilePath = (input: unknown): string => {
  const raw = typeof input === 'string' ? input.trim() : ''
  const name = raw.startsWith('/') ? raw.slice(1) : raw
  if (!isStoredName(name)) throw new FileError(invalidPathMessage(typeof input === 'string' ? input : String(input)))
  return name
}

/** A name from a header or a link, transliterated to the stored set. Never empty; may lack an extension. */
export const fileNameFrom = (candidate: string): string => {
  const base = candidate.split(/[\\/]/).pop() ?? ''
  let name = base.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/\.{2,}/g, '.')
    .replace(/^[^A-Za-z0-9]+/, '')
    .replace(/[-.]+$/, '')
  if (name.length > MAX_NAME_LENGTH) {
    const ext = extensionOf(name)
    // a cut can end on a separator: strip it so the result is still a stored name
    const stem = (ext ? name.slice(0, MAX_NAME_LENGTH - ext.length - 1) : name.slice(0, MAX_NAME_LENGTH)).replace(/[-.]+$/, '')
    name = ext ? `${stem}.${ext}` : stem
  }
  return name || 'file'
}

// ---- scopes and keys ----

export type FileScope = { ownerType: 'user' | 'organization', ownerId: string, scopeId: string }

const ID_PATTERN = /^[A-Za-z0-9_-][A-Za-z0-9._-]{0,99}$/

/** Every component a key is built from, validated the same way the route validates what it is given. */
export const isValidScope = (scope: { ownerType?: unknown, ownerId?: unknown, scopeId?: unknown }): scope is FileScope =>
  (scope.ownerType === 'user' || scope.ownerType === 'organization') &&
  typeof scope.ownerId === 'string' && ID_PATTERN.test(scope.ownerId) &&
  typeof scope.scopeId === 'string' && ID_PATTERN.test(scope.scopeId)

/**
 * A conversation's turns share its files (an approval ends a turn, and a download → transform → gated
 * upload spans two); a task run has its own.
 */
export const scopeOfRun = (run: { kind: string, id: string, conversationId?: string, owner: { type: string, id: string } }): FileScope => {
  const scope = { ownerType: run.owner.type, ownerId: run.owner.id, scopeId: run.kind === 'task' ? run.id : run.conversationId }
  if (!isValidScope(scope)) throw new Error(`run ${run.id} has no valid file scope`)
  return scope
}

export const scopePrefix = (scope: FileScope): string => `${FILES_ROOT}/${scope.ownerType}/${scope.ownerId}/${scope.scopeId}/`
export const fileKey = (scope: FileScope, name: string): string => `${scopePrefix(scope)}${name}`

// ---- types ----

/** Types mime-db does not know, or knows under another name. */
const TYPE_OVERRIDES: Record<string, string> = { ndjson: 'application/x-ndjson' }

/** The type of a file is its extension's (data-fair types an upload the same way). */
export const mimeTypeOf = (name: string): string => {
  const ext = extensionOf(name)?.toLowerCase()
  return (ext && TYPE_OVERRIDES[ext]) || mime.lookup(name) || 'application/octet-stream'
}

/** What read_file can show the model and write_file may write. */
export const isTextType = (mimeType: string): boolean => {
  const type = mimeType.split(';')[0].trim().toLowerCase()
  return type.startsWith('text/') || type.endsWith('+json') || type.endsWith('+xml') ||
    ['application/json', 'application/xml', 'application/x-ndjson', 'application/javascript', 'application/yaml', 'application/x-yaml', 'application/sql'].includes(type)
}

export const extensionForType = (contentType: string | undefined): string | undefined => {
  const type = contentType?.split(';')[0].trim().toLowerCase()
  if (!type) return undefined
  if (type === 'application/x-ndjson') return 'ndjson'
  return mime.extension(type) || undefined
}

// ---- signed URLs ----

const signaturePayload = (scope: FileScope, name: string, exp: number) =>
  `${scope.ownerType}/${scope.ownerId}/${scope.scopeId}/${name}\n${exp}`

export const fileSignature = (secret: string, scope: FileScope, name: string, exp: number): string =>
  createHmac('sha256', secret).update(signaturePayload(scope, name, exp)).digest('base64url')

/**
 * The URL an MCP server fetches a file from. Its last path segment is the file's name with its extension:
 * openapi-mcp names the upload from it, and data-fair types an upload by name.
 */
export const signedFileUrl = (publicUrl: string, secret: string, scope: FileScope, name: string, nowSeconds: number): string => {
  const exp = nowSeconds + SIGNED_URL_TTL_SECONDS
  const path = [scope.ownerType, scope.ownerId, scope.scopeId, name].map(encodeURIComponent).join('/')
  return `${publicUrl.replace(/\/+$/, '')}/api/files/${path}?exp=${exp}&sig=${fileSignature(secret, scope, name, exp)}`
}

/** The signature is compared in constant time BEFORE the expiry is read: an invalid URL learns nothing. */
export const checkFileSignature = (secret: string, scope: FileScope, name: string, exp: unknown, sig: unknown, nowSeconds: number): 'valid' | 'invalid' | 'expired' => {
  if (typeof exp !== 'string' || !/^\d{1,12}$/.test(exp) || typeof sig !== 'string') return 'invalid'
  const expected = Buffer.from(fileSignature(secret, scope, name, Number(exp)))
  const given = Buffer.from(sig)
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return 'invalid'
  return Number(exp) < nowSeconds ? 'expired' : 'valid'
}

// ---- messages (spec §9) ----

export const formatBytes = (bytes: number): string => {
  if (bytes < 1000) return `${bytes} B`
  if (bytes < 1_000_000) return `${Number((bytes / 1000).toFixed(1))} kB`
  return `${Number((bytes / 1_000_000).toFixed(1))} MB`
}

export const noSuchFileMessage = (path: string, existing: string[]): string =>
  `There is no file named ${path} here. ${existing.length ? `Your files: ${existing.join(', ')}.` : 'You have no files yet.'}`

export const fileTooLargeMessage = (max: number): string =>
  `The file is larger than the ${formatBytes(max)} limit per file: nothing was stored.`

export const scopeFullMessage = (used: number, max: number): string =>
  `Your files would exceed the ${formatBytes(max)} limit (${formatBytes(used)} already used): nothing was stored. A file is deleted 7 days after it was last written.`

export const storageFailureMessage = (detail: string): string =>
  `The file store failed (${detail}); your other tools still work.`

// ---- config ----

export type FilesConfig = NonNullable<ApiConfig['files']>

/** Fail-fast boot validation, beside assertGlobalMcpConfig: what the schema cannot say per backend. */
export function assertFilesConfig (files: FilesConfig | undefined): void {
  if (!files) return
  if (files.storage === 'fs' && !files.dataDir) throw new Error('invalid files config: storage "fs" requires files.dataDir')
  if (files.storage === 's3' && !files.s3?.bucket) throw new Error('invalid files config: storage "s3" requires files.s3.bucket')
  let url: URL
  try { url = new URL(files.publicUrl) } catch { throw new Error(`invalid files config: files.publicUrl "${files.publicUrl}" is not a URL`) }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('invalid files config: files.publicUrl must be http(s)')
}

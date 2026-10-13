/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 *
 * The rules of the autonomous agents' file store (docs/architecture/agent-files.md): names, keys and
 * scopes, types, signed URLs, the bounds and the messages the model reads.
 */

import { displayUrl } from '../web/operations.ts'
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

// ---- what the file tools return ----

/** Recorded on every call, like the web readers' (MCP annotations: the approval policy's vocabulary). */
export const FILE_TOOL_ANNOTATIONS: Record<string, Record<string, boolean>> = {
  ls: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  read_file: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  write_file: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
}

export const renderFileList = (files: { path: string, mimeType: string, size: number, expiresAt: Date }[], scopeMax = SCOPE_MAX_BYTES): string => {
  if (!files.length) return 'You have no files.'
  const used = files.reduce((sum, f) => sum + f.size, 0)
  return [
    `Your files (${formatBytes(used)} of ${formatBytes(scopeMax)} used; a file is deleted 7 days after it was last written):`,
    ...files.map(f => `- ${f.path} — ${f.mimeType}, ${formatBytes(f.size)}, expires ${f.expiresAt.toISOString()}`)
  ].join('\n')
}

export const binaryFileMessage = (file: { path: string, mimeType: string, size: number }): string =>
  `${file.path} is ${file.mimeType} (${formatBytes(file.size)}): a binary file, which cannot be read here. Pass its path to a tool that takes a file.`

/**
 * One page of a text file, numbered like `cat -n` (Claude Code's Read, deepagents' read_file): lines from a
 * 0-based `offset`, at most `limit` of them and READ_PAGE_CHARS characters, then where to read on.
 */
export const renderTextPage = (file: { path: string, mimeType: string, size: number }, text: string, offset = 0, limit = READ_LINES_DEFAULT, truncated = false): string => {
  if (text === '') return `${file.path} (${file.mimeType}, ${formatBytes(file.size)}): empty file.`
  const lines = text.split('\n')
  if (text.endsWith('\n')) lines.pop()
  const described = `${file.path} (${file.mimeType}, ${formatBytes(file.size)}, ${lines.length} lines${truncated ? ` in its first ${formatBytes(READ_MAX_BYTES)}` : ''})`
  const start = Math.max(0, Math.floor(offset))
  if (start >= lines.length && lines.length) return `${described}: nothing from offset ${start}, the file has ${lines.length} lines.`
  const count = Math.min(Math.max(1, Math.floor(limit)), READ_LINES_MAX)
  const out: string[] = []
  let chars = 0
  let end = start
  while (end < lines.length && end < start + count) {
    let line = `${String(end + 1).padStart(6)}\t${lines[end]}`
    if (line.length > READ_PAGE_CHARS) {
      line = `${line.slice(0, READ_PAGE_CHARS)}…\n[line ${end + 1} cut at ${READ_PAGE_CHARS.toLocaleString('en-US')} characters: the rest of that line cannot be reached with offset]`
    }
    if (out.length && chars + line.length > READ_PAGE_CHARS) break
    out.push(line)
    chars += line.length + 1
    end++
  }
  return [`${described}: lines ${start + 1}-${end}`, ...out, end < lines.length ? `Read on with offset ${end}.` : 'End of file.'].join('\n')
}

// ---- file arguments (spec §4.3) ----

const filePathProperty = (property: Record<string, any>): Record<string, any> => {
  const marker = property['x-mcp-file'] as Record<string, unknown>
  const accept = typeof marker.accept === 'string' ? [marker.accept] : Array.isArray(marker.accept) ? marker.accept.filter((a): a is string => typeof a === 'string') : []
  const parts = ['The path of one of your files, as ls lists it (for example "/data.csv").']
  if (accept.length) parts.push(`Accepted types: ${accept.join(', ')}.`)
  if (typeof marker.maxSize === 'number') parts.push(`At most ${formatBytes(marker.maxSize)}.`)
  if (typeof property.description === 'string' && property.description) parts.push(property.description)
  return { type: 'string', description: parts.join(' ') }
}

/**
 * A tool's input schema as the model is offered it: each TOP-LEVEL property carrying `x-mcp-file` (the
 * keyword of the MCP file-input proposals, SEP-2356 / SEP-2631; openapi-mcp produces nothing deeper) becomes
 * "the path of one of your files". `accept` and `maxSize` stay in the description: the target enforces them.
 * `format: 'uri'` goes — the model gives a path, the call path gives the URL.
 */
export const fileArgumentsOf = (inputSchema: unknown): { schema: Record<string, any>, fileArgs: string[] } => {
  const schema = (inputSchema && typeof inputSchema === 'object' ? inputSchema : { type: 'object', properties: {} }) as Record<string, any>
  const properties = schema.properties && typeof schema.properties === 'object' ? schema.properties as Record<string, any> : {}
  const fileArgs = Object.keys(properties).filter(name => {
    const marker = properties[name]?.['x-mcp-file']
    return !!marker && typeof marker === 'object'
  })
  if (!fileArgs.length) return { schema, fileArgs }
  const rewritten = { ...properties }
  for (const name of fileArgs) rewritten[name] = filePathProperty(properties[name])
  return { schema: { ...schema, properties: rewritten }, fileArgs }
}

/** Every signed URL of a call, whole then without its query, replaced by its path: nothing the model reads carries one. */
export const scrubUrls = (text: string, replacements: Map<string, string>): string => {
  let scrubbed = text
  for (const [url, path] of replacements) {
    scrubbed = scrubbed.split(url).join(path).split(url.split('?')[0]).join(path)
  }
  return scrubbed
}

// ---- links (spec §4.2) ----

export interface ResourceLink { uri: string, name: string, mimeType?: string }

/** Where a link came from: a catalog server or not, and the site its call was bound to (a site-bound entry). */
export interface LinkOrigin { catalog: boolean, site?: string }

/** An MCP result carrying links, until the call path stores them; never stored or shown as such. */
export interface LinkedToolResult extends LinkOrigin {
  _agentsLinkResult: true
  text: string
  links: ResourceLink[]
}

export const isLinkedToolResult = (value: unknown): value is LinkedToolResult =>
  !!value && typeof value === 'object' && (value as LinkedToolResult)._agentsLinkResult === true && Array.isArray((value as LinkedToolResult).links)

/** The http(s) `resource_link`s of an MCP result (MCP 2026-07-28: a URI the client fetches itself). */
export const resourceLinksOf = (callResult: { content?: unknown[] }): ResourceLink[] =>
  (callResult.content ?? []).flatMap((item: any) =>
    item?.type === 'resource_link' && typeof item.uri === 'string' && /^https?:\/\//i.test(item.uri)
      ? [{ uri: item.uri, name: typeof item.name === 'string' ? item.name : '', ...(typeof item.mimeType === 'string' ? { mimeType: item.mimeType } : {}) }]
      : [])

/** A formatted result with its links attached, for the call path. Only a text result: images keep today's behaviour. */
export const withResourceLinks = <T>(formatted: T, callResult: { content?: unknown[] }, origin: LinkOrigin): T | LinkedToolResult => {
  const links = resourceLinksOf(callResult)
  if (!links.length || typeof formatted !== 'string') return formatted
  return { _agentsLinkResult: true, text: formatted, links, catalog: origin.catalog, ...(origin.site ? { site: origin.site } : {}) }
}

/**
 * THE CREDENTIAL RULE (spec §4.2): a link is fetched as its call was made — with the call's session, when it
 * had one — only when a CATALOG server returned it and its origin is the site that call was bound to. The
 * URL is then the output of a tool an admin selected, on the site the call acted on. Anything else is
 * fetched anonymously, under fetch_url's allowlist. Returns that site's origin, or undefined.
 */
export const linkCredentialSite = (uri: string, origin: LinkOrigin): string | undefined => {
  if (!origin.catalog || !origin.site) return undefined
  try {
    const site = new URL(origin.site).origin
    return new URL(uri).origin === site ? site : undefined
  } catch {
    return undefined
  }
}

/** The file name of a Content-Disposition header: `filename*` (RFC 5987) first, then `filename`. */
export const dispositionFilename = (header: string | undefined): string | undefined => {
  if (!header) return undefined
  const star = /filename\*\s*=\s*[^']*'[^']*'([^;]+)/i.exec(header)
  if (star) {
    try { return decodeURIComponent(star[1].trim().replace(/^"|"$/g, '')) } catch {}
  }
  const quoted = /filename\s*=\s*"((?:\\.|[^"\\])*)"/i.exec(header)
  if (quoted) return quoted[1].replace(/\\(.)/g, '$1')
  return /filename\s*=\s*([^;\s]+)/i.exec(header)?.[1]
}

/**
 * The stored name of a fetched link: the response's Content-Disposition, else the link's name, else its
 * URL's last segment — then an extension from the response type, else the link's type, else `.bin`.
 * data-fair's /raw and /convert URLs carry no extension, and a file stored without one could not be
 * uploaded again (data-fair types an upload by its name).
 */
export const storedNameForLink = (input: { contentDisposition?: string, contentType?: string, link: ResourceLink }): string => {
  const lastSegment = (() => { try { return decodeURIComponent(new URL(input.link.uri).pathname.split('/').pop() ?? '') } catch { return '' } })()
  const name = fileNameFrom(dispositionFilename(input.contentDisposition) || input.link.name || lastSegment)
  if (extensionOf(name)) return name
  const ext = extensionForType(input.contentType) ?? extensionForType(input.link.mimeType) ?? 'bin'
  return fileNameFrom(`${name.slice(0, 100 - ext.length - 1)}.${ext}`)
}

export const uniqueName = (name: string, used: Set<string>): string => {
  let candidate = name
  const ext = extensionOf(name)
  const base = ext ? name.slice(0, -ext.length - 1) : name
  for (let i = 2; used.has(candidate); i++) candidate = ext ? `${base}-${i}.${ext}` : `${base}-${i}`
  used.add(candidate)
  return candidate
}

/** The link's text block names its URL (spec §4.2 seams): the model reads the stored path there instead. */
export const rewriteLinkText = (text: string, uri: string, path: string): string => text.split(uri).join(path)

/** The text of an error result, with the URL of any link it carried reduced to origin and path: it may be presigned. */
export const hideLinkUris = (text: string, callResult: { content?: unknown[] }): string =>
  resourceLinksOf(callResult).reduce((acc, link) => acc.split(link.uri).join(displayUrl(link.uri)), text)

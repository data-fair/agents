/**
 * service.ts contains stateful logic (config, mongo) built on top of operations.ts
 *
 * The deployment's file store, when one is configured (`files`, docs/architecture/agent-files.md), and the
 * per-turn handle on it.
 */
import config from '#config'
import locks from '@data-fair/lib-node/locks.js'
import type { ConversationRun } from '#types'
import type { FileBackend } from './types.ts'
import { FsBackend } from './fs.ts'
import { S3Backend } from './s3.ts'
import { createTurnFiles, type StoredFile, type TurnFiles } from './turn-files.ts'
import { FILES_ROOT, FILE_TTL_MS, isValidScope, scopeOfRun, scopePrefix, signedFileUrl, type FileScope } from './operations.ts'

let store: FileBackend | undefined | null = null

/** The configured backend, built once; undefined when files are off. */
export const fileStore = (): FileBackend | undefined => {
  if (store === null) {
    const files = config.files
    store = !files
      ? undefined
      : files.storage === 's3'
        ? new S3Backend({ ...files.s3, bucket: files.s3!.bucket! })
        : new FsBackend(files.dataDir!)
  }
  return store
}

/** The files of this run's scope (its conversation, or itself for a task run); undefined when files are off. */
export const turnFilesFor = (run: ConversationRun): TurnFiles | undefined => {
  const backend = fileStore()
  if (!backend || !config.files) return undefined
  return createTurnFiles({ backend, scope: scopeOfRun(run), secret: config.files.secret, publicUrl: config.files.publicUrl })
}

/**
 * Deleting a conversation deletes its files at once (spec §3), whether the conversation is purged or
 * archived: files are not review material. Logged, never thrown: the delete has already happened.
 */
export const deleteConversationFiles = async (owner: { type: string, id: string }, conversationId: string): Promise<void> => {
  const backend = fileStore()
  const scope = { ownerType: owner.type, ownerId: owner.id, scopeId: conversationId }
  if (!backend || !isValidScope(scope)) return
  await backend.removeDir(scopePrefix(scope)).catch(err => console.error(`could not delete the files of conversation ${conversationId}`, err))
}

/**
 * THE cleanup (spec §3): remove every file last written more than 7 days ago, under `prefix` (the whole
 * store by default). One listing, the same on both backends; retention and account deletion included.
 */
export const sweepFiles = async (now = new Date(), prefix = `${FILES_ROOT}/`): Promise<number> => {
  const backend = fileStore()
  if (!backend) return 0
  if (!prefix.startsWith(`${FILES_ROOT}/`)) throw new Error(`the sweep only reaches ${FILES_ROOT}/`)
  const listed = prefix.endsWith('/') ? prefix : `${prefix}/`
  const cutoff = now.getTime() - FILE_TTL_MS
  const stale = (await backend.lsrWithStats(listed)).filter(file => file.lastModified.getTime() < cutoff)
  let removed = 0
  for (const file of stale) {
    // one failing key must not abort the pass; the next one retries it
    try {
      await backend.removeFile(`${listed}${file.path}`)
      removed++
    } catch (err) {
      console.error('[files] could not sweep a file', err instanceof Error ? err.message : err)
    }
  }
  return removed
}

const SWEEP_LOCK = 'agent-files-sweep'

/** The periodic pass: one instance at a time (a listing of the whole store is not free on S3). */
export const sweepFilesOnce = async (): Promise<void> => {
  if (!await locks.acquire(SWEEP_LOCK, 'files')) return
  try {
    const removed = await sweepFiles()
    if (removed) console.log(`[files] swept ${removed} file(s) last written more than 7 days ago`)
  } finally {
    await locks.release(SWEEP_LOCK)
  }
}

// ---- for the test-env seams (api/src/test-env/router.ts) ----

export const listScopeFiles = async (scope: FileScope): Promise<StoredFile[]> => {
  const backend = fileStore()
  if (!backend || !config.files) return []
  return await createTurnFiles({ backend, scope, secret: config.files.secret, publicUrl: config.files.publicUrl }).list()
}

export const signScopeFileUrl = (scope: FileScope, name: string, now: Date): string => {
  if (!config.files) throw new Error('no file store is configured')
  return signedFileUrl(config.files.publicUrl, config.files.secret, scope, name, Math.floor(now.getTime() / 1000))
}

/** The files of every `test*` owner, as the reset removes their documents. */
export const removeTestOwnersFiles = async (): Promise<void> => {
  const backend = fileStore()
  if (!backend) return
  for (const ownerType of ['organization', 'user']) {
    const owners = new Set((await backend.lsrWithStats(`${FILES_ROOT}/${ownerType}/`)).map(file => file.path.split('/')[0]).filter(id => id.startsWith('test')))
    for (const ownerId of owners) await backend.removeDir(`${FILES_ROOT}/${ownerType}/${ownerId}/`)
  }
}

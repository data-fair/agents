/**
 * service.ts contains stateful logic (mongo, config) built on top of operations.ts
 *
 * Persisting memory changes. Every change is decided by operations.ts against the store as loaded,
 * then written under a VERSION PRECONDITION and recorded in the append-only version log — so two runs
 * of one agent, a consolidation and an admin editing at once can never overwrite each other silently.
 */

import mongo from '#mongo'
import { nanoid } from 'nanoid'
import type { AccountKeys } from '@data-fair/lib-express'
import type { AgentMemory, AgentMemoryVersion } from '#types'
import {
  applyMemoryCommand, userWriteChange, restoreChange, normalizeMemoryPath, MEMORY_LIMITS, MemoryCommandError, MemoryConflictError,
  type MemoryAuthor, type MemoryChange
} from './operations.ts'

export const loadMemory = async (storeId: string): Promise<AgentMemory[]> =>
  await mongo.agentMemories
    .find({ storeId }, { projection: { _id: 0 } })
    .sort({ path: 1 })
    // Bounded by the caps; +1 so a store that somehow outgrew them still shows it.
    .limit(MEMORY_LIMITS.documents + 1)
    .toArray()

const isDuplicateKey = (err: any) => err?.code === 11000

/**
 * Write one change under its precondition. FALSE when the precondition was lost to a concurrent
 * writer — the caller re-reads and re-decides rather than overwriting.
 */
const persistChange = async (storeId: string, owner: AccountKeys, change: MemoryChange, author: MemoryAuthor): Promise<AgentMemory | false> => {
  const now = new Date().toISOString()
  const newVersion = change.op === 'delete' ? 0 : change.expectedVersion + 1
  // The version row goes FIRST, carrying the version the document will get. Without transactions, an
  // interruption can then leave a row for a change that never landed (reconcilable against the
  // document) but never a change with no record — which is the one that cannot be reconstructed.
  // Accepted window: the row is visible (history, restore, redact) before its document write lands.
  // It is removed again when the precondition is lost or the document write throws.
  const version: AgentMemoryVersion = {
    id: nanoid(),
    storeId,
    owner,
    path: change.path,
    ...(change.op === 'rename' ? { previousPath: change.previousPath } : {}),
    op: change.op === 'create' || change.op === 'update' ? (change.expectedVersion === 0 ? 'create' : 'update') : change.op,
    version: change.op === 'delete' ? change.expectedVersion : newVersion,
    ...(change.op !== 'delete' ? { description: change.description, content: change.content } : {}),
    author,
    createdAt: now
  }
  await mongo.agentMemoryVersions.insertOne({ ...version })
  let written: AgentMemory | false
  try {
    written = await writeDocument(storeId, owner, change, author, now)
  } catch (err) {
    await mongo.agentMemoryVersions.deleteOne({ storeId, id: version.id }).catch(() => {})
    throw err
  }
  if (!written) await mongo.agentMemoryVersions.deleteOne({ storeId, id: version.id })
  return written
}

/**
 * The document write under its precondition. A rename is the one non-transactional window left (the
 * dev mongo is standalone): insert the new path, then remove the old under its version, undoing the
 * insert if that precondition was lost. A crash BETWEEN the two leaves both paths; the log row exists.
 */
const writeDocument = async (storeId: string, owner: AccountKeys, change: MemoryChange, author: MemoryAuthor, now: string): Promise<AgentMemory | false> => {
  if (change.op === 'delete') {
    const deleted = await mongo.agentMemories.deleteOne({ storeId, path: change.path, version: change.expectedVersion })
    return deleted.deletedCount ? ({ storeId, owner, path: change.path } as AgentMemory) : false
  }
  if (change.op === 'rename') {
    const doc: AgentMemory = { storeId, owner, path: change.path, description: change.description, content: change.content, version: change.expectedVersion + 1, createdAt: now, updatedAt: now, updatedBy: author }
    try { await mongo.agentMemories.insertOne({ ...doc }) } catch (err) { if (isDuplicateKey(err)) return false; throw err }
    const removed = await mongo.agentMemories.deleteOne({ storeId, path: change.previousPath, version: change.expectedVersion })
    if (!removed.deletedCount) { await mongo.agentMemories.deleteOne({ storeId, path: change.path, version: doc.version }); return false }
    return doc
  }
  if (change.expectedVersion === 0) {
    const doc: AgentMemory = { storeId, owner, path: change.path, description: change.description, content: change.content, version: 1, createdAt: now, updatedAt: now, updatedBy: author }
    try { await mongo.agentMemories.insertOne({ ...doc }) } catch (err) { if (isDuplicateKey(err)) return false; throw err }
    return doc
  }
  const updated = await mongo.agentMemories.findOneAndUpdate(
    { storeId, path: change.path, version: change.expectedVersion },
    { $set: { description: change.description, content: change.content, updatedAt: now, updatedBy: author }, $inc: { version: 1 } },
    { returnDocument: 'after', projection: { _id: 0 } }
  )
  return updated ?? false
}

/** What the `memory` tool runs. Returns the model-facing result; throws MemoryCommandError. */
export const executeMemoryCommand = async (storeId: string, owner: AccountKeys, input: unknown, author: MemoryAuthor, opts: { allowDelete: boolean }): Promise<string> => {
  // One retry, decided afresh: the second attempt re-reads the store, so a str_replace whose text the
  // concurrent writer removed now fails with an honest "not found" instead of resurrecting it.
  for (let attempt = 0; attempt < 2; attempt++) {
    const { result, change } = applyMemoryCommand(await loadMemory(storeId), input, opts)
    if (!change) return result
    if (await persistChange(storeId, owner, change, author)) return result
  }
  throw new MemoryCommandError('Conflict: this document was changed concurrently. View it and retry.')
}

export const writeMemoryAsUser = async (storeId: string, owner: AccountKeys, path: string, body: Record<string, unknown>, user: { id: string, name?: string }) => {
  const change = userWriteChange(await loadMemory(storeId), path, body)
  const written = await persistChange(storeId, owner, change, { kind: 'user', userId: user.id, ...(user.name ? { userName: user.name } : {}) })
  if (!written) throw new MemoryConflictError(`${change.path} was changed since it was loaded; reload it.`)
  return written
}

export const deleteMemoryAsUser = async (storeId: string, owner: AccountKeys, rawPath: string, version: number, user: { id: string, name?: string }) => {
  const path = normalizeMemoryPath(rawPath)
  const written = await persistChange(storeId, owner, { op: 'delete', path, expectedVersion: version }, { kind: 'user', userId: user.id, ...(user.name ? { userName: user.name } : {}) })
  if (!written) throw new MemoryConflictError(`${path} was changed since it was loaded; reload it.`)
}

export const listMemoryVersions = async (storeId: string, opts: { path?: string, skip: number, limit: number }) => {
  const filter = { storeId, ...(opts.path ? { path: normalizeMemoryPath(opts.path) } : {}) }
  const [results, count] = await Promise.all([
    mongo.agentMemoryVersions.find(filter, { projection: { _id: 0 } }).sort({ createdAt: -1, _id: -1 }).skip(opts.skip).limit(opts.limit).toArray(),
    mongo.agentMemoryVersions.countDocuments(filter)
  ])
  return { count, results }
}

/** Restore = write that version's content again, as a NEW version. History is never rewound. */
export const restoreMemoryVersion = async (storeId: string, owner: AccountKeys, versionId: string, user: { id: string, name?: string }) => {
  const version = await mongo.agentMemoryVersions.findOne({ storeId, id: versionId }, { projection: { _id: 0 } })
  if (!version) throw new MemoryCommandError('unknown version')
  const change = restoreChange(await loadMemory(storeId), version)
  const written = await persistChange(storeId, owner, change, { kind: 'user', userId: user.id, ...(user.name ? { userName: user.name } : {}) })
  if (!written) throw new MemoryConflictError(`${version.path} was changed concurrently; retry.`)
  return written
}

/**
 * Redaction is by CONTENT: the point is that the text is gone. Refused while any live document holds
 * it (a rename or restore row is a copy of the same text, and version numbers restart after a delete,
 * so the number says nothing); when allowed, every row of the store carrying that text is redacted.
 */
export const redactMemoryVersion = async (storeId: string, versionId: string, user: { id: string, name?: string }) => {
  const version = await mongo.agentMemoryVersions.findOne({ storeId, id: versionId }, { projection: { _id: 0 } })
  if (!version) throw new MemoryCommandError('unknown version')
  if (version.redacted) throw new MemoryCommandError('this version is already redacted')
  if (version.content === undefined) throw new MemoryCommandError('this version has no content to redact')
  const holder = await mongo.agentMemories.findOne({ storeId, content: version.content }, { projection: { _id: 0, path: 1 } })
  if (holder) throw new MemoryCommandError(`${holder.path} currently holds this text; edit the document first, then redact this version`)
  const stamp = { at: new Date().toISOString(), by: { id: user.id, ...(user.name ? { name: user.name } : {}) } }
  // A pipeline update: the description is blanked only where there is one, as it can carry the same text.
  await mongo.agentMemoryVersions.updateMany(
    { storeId, content: version.content, redacted: { $exists: false } },
    [{
      $set: {
        content: '[redacted]',
        description: { $cond: [{ $eq: [{ $type: '$description' }, 'string'] }, '[redacted]', '$$REMOVE'] },
        redacted: { $literal: stamp }
      }
    }]
  )
}

export const deleteMemoryStore = async (storeId: string) => {
  const documents = await mongo.agentMemories.deleteMany({ storeId })
  const versions = await mongo.agentMemoryVersions.deleteMany({ storeId })
  return { documents: documents.deletedCount, versions: versions.deletedCount }
}

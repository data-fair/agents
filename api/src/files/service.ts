/**
 * service.ts contains stateful logic (config, mongo) built on top of operations.ts
 *
 * The deployment's file store, when one is configured (`files`, docs/architecture/agent-files.md), and the
 * per-turn handle on it.
 */
import config from '#config'
import type { ConversationRun } from '#types'
import type { FileBackend } from './types.ts'
import { FsBackend } from './fs.ts'
import { S3Backend } from './s3.ts'
import { createTurnFiles, type TurnFiles } from './turn-files.ts'
import { scopeOfRun } from './operations.ts'

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
  return createTurnFiles({ backend, scope: scopeOfRun(run as any), secret: config.files.secret, publicUrl: config.files.publicUrl })
}

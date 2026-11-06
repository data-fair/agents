/**
 * service-style module: the continuations of code_mode scripts paused for a person's decision
 * (docs/architecture/code-mode.md, "A call that needs a person").
 *
 * Kept apart from the call's stored part on purpose: the part is sent to the page on every frame and exported, and a
 * continuation holds everything the script's calls returned so far (up to `run`'s 32 MiB record). One document per
 * paused code_mode call, replaced when the resumed script pauses again, deleted once it resumes, and dropped by a TTL
 * index when its continuation expires: it could no longer resume then.
 */
import type { CodeModeApprovalInterrupt } from '@ai-sdk/code-mode'
import type { AccountKeys } from '@data-fair/lib-express'
import mongo from '#mongo'

export interface ScriptPause {
  conversationId: string
  /** The code_mode call's id. */
  toolCallId: string
  owner: AccountKeys
  /**
   * The interrupt, its signed continuation inside, as JSON text: kept byte for byte as the package signed it, and
   * free of the keys BSON treats specially (`$…`, dotted), which the script's data may hold.
   */
  interrupt: string
  createdAt: Date
  /** The continuation's own expiry, for the TTL index. */
  expiresAt: Date
}

/** Under MongoDB's 16 MiB document limit, with room for the document's own fields and BSON's overhead. */
export const SCRIPT_PAUSE_MAX_BYTES = 15 * 1024 * 1024

/** Store a paused script's continuation. False when it is too large to keep: the script cannot wait then. */
export const storeScriptPause = async (pause: { conversationId: string, toolCallId: string, owner: AccountKeys, interrupt: CodeModeApprovalInterrupt }): Promise<boolean> => {
  const interrupt = JSON.stringify(pause.interrupt)
  if (Buffer.byteLength(interrupt) > SCRIPT_PAUSE_MAX_BYTES) return false
  const expiresAt = new Date(pause.interrupt.continuation.auth.expiresAtMs)
  await mongo.scriptPauses.replaceOne(
    { conversationId: pause.conversationId, toolCallId: pause.toolCallId },
    { conversationId: pause.conversationId, toolCallId: pause.toolCallId, owner: { type: pause.owner.type, id: pause.owner.id, ...(pause.owner.department ? { department: pause.owner.department } : {}) }, interrupt, createdAt: new Date(), expiresAt },
    { upsert: true }
  )
  return true
}

export const scriptPauseOf = async (conversationId: string, toolCallId: string): Promise<CodeModeApprovalInterrupt | undefined> => {
  const stored = await mongo.scriptPauses.findOne({ conversationId, toolCallId }, { projection: { _id: 0, interrupt: 1 } })
  return stored ? JSON.parse(stored.interrupt) : undefined
}

export const dropScriptPause = async (conversationId: string, toolCallId: string): Promise<void> => {
  await mongo.scriptPauses.deleteOne({ conversationId, toolCallId })
}

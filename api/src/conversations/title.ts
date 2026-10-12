/**
 * Conversation titles: one small call with the summarizer role after a conversation's first exchange,
 * as ChatGPT and Claude.ai title theirs. The title a client sends at creation is a placeholder (the
 * agent's name or a date); this one names the subject, for the people's conversation list, the admin
 * review list, and the agent itself reading its own history (list_my_runs).
 *
 * Fire-and-forget after a turn closes: nobody waits for it, and a failure leaves the placeholder.
 * Billed like any model call, to whoever the turn was billed to.
 */
import mongo from '#mongo'
import Debug from 'debug'
import { generateText } from 'ai'
import type { ConversationRun } from '#types'
import { titleInput, cleanTitle, TITLE_SYSTEM_PROMPT, usageIdentityFor } from './operations.ts'
import { resolveAgent } from './service.ts'
import { getSettings } from '../settings/service.ts'
import { resolveRoleModel } from '../models/service.ts'
import { chargeModelCall } from '../usage/charge.ts'
import { checkAccountCreditCap } from '../usage/enforce.ts'

const debug = Debug('df-agents:conversation-title')
const TITLE_TIMEOUT_MS = 30_000

export const maybeTitleConversation = async (run: Pick<ConversationRun, 'id' | 'conversationId' | 'agentId' | 'owner' | 'triggeredBy' | 'triggeredByRole'>): Promise<string | undefined> => {
  if (!run.conversationId) return
  // Claimed before the call, so two turns closing together title once.
  const conversation = await mongo.conversations.findOneAndUpdate(
    { id: run.conversationId, anonymous: { $ne: true }, titledAt: { $exists: false } },
    { $set: { titledAt: new Date().toISOString() } },
    { projection: { _id: 0, id: 1, owner: 1, agentId: 1 } }
  )
  if (!conversation) return
  const messages = await mongo.messages.find({ conversationId: conversation.id, seq: { $lte: 4 } }, { projection: { _id: 0, role: 1, parts: 1 } }).sort({ seq: 1 }).toArray()
  const input = titleInput(messages as any)
  if (!input || await checkAccountCreditCap(conversation.owner)) return
  const agent = await resolveAgent(conversation.owner, conversation.agentId)
  if (!agent) return
  const { model, entry } = resolveRoleModel(await getSettings(conversation.owner), 'summarizer')
  const generated = await generateText({ model, system: TITLE_SYSTEM_PROMPT, prompt: input, abortSignal: AbortSignal.timeout(TITLE_TIMEOUT_MS) })
  await chargeModelCall({ owner: conversation.owner, identity: usageIdentityFor(agent, run), modelRole: 'summarizer', entry, usage: generated.usage })
  const title = cleanTitle(generated.text)
  if (!title) return
  await mongo.conversations.updateOne({ id: conversation.id }, { $set: { title } })
  debug('titled conversation %s: %s', conversation.id, title)
  return title
}

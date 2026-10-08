import type { Settings } from '#types/settings/index.ts'
import type { Limits } from '#types/limits/index.ts'
import type { AutonomousAgent } from '#types/autonomous-agent/index.ts'
import type { AutonomousAgentTask } from '#types/autonomous-agent-task/index.ts'
import type { Conversation } from '#types/conversation/index.ts'
import type { ConversationMessage } from '#types/conversation-message/index.ts'
import type { MessagePart } from '@agents/shared/message-parts'
import type { ConversationRun } from '#types/conversation-run/index.ts'
import type { AgentMemory } from '#types/agent-memory/index.ts'
import type { AgentMemoryVersion } from '#types/agent-memory-version/index.ts'
import type { Usage } from './usage/service.ts'
import type { ModerationEvent, ModerationStrike } from './moderation/types.ts'
import { RETENTION_SECONDS } from './retention.ts'

import mongoLib from '@data-fair/lib-node/mongo.js'
import config from '#config'

/** A stored message, with its parts typed by the library that owns them. */
export type StoredMessage = Omit<ConversationMessage, 'parts'> & { parts?: MessagePart[] }

export class AgentsMongo {
  get client () {
    return mongoLib.client
  }

  get db () {
    return mongoLib.db
  }

  get settings () {
    return mongoLib.db.collection<Settings>('settings')
  }

  get usage () {
    return mongoLib.db.collection<Usage>('usage')
  }

  get limits () {
    return mongoLib.db.collection<Limits>('limits')
  }

  get moderationEvents () {
    return mongoLib.db.collection<ModerationEvent>('moderation-events')
  }

  get moderationStrikes () {
    return mongoLib.db.collection<ModerationStrike>('moderation-strikes')
  }

  get autonomousAgentTasks () {
    return mongoLib.db.collection<AutonomousAgentTask>('autonomous-agent-tasks')
  }

  get autonomousAgents () {
    return mongoLib.db.collection<AutonomousAgent>('autonomous-agents')
  }

  get conversations () {
    return mongoLib.db.collection<Conversation>('conversations')
  }

  get messages () {
    // The ONE place the stored parts get their real type.
    //
    // The schema exports `parts?: unknown[]` on purpose (see its comment): the shape is the AI SDK's
    // `UIMessagePart` union, which a JSON Schema can only restate as a lagging copy. Overriding it
    // here types every read and write of this collection correctly, so neither the executor nor a
    // test fixture can put a shape in that the library would reject.
    return mongoLib.db.collection<StoredMessage>('messages')
  }

  get runs () {
    return mongoLib.db.collection<ConversationRun>('runs')
  }

  get agentMemories () {
    return mongoLib.db.collection<AgentMemory>('agent-memories')
  }

  get agentMemoryVersions () {
    return mongoLib.db.collection<AgentMemoryVersion>('agent-memory-versions')
  }

  async connect () {
    await mongoLib.connect(config.mongoUrl)
  }

  async init () {
    await this.connect()

    await mongoLib.configure({
      settings: {
        'main-keys': [{ 'owner.type': 1, 'owner.id': 1 }, { unique: true }]
      },
      usage: {
        'main-keys': [{ 'owner.type': 1, 'owner.id': 1, userId: 1, period: 1 }, { unique: true }]
      },
      limits: {
        'main-keys': [{ type: 1, id: 1 }, { unique: true }]
      },
      'moderation-events': {
        'list-keys': [{ 'owner.type': 1, 'owner.id': 1, createdAt: -1 }, {}],
        'ttl-keys': [{ createdAt: 1 }, { expireAfterSeconds: RETENTION_SECONDS }]
      },
      'moderation-strikes': {
        'main-keys': [{ 'owner.type': 1, 'owner.id': 1, userId: 1 }, { unique: true }],
        // outlives window (24h) + cooldown (1h) comfortably
        'ttl-keys': [{ updatedAt: 1 }, { expireAfterSeconds: 48 * 60 * 60 }]
      },
      'autonomous-agents': {
        'main-keys': [{ id: 1 }, { unique: true }],
        'owner-keys': [{ 'owner.type': 1, 'owner.id': 1, updatedAt: -1 }, {}]
      },
      'autonomous-agent-tasks': {
        'main-keys': [{ id: 1 }, { unique: true }],
        // the scheduler's poll: what is due
        'due-keys': [{ nextRunAt: 1 }, {}],
        'agent-keys': [{ agentId: 1 }, {}]
      },
      conversations: {
        'main-keys': [{ id: 1 }, { unique: true }],
        'agent-keys': [{ agentId: 1, lastMessageAt: -1 }, {}],
        // A person's threads on an account, newest first: the chat's history and what it resumes.
        'user-keys': [{ 'owner.type': 1, 'owner.id': 1, userId: 1, lastMessageAt: -1 }, {}],
        // The review list's audited half: one account's configured-agent threads, newest activity first.
        'review-agent-keys': [{ 'owner.type': 1, 'owner.id': 1, agentId: 1, lastMessageAt: -1 }, {}],
        // The admin review list: one account's consented threads, newest activity first.
        'review-keys': [{ 'owner.type': 1, 'owner.id': 1, consentedToReview: 1, lastMessageAt: -1 }, {}],
        // The archive sweep, which runs daily over the whole collection and would otherwise scan it.
        'archive-keys': [{ archivedAt: 1, lastMessageAt: 1 }, {}]
      },
      messages: {
        // The read path: one conversation's messages in order. Unique so a duplicate seq
        // is a write error rather than a silently reordered conversation — the backstop
        // for the $inc allocation in appendMessage.
        'main-keys': [{ conversationId: 1, seq: 1 }, { unique: true }],
        // DROPPED (null drops it at startup when present). A message is addressed by its conversation
        // and seq — every reader already went through the conversation — and this index of random ids
        // compressed nothing: it was half the collection's index size for two
        // writes that knew the seq anyway. `id` stays on the document, for clients that key on it.
        'id-keys': null
      },
      runs: {
        'main-keys': [{ id: 1 }, { unique: true }],
        'conversation-keys': [{ conversationId: 1, startedAt: -1 }, {}],
        // the boot sweep that marks orphaned runs interrupted
        'status-keys': [{ status: 1 }, {}],
        'task-keys': [{ taskId: 1, startedAt: -1 }, {}],
        'agent-keys': [{ agentId: 1, startedAt: -1 }, {}]
      },
      'agent-memories': {
        // One document per path of a store, and the unique index is the create-race backstop.
        'main-keys': [{ storeId: 1, path: 1 }, { unique: true }]
      },
      'agent-memory-versions': {
        'main-keys': [{ id: 1 }, { unique: true }],
        // One document's history, newest first; and a whole store's, for the admin history tab.
        'path-keys': [{ storeId: 1, path: 1, createdAt: -1 }, {}],
        'store-keys': [{ storeId: 1, createdAt: -1 }, {}]
      }
    })
  }
}

const agentsMongo = new AgentsMongo()
export default agentsMongo

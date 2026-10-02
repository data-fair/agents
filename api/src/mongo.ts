import type { Settings } from '#types/settings/index.ts'
import type { Limits } from '#types/limits/index.ts'
import type { AutonomousAgent } from '#types/autonomous-agent/index.ts'
import type { AutonomousAgentConversation } from '#types/autonomous-agent-conversation/index.ts'
import type { AutonomousAgentMessage } from '#types/autonomous-agent-message/index.ts'
import type { MessagePart } from '@agents/shared/message-parts'
import type { AutonomousAgentRun } from '#types/autonomous-agent-run/index.ts'
import type { Usage } from './usage/service.ts'
import type { ModerationEvent, ModerationStrike } from './moderation/types.ts'
import { RETENTION_SECONDS } from './moderation/operations.ts'

import mongoLib from '@data-fair/lib-node/mongo.js'
import config from '#config'

/** A stored message, with its parts typed by the library that owns them. */
export type StoredMessage = Omit<AutonomousAgentMessage, 'parts'> & { parts?: MessagePart[] }

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

  get autonomousAgents () {
    return mongoLib.db.collection<AutonomousAgent>('autonomous-agents')
  }

  get autonomousAgentConversations () {
    return mongoLib.db.collection<AutonomousAgentConversation>('autonomous-agent-conversations')
  }

  get autonomousAgentMessages () {
    // The ONE place the stored parts get their real type.
    //
    // The schema exports `parts?: unknown[]` on purpose (see its comment): the shape is the AI SDK's
    // `UIMessagePart` union, which a JSON Schema can only restate as a lagging copy. Overriding it
    // here types every read and write of this collection correctly, so neither the executor nor a
    // test fixture can put a shape in that the library would reject.
    return mongoLib.db.collection<StoredMessage>('autonomous-agent-messages')
  }

  get autonomousAgentRuns () {
    return mongoLib.db.collection<AutonomousAgentRun>('autonomous-agent-runs')
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
      'autonomous-agent-conversations': {
        'main-keys': [{ id: 1 }, { unique: true }],
        'agent-keys': [{ autonomousAgentId: 1, lastMessageAt: -1 }, {}]
      },
      'autonomous-agent-messages': {
        // the incremental cursor: one conversation's changes after a given version
        'version-keys': [{ conversationId: 1, version: 1 }, {}],
        // The read path: one conversation's messages in order. Unique so a duplicate seq
        // is a write error rather than a silently reordered conversation — the backstop
        // for the $inc allocation in appendMessage.
        'main-keys': [{ conversationId: 1, seq: 1 }, { unique: true }],
        'id-keys': [{ id: 1 }, { unique: true }]
      },
      'autonomous-agent-runs': {
        'main-keys': [{ id: 1 }, { unique: true }],
        'conversation-keys': [{ conversationId: 1, startedAt: -1 }, {}],
        // the boot sweep that marks orphaned runs interrupted
        'status-keys': [{ status: 1 }, {}]
      }
    })
  }
}

const agentsMongo = new AgentsMongo()
export default agentsMongo

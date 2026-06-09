import type { Settings } from '#types/settings/index.ts'
import type { Usage } from './usage/service.ts'
import type { TraceRequest } from './traces/types.ts'
import { RETENTION_SECONDS } from './traces/operations.ts'

import mongoLib from '@data-fair/lib-node/mongo.js'
import config from '#config'

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

  get traceRequests () {
    return mongoLib.db.collection<TraceRequest>('trace-requests')
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
      'trace-requests': {
        'list-keys': [{ 'owner.type': 1, 'owner.id': 1, 'conversation.id': 1, createdAt: 1 }, {}],
        'recent-keys': [{ 'owner.type': 1, 'owner.id': 1, createdAt: -1 }, {}],
        // GET /traces/conversation/:id looks up by conversation id alone (owner is
        // resolved from the result), so it needs conversation.id as the prefix.
        'conversation-keys': [{ 'conversation.id': 1, createdAt: 1 }, {}],
        'ttl-keys': [{ createdAt: 1 }, { expireAfterSeconds: RETENTION_SECONDS }],
        'user-keys': [{ 'owner.type': 1, 'owner.id': 1, userId: 1 }, {}]
      }
    })
  }
}

const agentsMongo = new AgentsMongo()
export default agentsMongo

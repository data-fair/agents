import type { Settings } from '#types/settings/index.ts'

import mongoLib from '@data-fair/lib-node/mongo.js'
import config from '#config'

export interface TraceEvent {
  _id?: string
  traceId: string
  userId: string
  eventType: string
  timestamp: Date
  data: any
}

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

  get traces () {
    return mongoLib.db.collection<TraceEvent>('traces')
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
      traces: {
        ttl: [{ createdAt: 1 }, { expireAfterSeconds: 86400 }]
      }
    })
  }
}

const agentsMongo = new AgentsMongo()
export default agentsMongo

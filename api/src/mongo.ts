import type { Settings } from '#types/settings/index.ts'
import type { Usage } from './usage/service.ts'

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
      }
    })
  }
}

const agentsMongo = new AgentsMongo()
export default agentsMongo

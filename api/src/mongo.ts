import type { Settings } from '#types/settings/index.ts'

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

  async connect () {
    await mongoLib.connect(config.mongoUrl)
  }

  async init () {
    await this.connect()
    try {
      await mongoLib.configure({
        settings: {
          'main-keys': { 'owner.type': 1, 'owner.id': 1 },
          'unique-owner': [{ 'owner.type': 1, 'owner.id': 1 }, { unique: true }]
        }
      })
    } catch (err: any) {
      const code = err.code
      const codeName = err.codeName
      if (code === 27 || codeName === 'IndexNotFound') {
        try {
          const collection = this.settings
          await collection.createIndex({ 'owner.type': 1, 'owner.id': 1 }, { unique: true })
        } catch (createErr: any) {
          if (createErr.code === 85 || createErr.codeName === 'IndexOptionsConflict') {
            // Index already exists with different options, that's fine
          } else {
            throw createErr
          }
        }
      } else if (code === 85 || codeName === 'IndexOptionsConflict') {
        // Index already exists with different options, that's fine
      } else {
        throw err
      }
    }
  }
}

const agentsMongo = new AgentsMongo()
export default agentsMongo

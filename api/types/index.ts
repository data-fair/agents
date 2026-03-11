import settingsSchema from './settings/schema.js'
import modelSchema from './model/schema.js'
import evaluatorSchema from './evaluator/schema.js'

export * from './settings/index.ts'
export * from './agents/chat-ws.ts'
export { settingsSchema, modelSchema, evaluatorSchema }

export type ModelInfo = {
  id: string
  name: string
  provider: {
    type: string,
    name: string,
    id: string
  }
}

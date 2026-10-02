import settingsSchema from './settings/schema.js'
import modelSchema from './model/schema.js'
import limitsSchema from './limits/schema.js'
import autonomousAgentSchema from './autonomous-agent/schema.js'
import conversationSchema from './conversation/schema.js'
import conversationMessageSchema from './conversation-message/schema.js'
import conversationRunSchema from './conversation-run/schema.js'

export * from './settings/index.ts'
export type { Limits } from './limits/index.ts'
export type { AutonomousAgent } from './autonomous-agent/index.ts'
export type { Conversation } from './conversation/index.ts'
export type { ConversationMessage } from './conversation-message/index.ts'
export type { ConversationRun } from './conversation-run/index.ts'
export { settingsSchema, modelSchema, limitsSchema, autonomousAgentSchema, conversationSchema, conversationMessageSchema, conversationRunSchema }

export type ModelInfo = {
  id: string
  name: string
  provider: {
    type: string,
    name: string,
    id: string
  }
}

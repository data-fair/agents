import settingsSchema from './settings/schema.js'
import modelSchema from './model/schema.js'
import limitsSchema from './limits/schema.js'
import autonomousAgentSchema from './autonomous-agent/schema.js'
import autonomousAgentConversationSchema from './autonomous-agent-conversation/schema.js'
import autonomousAgentMessageSchema from './autonomous-agent-message/schema.js'
import autonomousAgentRunSchema from './autonomous-agent-run/schema.js'

export * from './settings/index.ts'
export type { Limits } from './limits/index.ts'
export type { AutonomousAgent } from './autonomous-agent/index.ts'
export type { AutonomousAgentConversation } from './autonomous-agent-conversation/index.ts'
export type { AutonomousAgentMessage } from './autonomous-agent-message/index.ts'
export type { AutonomousAgentRun } from './autonomous-agent-run/index.ts'
export { settingsSchema, modelSchema, limitsSchema, autonomousAgentSchema, autonomousAgentConversationSchema, autonomousAgentMessageSchema, autonomousAgentRunSchema }

export type ModelInfo = {
  id: string
  name: string
  provider: {
    type: string,
    name: string,
    id: string
  }
}

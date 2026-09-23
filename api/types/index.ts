import settingsSchema from './settings/schema.js'
import modelSchema from './model/schema.js'
import limitsSchema from './limits/schema.js'
import autonomousAgentSchema from './autonomous-agent/schema.js'

export * from './settings/index.ts'
export type { Limits } from './limits/index.ts'
export type { AutonomousAgent } from './autonomous-agent/index.ts'
export { settingsSchema, modelSchema, limitsSchema, autonomousAgentSchema }

export type ModelInfo = {
  id: string
  name: string
  provider: {
    type: string,
    name: string,
    id: string
  }
}

import settingsSchema from './settings/schema.js'
import modelSchema from './model/schema.js'
import limitsSchema from './limits/schema.js'

export * from './settings/index.ts'
export type { Limits } from './limits/index.ts'
export { settingsSchema, modelSchema, limitsSchema }

export type ModelInfo = {
  id: string
  name: string
  provider: {
    type: string,
    name: string,
    id: string
  }
}

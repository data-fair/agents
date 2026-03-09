import settingsSchema from './settings/schema.js'
import modelSchema from './model/schema.js'

export * from './settings/index.ts'
export { settingsSchema, modelSchema }

export type ModelInfo = {
  id: string
  name: string
  provider: {
    type: string,
    name: string,
    id: string
  }
}

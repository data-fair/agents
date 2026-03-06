import settingsSchema from './settings/schema.js'

export * from './settings/index.ts'
export { settingsSchema }

export type ModelInfo = {
  id: string
  name: string
  provider: {
    type: string,
    name: string,
    id: string
  }
}

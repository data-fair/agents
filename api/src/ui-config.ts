import config from './config.ts'

export const uiConfig = {
  currency: config.currency
}

export type UiConfig = typeof uiConfig
export default uiConfig

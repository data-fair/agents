import type { ApiConfig } from '../config/type/index.ts'
import { assertValid } from '../config/type/index.ts'
import config from 'config'

// @ts-expect-error - options type mismatch with generated types
const apiConfig = process.env.NODE_ENV === 'test' ? config.util.loadFileConfigs(process.env.NODE_CONFIG_DIR, { skipConfigSources: true }) : config
assertValid(apiConfig, { lang: 'en', name: 'config', internal: true })

export default apiConfig as ApiConfig

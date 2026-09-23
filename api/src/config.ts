import type { ApiConfig } from '../config/type/index.ts'
import { assertValid } from '../config/type/index.ts'
import config from 'config'
import { assertGlobalAiConfig } from './models/operations.ts'
import { assertGlobalMcpConfig } from './mcp-servers/operations.ts'

assertValid(config, { lang: 'en', name: 'config', internal: true })

assertGlobalAiConfig((config as ApiConfig).providers ?? [], (config as ApiConfig).models ?? [], (config as ApiConfig).defaultModels ?? {})
assertGlobalMcpConfig((config as ApiConfig).mcpServers ?? [])

export default config as ApiConfig

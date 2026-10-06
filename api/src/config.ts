import type { ApiConfig } from '../config/type/index.ts'
import { assertValid } from '../config/type/index.ts'
import nodeConfig from 'config'
import { applyDeprecatedConfig } from './config-aliases.ts'
import { assertGlobalAiConfig } from './models/operations.ts'
import { assertGlobalMcpConfig } from './mcp-servers/operations.ts'
import { assertNhiConfig } from './nhi/operations.ts'

// Old setting names resolved first, so a deployment still using one is not rejected by the schema.
const { config, warnings } = applyDeprecatedConfig({ ...nodeConfig } as Record<string, unknown>, process.env)
for (const warning of warnings) console.warn(`[config] ${warning}`)

assertValid(config, { lang: 'en', name: 'config', internal: true })

assertGlobalAiConfig((config as ApiConfig).providers ?? [], (config as ApiConfig).models ?? [], (config as ApiConfig).defaultModels ?? {})
assertGlobalMcpConfig((config as ApiConfig).mcpServers ?? [])
assertNhiConfig((config as ApiConfig).nhiSigningKey)

export default config as ApiConfig

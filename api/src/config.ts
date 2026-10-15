import type { ApiConfig } from '../config/type/index.ts'
import { assertValid } from '../config/type/index.ts'
import nodeConfig from 'config'
import { assertGlobalAiConfig } from './models/operations.ts'
import { assertGlobalMcpConfig, assertPersonalAssistantsConfig } from './mcp-servers/operations.ts'
import { assertFilesConfig } from './files/operations.ts'

// A mutable copy: node-config's object is immutable once read, and validation applies the schema defaults.
const config = { ...nodeConfig } as unknown as ApiConfig

assertValid(config, { lang: 'en', name: 'config', internal: true })

assertGlobalAiConfig(config.providers ?? [], config.models ?? [], config.defaultModels ?? {})
assertGlobalMcpConfig(config.mcpServers ?? [])
assertPersonalAssistantsConfig(config.personalAssistants ?? {}, config.mcpServers ?? [])
assertFilesConfig(config.files)

export default config

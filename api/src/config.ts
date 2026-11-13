import type { ApiConfig } from '../config/type/index.ts'
import { assertValid } from '../config/type/index.ts'
import nodeConfig from 'config'
import log from '@data-fair/lib-node/log.js'
import { assertGlobalAiConfig, dropRemovedModelRoles } from './models/operations.ts'
import { assertGlobalMcpConfig, assertPersonalAssistantsConfig } from './mcp-servers/operations.ts'
import { assertFilesConfig } from './files/operations.ts'

// A mutable copy: node-config's object is immutable once read, and validation applies the schema defaults.
const config = { ...nodeConfig } as unknown as ApiConfig

const tolerated = dropRemovedModelRoles(config.defaultModels as Record<string, unknown> | undefined, config.models as any)
if (tolerated.dropped.length) {
  log.warn(`config names removed model roles, ignored: ${tolerated.dropped.join('; ')}. Remove them from DEFAULT_MODELS / MODELS: a later release will refuse them.`, { code: 'config-removed-model-role' })
  config.defaultModels = tolerated.defaultModels as ApiConfig['defaultModels']
  config.models = tolerated.models as ApiConfig['models']
}

assertValid(config, { lang: 'en', name: 'config', internal: true })

assertGlobalAiConfig(config.providers ?? [], config.models ?? [], config.defaultModels ?? {})
assertGlobalMcpConfig(config.mcpServers ?? [])
if (!config.privateMcpUrl) log.warn('PRIVATE_MCP_URL is not set: autonomous agents have no built-in data-fair server, only their catalog servers', { code: 'config-no-private-mcp' })
assertPersonalAssistantsConfig(config.personalAssistants ?? {}, config.mcpServers ?? [])
assertFilesConfig(config.files)

export default config

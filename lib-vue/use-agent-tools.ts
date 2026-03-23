import { onScopeDispose } from 'vue'
import { initializeWebMCPPolyfill } from '@mcp-b/webmcp-polyfill'
import type { ToolDescriptorFromSchema, JsonSchemaForInference } from '@mcp-b/webmcp-types'
import Debug from 'debug'

const debug = Debug('df-agents:use-agent-tool')

initializeWebMCPPolyfill()

export function useAgentTool<
  TInputSchema extends JsonSchemaForInference,
  TOutputSchema extends JsonSchemaForInference | undefined = undefined,
  TName extends string = string
> (agentTool: ToolDescriptorFromSchema<TInputSchema, TOutputSchema, TName>) {
  if (typeof window === 'undefined') return

  debug('register tool %s', agentTool.name)
  navigator.modelContext.registerTool(agentTool)

  onScopeDispose(() => {
    debug('unregister tool %s', agentTool.name)
    window.navigator.modelContext.unregisterTool(agentTool.name)
  })
}

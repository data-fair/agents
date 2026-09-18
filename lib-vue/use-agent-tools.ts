import { onScopeDispose } from 'vue'
import { initializeWebMCPPolyfill } from '@mcp-b/webmcp-polyfill'
import type { ToolDescriptorFromSchema, JsonSchemaForInference } from '@mcp-b/webmcp-types'
import Debug from './debug.js'

const debug = Debug('df-agents:use-agent-tool')

initializeWebMCPPolyfill()

export function useAgentTool<
  TInputSchema extends JsonSchemaForInference,
  TOutputSchema extends JsonSchemaForInference | undefined = undefined,
  TName extends string = string
> (agentTool: ToolDescriptorFromSchema<TInputSchema, TOutputSchema, TName>) {
  if (typeof window === 'undefined') return

  debug('register tool %s', agentTool.name)
  try {
    navigator.modelContext.registerTool(agentTool)
  } catch (err) {
    // Warn instead of letting the throw (e.g. a duplicate tool name) abort the caller's setup().
    console.warn(`[df-agents] could not register agent tool "${agentTool.name}":`, err)
    return
  }

  onScopeDispose(() => {
    debug('unregister tool %s', agentTool.name)
    window.navigator.modelContext.unregisterTool(agentTool.name)
  })
}

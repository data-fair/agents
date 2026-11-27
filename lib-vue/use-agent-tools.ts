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
  // The WebMCP draft of 2026-04-23 removed unregisterTool(): a tool is unregistered by aborting
  // the signal it was registered with. The registration also stays bound to the context that
  // received it, even if navigator.modelContext is replaced afterwards (useFrameServer).
  const controller = new AbortController()
  try {
    navigator.modelContext.registerTool(agentTool, { signal: controller.signal })
  } catch (err) {
    // Warn instead of letting the throw (e.g. a duplicate tool name) abort the caller's setup().
    console.warn(`[df-agents] could not register agent tool "${agentTool.name}":`, err)
    return
  }

  onScopeDispose(() => {
    debug('unregister tool %s', agentTool.name)
    controller.abort()
  })
}

import { onScopeDispose } from 'vue'
import { initializeWebMCPPolyfill } from '@mcp-b/webmcp-polyfill'

initializeWebMCPPolyfill()

export type AgentTool = Parameters<typeof navigator.modelContext.registerTool>[0]

export function useAgentTool (agentTool: AgentTool) {
  if (typeof window === 'undefined') return

  navigator.modelContext.registerTool(agentTool)

  onScopeDispose(() => {
    window.navigator.modelContext.unregisterTool(agentTool.name)
  })
}

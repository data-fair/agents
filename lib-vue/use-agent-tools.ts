import type { App } from 'vue'
import { inject, markRaw, onScopeDispose, reactive } from 'vue'
import { initializeWebMCPPolyfill } from '@mcp-b/webmcp-polyfill'

initializeWebMCPPolyfill()

export const agentToolsKey = Symbol('agentTools')
export type AgentTool = Parameters<typeof navigator.modelContext.registerTool>[0]

export function createAgentTools () {
  const tools = reactive<Record<string, AgentTool>>({})
  return {
    install (app: App) { app.provide(agentToolsKey, tools) },
    state: tools
  }
}
export function useAgentTools () {
  const agentTools = inject(agentToolsKey)
  if (!agentTools) throw new Error('useAgentTools requires using the plugin createAgentTools')
  return agentTools as ReturnType<typeof createAgentTools>['state']
}

export function useAgentTool (agentTool: AgentTool) {
  if (typeof window === 'undefined') return

  navigator.modelContext.registerTool(agentTool)
  useAgentTools()[agentTool.name] = markRaw(agentTool)

  onScopeDispose(() => {
    window.navigator.modelContext.unregisterTool(agentTool.name)
    delete useAgentTools()[agentTool.name]
  })
}

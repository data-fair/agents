import type { App } from 'vue'
import { initializeWebMCPPolyfill } from '@mcp-b/webmcp-polyfill'
import { onScopeDispose, reactive } from 'vue'

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

export function useAgentTool (tool: AgentTool) {
  // @ts-ignore
  if (import.meta.env?.SSR) return

  navigator.modelContext.registerTool(tool)
  useAgentTools().name = markRaw(tool)

  onScopeDispose(() => {
    window.navigator.modelContext.unregisterTool(tool.name)
    delete useAgentTools().name
  })
}

/*
example:

useAgentTool({
  name: 'read_editor',
  description: 'Gets the current content of the editor',
  execute: () => ({ content: document.querySelector('#editor').value })
});
 */

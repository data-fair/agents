import type { App } from 'vue'
import type { Tool } from 'ai'
import { initializeWebMCPPolyfill } from '@mcp-b/webmcp-polyfill'
import { tool, jsonSchema } from 'ai'
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

export function useAgentTool (agentTool: AgentTool) {
  // @ts-ignore
  if (import.meta.env?.SSR) return

  navigator.modelContext.registerTool(agentTool)
  useAgentTools()[agentTool.name] = markRaw(agentTool)

  onScopeDispose(() => {
    window.navigator.modelContext.unregisterTool(agentTool.name)
    delete useAgentTools()[agentTool.name]
  })
}

/** Bridge registered agent tools to AI SDK tools for client-side agent loop */
export function bridgeWebMCPTools (agentTools: Record<string, AgentTool>): Record<string, Tool> {
  const tools: Record<string, Tool> = {}
  for (const [name, t] of Object.entries(agentTools)) {
    tools[name] = tool({
      description: t.description || '',
      inputSchema: jsonSchema(t.inputSchema as any || { type: 'object', properties: {} }),
      execute: async (args: any) => t.execute(args, { requestUserInteraction: async (cb: () => Promise<unknown>) => cb() })
    })
  }
  return tools
}

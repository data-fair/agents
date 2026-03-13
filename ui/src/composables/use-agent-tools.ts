import type { Tool } from 'ai'
import { tool, jsonSchema } from 'ai'
import type { AgentTool } from '@data-fair/lib-vue-agents'

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

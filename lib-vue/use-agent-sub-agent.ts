import { useAgentTool } from './use-agent-tools.js'

export interface SubAgentOptions {
  name: string
  description: string
  prompt: string
  tools: string[]
}

export function useAgentSubAgent (options: SubAgentOptions) {
  useAgentTool({
    name: `subagent_${options.name}`,
    description: options.description,
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'The task to delegate to this sub-agent' }
      },
      required: ['task']
    },
    execute: async () => {
      return JSON.stringify({
        prompt: options.prompt,
        tools: options.tools
      })
    }
  } as any)
}

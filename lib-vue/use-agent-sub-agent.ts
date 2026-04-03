import { useAgentTool } from './use-agent-tools.js'
import Debug from './debug.js'

const debug = Debug('df-agents:use-agent-sub-agent')

export interface SubAgentOptions {
  name: string
  title?: string
  description: string
  prompt: string
  tools: string[]
  model?: string
}

export function useAgentSubAgent (options: SubAgentOptions) {
  debug('register sub-agent=%s tools=%o', options.name, options.tools)
  useAgentTool({
    name: `subagent_${options.name}`,
    description: options.description,
    annotations: options.title ? { title: options.title } : undefined,
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
        tools: options.tools,
        model: options.model ?? 'tools'
      })
    }
  } as any)
}

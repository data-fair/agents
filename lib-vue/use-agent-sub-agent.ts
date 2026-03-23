import { useAgentTool } from './use-agent-tools.js'
import Debug from 'debug'

const debug = Debug('df-agents:use-agent-sub-agent')

export interface SubAgentOptions {
  name: string
  description: string
  prompt: string
  tools: string[]
}

export function useAgentSubAgent (options: SubAgentOptions) {
  debug('register sub-agent=%s tools=%o', options.name, options.tools)
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

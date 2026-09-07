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
  /**
   * Keep this sub-agent delegated even when the host enables the experimental
   * "flatten sub-agents" mode. Set this for producer sub-agents whose return value a
   * host prompt consumes as a finished deliverable (flattening would invert that
   * contract). When omitted, the host defaults to keeping model-pinned sub-agents
   * delegated; see shouldFlattenSubAgent in the agents app.
   */
  delegateOnly?: boolean
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
        task: { type: 'string', description: 'The task to delegate to this sub-agent. Include all relevant context from the conversation that the sub-agent needs to accomplish the task (user preferences, constraints, data references, etc.).' }
      },
      required: ['task']
    },
    execute: async () => {
      return JSON.stringify({
        prompt: options.prompt,
        tools: options.tools,
        model: options.model ?? 'tools',
        // Omitted from the JSON when undefined, so the consumer falls back to its heuristic.
        delegateOnly: options.delegateOnly
      })
    }
  } as any)
}

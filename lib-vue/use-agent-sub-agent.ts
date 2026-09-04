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
  /**
   * How many autonomous steps this sub-agent may take before the host cuts its loop off.
   * A step is one model turn plus the tools it calls, so this bounds rounds of tool use.
   *
   * Declare it when your tools are fine-grained: a page that fills a form one field per
   * call needs several dozen steps, and the host default (25) would truncate it mid-task.
   * Coarse tools that answer in a call or two need nothing here. The host clamps the
   * value to its own ceiling, so asking for more than it allows is safe but capped.
   */
  maxSteps?: number
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
        delegateOnly: options.delegateOnly,
        // Likewise omitted when undefined, so the host applies its default budget.
        maxSteps: options.maxSteps
      })
    }
  } as any)
}

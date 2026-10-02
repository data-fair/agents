/**
 * Sub-agents, server-side.
 *
 * A page declares one with `useAgentSubAgent`, which registers a `subagent_<name>` tool whose `execute`
 * returns not a result but a JSON CONFIG — prompt, tool names, model. The loop reads that config, builds
 * a worker with the named tools, and replaces the tool with one that runs it. The browser loop does
 * exactly this today; this is the same mechanism with the worker on the server.
 *
 * WHY IT HAD TO MOVE, which is worth stating because it is not a free choice: a worker is a model loop,
 * and the only way a browser calls a model in this architecture is the gateway. So "the gateway goes"
 * and "sub-agents move server-side" are one decision, not two. The hybrid — keep workers in the browser
 * and pay one round trip per delegation instead of one per inner call — is unavailable for that reason.
 *
 * WHAT IT COSTS, conditionally: a worker's inner tool calls become round trips when its tools are PAGE
 * tools. Sub-agents are the heaviest users of tools by design, so that would be the design's real
 * latency exposure — except that the tools they typically reserve (`query_data`, `get_schema`) are data
 * tools, which are exactly the ones moving to the published MCP server. In the target architecture a
 * worker's calls are server-local and the exposure goes DOWN. That conclusion depends entirely on the
 * tool migration actually happening.
 */

import { ToolLoopAgent, stepCountIs, tool, jsonSchema, type Tool } from 'ai'
import Debug from 'debug'
import { STEP_LIMIT, repeatedCallGuard } from '../conversations/loop-guards.ts'
import { subAgentModelOutput, SUBAGENT_DONE_FALLBACK } from '../conversations/subagent-output.ts'

const debug = Debug('agents:sub-agents')

export const SUBAGENT_PREFIX = 'subagent_'

/** What a page's `subagent_*` tool returns when called: its configuration, not a result. */
export interface SubAgentConfig {
  prompt: string
  tools: string[]
  model?: string
  delegateOnly?: boolean
}

/**
 * Parse a config out of whatever the page's tool returned.
 *
 * Tolerant, and returns undefined rather than throwing: a `subagent_*` tool whose payload is not a
 * config is a page bug, and the right response is to leave that tool alone — the model then sees an
 * ordinary tool rather than the turn failing over one bad declaration.
 */
export function parseSubAgentConfig (payload: unknown): SubAgentConfig | undefined {
  let value: unknown = payload
  if (typeof payload === 'string') {
    try { value = JSON.parse(payload) } catch { return undefined }
  }
  if (typeof value !== 'object' || value === null) return undefined
  const config = value as Record<string, unknown>
  if (typeof config.prompt !== 'string' || !config.prompt) return undefined
  if (!Array.isArray(config.tools) || config.tools.some(name => typeof name !== 'string')) return undefined
  return {
    prompt: config.prompt,
    tools: config.tools as string[],
    ...(typeof config.model === 'string' ? { model: config.model } : {}),
    ...(typeof config.delegateOnly === 'boolean' ? { delegateOnly: config.delegateOnly } : {})
  }
}

export interface PartitionedTools {
  /** What the MAIN model is given: every tool minus the workers' reserved ones, plus the delegations. */
  mainTools: Record<string, Tool>
  /** Names removed from the main set because a worker owns them. */
  reserved: string[]
  /** Configs discovered, by sub-agent tool name. */
  configs: Record<string, SubAgentConfig>
}

/**
 * Discover the sub-agents in a tool set and replace them with delegations.
 *
 * RESERVED TOOLS ARE REMOVED FROM THE MAIN SET, which is the whole point of the partition: a lead that
 * could call `query_data` itself would do so instead of delegating, and the context reduction the
 * pattern exists for — the lead sees a summary, not the worker's trace — would never happen.
 *
 * Discovery calls each `subagent_*` tool once. For a page-declared sub-agent that is one socket round
 * trip per turn, which is why the configs are returned for a caller that wants to cache them.
 */
export async function partitionSubAgents (
  allTools: Record<string, Tool>,
  buildWorker: (name: string, config: SubAgentConfig, workerTools: Record<string, Tool>) => Tool
): Promise<PartitionedTools> {
  const configs: Record<string, SubAgentConfig> = {}
  const reserved = new Set<string>()

  for (const [name, candidate] of Object.entries(allTools)) {
    if (!name.startsWith(SUBAGENT_PREFIX)) continue
    if (!candidate.execute) continue
    let payload: unknown
    try {
      payload = await candidate.execute({} as never, { toolCallId: `config:${name}`, messages: [] })
    } catch (err) {
      debug('could not read the config of %s: %O', name, err)
      continue
    }
    const config = parseSubAgentConfig(payload)
    if (!config) {
      debug('%s did not return a usable config; left as an ordinary tool', name)
      continue
    }
    configs[name] = config
    for (const reservedName of config.tools) reserved.add(reservedName)
  }

  const mainTools: Record<string, Tool> = {}
  for (const [name, candidate] of Object.entries(allTools)) {
    if (name.startsWith(SUBAGENT_PREFIX)) continue
    // A reserved tool belongs to its worker and must not be reachable by the lead.
    if (reserved.has(name)) continue
    mainTools[name] = candidate
  }

  for (const [name, config] of Object.entries(configs)) {
    // Only the tools the worker declared, and only ones that actually exist: a config naming a tool
    // the page never registered must not make the worker unbuildable.
    const workerTools: Record<string, Tool> = {}
    for (const reservedName of config.tools) {
      if (allTools[reservedName]) workerTools[reservedName] = allTools[reservedName]
    }
    mainTools[name] = buildWorker(name, config, workerTools)
  }

  return { mainTools, reserved: [...reserved], configs }
}

/**
 * A delegation: one tool whose execute runs a worker to completion and returns a compact summary.
 *
 * STATELESS AND SINGLE-SHOT, as in the browser: the worker keeps no history between delegations, the
 * lead holds the state and re-states the context in `task`. That is what makes a worker safe to run
 * anywhere — it has no durable state to migrate.
 *
 * Under the same guards as any loop, from the same module: `STEP_LIMIT` and the repeated-call guard. The
 * difference from the browser is that here they are ENFORCING rather than advisory, which was one of the
 * few arguments for moving that survived scrutiny.
 */
export interface SubAgentTrace {
  /** The delegating tool call, which is what keys a panel. */
  parentToolCallId: string
  name: string
  /** The worker's turn as stored parts, same shape as the lead's. */
  parts: unknown[]
  pending: boolean
}

export function subAgentDelegation (opts: {
  name: string
  config: SubAgentConfig
  workerTools: Record<string, Tool>
  model: unknown
  description?: string
  abortSignal?: AbortSignal
  /**
   * The worker's trace, as it happens, for its panel.
   *
   * The lead never sees this — it gets the summary. This is what the UI shows when a panel is
   * expanded, and it is streamed rather than sent at the end so an expanded panel fills in instead of
   * sitting empty for however long the worker takes.
   */
  onTrace?: (trace: SubAgentTrace) => void
  /** The panel's phase line. Keyed on the same call, so concurrent panels do not share one. */
  onPhase?: (parentToolCallId: string, phase: 'starting' | 'thinking' | 'tool' | 'analyzing' | null) => void
}): Tool {
  return tool({
    description: opts.description ?? `Delegate a task to the ${opts.name.replace(SUBAGENT_PREFIX, '')} sub-agent.`,
    inputSchema: jsonSchema({
      type: 'object',
      properties: { task: { type: 'string', description: 'The task to delegate, including all context the sub-agent needs.' } },
      required: ['task']
    } as any),
    execute: async (input: any, options?: { toolCallId?: string }) => {
      const agent = new ToolLoopAgent({
        model: opts.model as any,
        // `instructions`, not `system`: ToolLoopAgent names the system prompt that way, and
        // `allowSystemInMessages` is what governs system messages arriving in the prompt instead.
        instructions: opts.config.prompt,
        tools: opts.workerTools,
        stopWhen: [stepCountIs(STEP_LIMIT), repeatedCallGuard()]
      })
      // The delegating call keys the panel. Falling back to the name keeps a trace addressable when no
      // id is supplied, at the cost of two concurrent delegations of the SAME worker sharing a panel —
      // which is the browser loop's own fallback, and the id is always present in practice.
      const parentToolCallId = options?.toolCallId ?? opts.name
      debug('delegating to %s with %d tool(s)', opts.name, Object.keys(opts.workerTools).length)
      opts.onPhase?.(parentToolCallId, 'starting')

      // Streamed rather than generated, so the panel fills in as the worker works. The trace is for
      // the UI only; what the lead receives is still just the summary below.
      const parts: unknown[] = []
      const emit = (pending: boolean) => { opts.onTrace?.({ parentToolCallId, name: opts.name, parts: [...parts], pending }) }
      const appendText = (text: string) => {
        const last = parts[parts.length - 1] as { type?: string, text?: string } | undefined
        if (last?.type === 'text') { last.text = String(last.text ?? '') + text; return }
        parts.push({ type: 'text', text })
      }

      try {
        const result = await agent.stream({
          prompt: String(input?.task ?? ''),
          abortSignal: opts.abortSignal
        })
        for await (const part of result.fullStream) {
          if (part.type === 'error') throw part.error instanceof Error ? part.error : new Error(String(part.error))
          if (part.type === 'text-delta') {
            appendText(part.text)
            opts.onPhase?.(parentToolCallId, null)
            emit(true)
          }
          if (part.type === 'tool-call') {
            parts.push({ type: 'dynamic-tool', toolCallId: part.toolCallId, toolName: part.toolName, state: 'input-available', input: (part as any).input })
            opts.onPhase?.(parentToolCallId, 'tool')
            emit(true)
          }
          if (part.type === 'tool-result' || part.type === 'tool-error') {
            const settled = parts.find(p => (p as any).type === 'dynamic-tool' && (p as any).toolCallId === part.toolCallId) as any
            if (settled) {
              if (part.type === 'tool-result') { settled.state = 'output-available'; settled.output = (part as any).output } else { settled.state = 'output-error'; settled.errorText = String((part as any).error) }
            }
            opts.onPhase?.(parentToolCallId, 'analyzing')
            emit(true)
          }
        }
        emit(false)

        // The LEAD sees a summary, never the worker's trace. That is the context reduction the whole
        // pattern exists for, and the reason a worker can make many calls without flooding the lead.
        //
        // `subAgentModelOutput` takes the worker's MESSAGE ARRAY, not its text — passing a string
        // silently yields the "task completed" fallback, which would relabel a truncated worker as a
        // success. The shape is what carries `stepLimitReached`, and that flag is the difference
        // between "here is the answer" and "here is what I managed before running out".
        const steps = (await result.steps).length
        const text = await result.text
        return subAgentModelOutput([{
          content: text,
          // A worker stopped by the step limit produced a PARTIAL result. Reported as such, because a
          // lead told nothing would treat a truncation as a finished answer — the exact conflation the
          // notice in shared/agent-subagent-output.ts exists to prevent.
          ...(steps >= STEP_LIMIT ? { stepLimitReached: true } : {})
        }]) || SUBAGENT_DONE_FALLBACK
      } finally {
        opts.onPhase?.(parentToolCallId, null)
      }
    }
  })
}

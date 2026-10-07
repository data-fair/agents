/**
 * The service's own tools: what the loop offers beside the catalog's and the page's.
 *
 * One registry instead of a hand-wired branch per tool in performTurn. Each entry states:
 *  - when it applies — the SURFACE (a chat, or a planned task's run, which nobody watches) and the agent;
 *  - how it builds its tools for this turn.
 * Provenance and annotations come from the entry, so a stored call names its source like a catalog call
 * does. Service tools are outside the approval gate (approval-policy.ts covers catalog tools), and no
 * page tool or sub-agent config can displace them (./service-tool-names.ts).
 */
import { tool, jsonSchema, type Tool } from 'ai'
import type { AutonomousAgent, ConversationRun } from '#types'
import type { AgentSession } from '../agent-session/session.ts'
import { createWaitTool, WAIT_TOOL_NAME } from '@agents/shared/host-events'
import { withProvenance } from './operations.ts'
import { agentStoreId, memoryEnabledFor, MEMORY_TOOL_NAME, MEMORY_SERVER_ID, MEMORY_TOOL_ANNOTATIONS, type MemoryDocument } from '../memory/operations.ts'
import { loadMemory } from '../memory/service.ts'
import { createMemoryTool } from '../memory/tool.ts'
import { REPORT_OUTCOME_TOOL_NAME } from './service-tool-names.ts'

export type TaskOutcome = NonNullable<ConversationRun['outcome']>

/** The source a stored `report_outcome` call names: the service itself, not a catalog server. */
const AGENT_SERVICE_ID = 'agent-service'

export type TurnSurface = 'chat' | 'task'

export interface ServiceToolContext {
  agent: AutonomousAgent
  run: ConversationRun
  surface: TurnSurface
  /** The page in front of the person, when one is watching. */
  session?: AgentSession
  /** Where a task run's `report_outcome` lands (the task target's holder); absent on a chat. */
  reportOutcome?: (outcome: TaskOutcome) => void
}

export interface BuiltServiceTools {
  tools: Record<string, Tool>
  serverByTool: Map<string, string>
  annotationsByTool: Map<string, Record<string, unknown>>
  /** The agent's memory as of run start, when the memory entry applied: rendered into the system prompt. */
  memory?: MemoryDocument[]
}

interface ServiceToolEntry {
  applies: (ctx: ServiceToolContext) => boolean
  build: (ctx: ServiceToolContext, into: BuiltServiceTools) => Promise<void>
}

const ENTRIES: ServiceToolEntry[] = [
  {
    // `wait_for_user_action`: only when someone is actually there to act. Calling it ends the turn (see
    // `handover` in runModelLoop and ./waits.ts). Unwrapped, as before: its result is the loop's own
    // handover marker, not data from a server.
    applies: ctx => ctx.surface === 'chat' && !!ctx.session,
    build: async (_ctx, into) => { into.tools[WAIT_TOOL_NAME] = createWaitTool() }
  },
  {
    // THE AGENT'S MEMORY (docs/architecture/agent-memory.md). Read ONCE, here: the block rendered from it
    // is part of the system prompt, the run's stable prefix — writes made during the turn appear from the
    // next run. On every surface: it does not need anyone watching.
    applies: ctx => memoryEnabledFor(ctx.agent),
    build: async ({ agent, run }, into) => {
      const storeId = agentStoreId(agent.id)
      into.memory = await loadMemory(storeId)
      Object.assign(into.tools, withProvenance({
        [MEMORY_TOOL_NAME]: createMemoryTool({
          storeId,
          owner: run.owner,
          allowDelete: true,
          author: toolCallId => ({
            kind: 'agent',
            agentId: agent.id,
            runId: run.id,
            ...(run.conversationId ? { conversationId: run.conversationId } : {}),
            ...(run.taskId ? { taskId: run.taskId } : {}),
            ...(toolCallId ? { toolCallId } : {})
          })
        })
      }, () => MEMORY_SERVER_ID))
      into.serverByTool.set(MEMORY_TOOL_NAME, MEMORY_SERVER_ID)
      into.annotationsByTool.set(MEMORY_TOOL_NAME, MEMORY_TOOL_ANNOTATIONS)
    }
  },
  {
    // `report_outcome`: how a planned task's run tells an admin what it found or did — the run's
    // `outcome`, which the notifications read. Only on the task surface: a chat's outcome is the
    // conversation itself. A second call replaces the first; no call at all leaves the outcome absent,
    // which is not the same as `done`.
    applies: ctx => ctx.surface === 'task' && !!ctx.reportOutcome,
    build: async ({ reportOutcome }, into) => {
      Object.assign(into.tools, withProvenance({
        [REPORT_OUTCOME_TOOL_NAME]: tool({
          description: 'Report the outcome of this planned task run, once you are done: "done" when you did what the task asks, "nothing-to-do" when there was nothing to do, "needs-attention" when a person should look at something. The summary is what an administrator reads.',
          inputSchema: jsonSchema<TaskOutcome>({
            type: 'object',
            additionalProperties: false,
            required: ['status', 'summary'],
            properties: {
              status: { type: 'string', enum: ['done', 'nothing-to-do', 'needs-attention'] },
              summary: { type: 'string', maxLength: 1000 }
            }
          }),
          execute: async (input: TaskOutcome) => {
            reportOutcome!({ status: input.status, summary: input.summary })
            return 'Outcome recorded.'
          }
        })
      }, () => AGENT_SERVICE_ID))
      into.serverByTool.set(REPORT_OUTCOME_TOOL_NAME, AGENT_SERVICE_ID)
    }
  }
]

export const buildServiceTools = async (ctx: ServiceToolContext): Promise<BuiltServiceTools> => {
  const built: BuiltServiceTools = { tools: {}, serverByTool: new Map(), annotationsByTool: new Map() }
  for (const entry of ENTRIES) if (entry.applies(ctx)) await entry.build(ctx, built)
  return built
}

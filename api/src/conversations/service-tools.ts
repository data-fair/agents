/**
 * The service's own tools: what the loop offers beside the catalog's and the page's.
 *
 * One registry instead of a hand-wired branch per tool in performTurn. Each entry states:
 *  - when it applies — the SURFACE (a chat, or a planned task's run, which nobody watches) and the agent;
 *  - how it builds its tools for this turn.
 * Provenance and annotations come from the entry, so a stored call names its source like a catalog call
 * does. Service tools are outside the approval POLICY (approval-policy.ts covers catalog tools) — those
 * that must always be approved, `request_web_access` and the planning tools, set `needsApproval`
 * themselves and go through the same gate. No page tool or sub-agent config can displace them (./service-tool-names.ts).
 */
import { tool, jsonSchema } from 'ai'
import type { AutonomousAgent, ConversationRun } from '#types'
import type { AgentSession } from '../agent-session/session.ts'
import { WAIT_TOOL_NAME } from '@agents/shared/agent-activity'
import { createWaitTool } from '../agent-session/host-events.ts'
import { sourcedTools, type ToolSet } from './operations.ts'
import { agentStoreId, memoryEnabledFor, MEMORY_TOOL_NAME, MEMORY_SERVER_ID, MEMORY_TOOL_ANNOTATIONS, type MemoryDocument } from '../memory/operations.ts'
import { loadMemory } from '../memory/service.ts'
import { createMemoryTool } from '../memory/tool.ts'
import { REPORT_OUTCOME_TOOL_NAME } from './service-tool-names.ts'
import { validateTaskOutcome, TASK_OUTCOME_STATUSES, TASK_OUTCOME_SUMMARY_MAX, type TaskOutcome } from '../tasks/operations.ts'
import type { TurnFiles } from '../files/turn-files.ts'
import { createFileTools } from '../files/tools.ts'
import { FILES_SERVER_ID, FILE_TOOL_ANNOTATIONS } from '../files/operations.ts'
import { createWebTools, createRequestWebAccessTool, REQUEST_WEB_ACCESS_TOOL_NAME, WEB_TOOL_ANNOTATIONS, FETCH_URL_WITH_FILES_ANNOTATIONS, FETCH_URL_TOOL_NAME } from '../web/tools.ts'
import { WEB_SERVER_ID } from '../web/operations.ts'
import { createRequestMcpAccessTool } from '../mcp-servers/external.ts'
import { REQUEST_MCP_ACCESS_TOOL_NAME, EXTERNAL_MCP_SERVER_ID } from '../mcp-servers/operations.ts'
import { saveExternalMcpServers, saveWebAllowedUrls } from '../autonomous-agents/service.ts'
import { PERSONAL_AGENT_ID } from '../agent-session/personal-agent.ts'
import { createSelfKnowledgeTools } from '../self-knowledge/tools.ts'
import { createPlanningTools, PLANNING_TOOL_ANNOTATIONS } from '../self-knowledge/planning.ts'
import { SELF_KNOWLEDGE_SERVER_ID } from '../self-knowledge/operations.ts'

export type { TaskOutcome }

/** The source a stored `report_outcome` call names: the service itself, not a catalog server. */
const AGENT_SERVICE_ID = 'agent-service'

/** The access requests (`request_web_access`, `request_mcp_access`): approved, they write the agent's configuration. */
const ACCESS_REQUEST_ANNOTATIONS = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }

export type TurnSurface = 'chat' | 'task'

/** What the agent's catalog servers offered this turn, before the approval policy: what it reads about itself. */
export interface TurnCatalog {
  /** The tools the agent's servers listed, after its toolFilter, with their server and declared annotations. */
  tools: ToolSet
  /** Listed by a server but excluded by the reference's toolFilter. */
  filteredOut: { name: string, server: string }[]
  /** Tools that take a file, not offered because files are off. */
  needsFiles?: { name: string, server: string }[]
  skippedServers: { id: string, reason: string }[]
}

export interface ServiceToolContext {
  /** The turn's files, for a configured agent on a deployment with a file store (docs/architecture/agent-files.md). */
  files?: TurnFiles
  agent: AutonomousAgent
  run: ConversationRun
  surface: TurnSurface
  /** The page in front of the person, when one is watching. */
  session?: AgentSession
  /** Where a task run's `report_outcome` lands (the task target's holder); absent on a chat. */
  reportOutcome?: (outcome: TaskOutcome) => void
  /** The turn's catalog tools, for the agent's own reading of what it can use. */
  catalog?: TurnCatalog
}

export interface BuiltServiceTools {
  tools: ToolSet
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
    build: async (_ctx, into) => { into.tools[WAIT_TOOL_NAME] = { tool: createWaitTool() } }
  },
  {
    // THE AGENT'S MEMORY (docs/architecture/agent-memory.md). Read ONCE, here: the block rendered from it
    // is part of the system prompt, the run's stable prefix — writes made during the turn appear from the
    // next run. On every surface: it does not need anyone watching.
    applies: ctx => memoryEnabledFor(ctx.agent),
    build: async ({ agent, run }, into) => {
      const storeId = agentStoreId(agent.id)
      into.memory = await loadMemory(storeId)
      Object.assign(into.tools, sourcedTools({
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
      }, MEMORY_SERVER_ID, () => MEMORY_TOOL_ANNOTATIONS))
    }
  },
  {
    // FILES (api/src/files): a configured agent's files, on every surface, when the deployment has a file
    // store. performTurn gives `files` to configured agents only: the personal assistant has none (spec §2).
    applies: ctx => !!ctx.files,
    build: async ({ files }, into) => {
      Object.assign(into.tools, sourcedTools(createFileTools(files!), FILES_SERVER_ID, name => FILE_TOOL_ANNOTATIONS[name]))
    }
  },
  {
    // WEB ACCESS (api/src/web): reading pages, feeds and sitemaps under the agent's allowed URLs, on every
    // surface — a planned task watching sites is the point. Never the personal assistant: what a page says
    // could instruct it with the person's own permissions.
    // `request_web_access` asks for more and always needs approval, so only in a chat, and only one with
    // an administrator in it: only an administrator may approve it (conversations/approvals.ts), so
    // offering it to anyone else would end their turn on a card they cannot decide. A run continuing
    // from a decision was started by the decider, so the approved call finds its tool there.
    applies: ctx => ctx.agent.id !== PERSONAL_AGENT_ID && !!ctx.agent.web?.enabled,
    build: async ({ agent, run, surface, files }, into) => {
      // One array for the run: an approved request extends it in place, so the readers see the new URLs.
      const allowedUrls = [...(agent.web?.allowedUrls ?? [])]
      const tools = createWebTools({ allowedUrls, ...(files ? { files } : {}) })
      if (surface === 'chat' && run.triggeredByRole === 'admin') {
        tools[REQUEST_WEB_ACCESS_TOOL_NAME] = createRequestWebAccessTool({ allowedUrls, save: urls => saveWebAllowedUrls(agent, urls) })
      }
      Object.assign(into.tools, sourcedTools(tools, WEB_SERVER_ID, name => name === REQUEST_WEB_ACCESS_TOOL_NAME ? ACCESS_REQUEST_ANNOTATIONS : files && name === FETCH_URL_TOOL_NAME ? FETCH_URL_WITH_FILES_ANNOTATIONS : WEB_TOOL_ANNOTATIONS))
    }
  },
  {
    // EXTERNAL MCP (api/src/mcp-servers/external.ts): asking to connect a public MCP server. Only in a chat
    // an administrator started, like request_web_access and for the same reason: only an administrator may
    // approve it. Never the personal assistant, which has no external servers.
    applies: ctx => ctx.agent.id !== PERSONAL_AGENT_ID && ctx.surface === 'chat' && ctx.run.triggeredByRole === 'admin',
    build: async ({ agent }, into) => {
      const tools = { [REQUEST_MCP_ACCESS_TOOL_NAME]: createRequestMcpAccessTool({ servers: [...(agent.externalMcpServers ?? [])], save: servers => saveExternalMcpServers(agent, servers) }) }
      Object.assign(into.tools, sourcedTools(tools, EXTERNAL_MCP_SERVER_ID, () => ACCESS_REQUEST_ANNOTATIONS))
    }
  },
  {
    // SELF-KNOWLEDGE (api/src/self-knowledge): a configured agent reads its own configuration, tasks and
    // runs, on both surfaces, so it can say why something is out of reach instead of guessing. Read-only;
    // what a past run read comes back inside the envelope like any tool result: reported, not obeyed.
    // The list of the turn's other service tools is read when called, so entries built after this one
    // (report_outcome) are in it.
    applies: ctx => ctx.agent.id !== PERSONAL_AGENT_ID,
    build: async (ctx, into) => {
      const tools = createSelfKnowledgeTools(ctx, () => Object.keys(into.tools))
      Object.assign(into.tools, sourcedTools(tools, SELF_KNOWLEDGE_SERVER_ID, () => ({ readOnlyHint: true })))
    }
  },
  {
    // PLANNING (api/src/self-knowledge/planning.ts): a configured agent plans, changes and deletes its own
    // tasks. Only in a chat: every call needs the person's approval, and a task run has nobody to give it.
    // And only in a turn an administrator of the organization started: only an administrator may approve
    // these calls (conversations/approvals.ts), as only one may write tasks through the routes, so offering
    // them to anyone else would end their turn on a card they cannot decide. A run continuing from a
    // decision was started by the decider, so the approved call finds its tool there.
    applies: ctx => ctx.agent.id !== PERSONAL_AGENT_ID && ctx.surface === 'chat' && ctx.run.triggeredByRole === 'admin',
    build: async (ctx, into) => {
      const tools = createPlanningTools(ctx)
      Object.assign(into.tools, sourcedTools(tools, SELF_KNOWLEDGE_SERVER_ID, name => PLANNING_TOOL_ANNOTATIONS[name]))
    }
  },
  {
    // `report_outcome`: how a planned task's run tells an admin what it found or did — the run's
    // `outcome`, which the notifications read. Only on the task surface: a chat's outcome is the
    // conversation itself. A second call replaces the first; no call at all leaves the outcome absent,
    // which is not the same as `done`.
    applies: ctx => ctx.surface === 'task' && !!ctx.reportOutcome,
    build: async ({ reportOutcome }, into) => {
      Object.assign(into.tools, sourcedTools({
        [REPORT_OUTCOME_TOOL_NAME]: tool({
          description: 'Report the outcome of this planned task run, once you are done: "done" when you did what the task asks, "nothing-to-do" when there was nothing to do, "needs-attention" when a person should look at something. The summary is what an administrator reads.',
          inputSchema: jsonSchema<unknown>({
            type: 'object',
            additionalProperties: false,
            required: ['status', 'summary'],
            properties: {
              status: { type: 'string', enum: TASK_OUTCOME_STATUSES },
              summary: { type: 'string', maxLength: TASK_OUTCOME_SUMMARY_MAX }
            }
          }),
          // The schema above is advertised, not enforced, by the AI SDK: validated here, and a bad input
          // throws, so the call is stored `output-error` and the model reads why and can retry.
          execute: async (input: unknown) => {
            reportOutcome!(validateTaskOutcome(input))
            return 'Outcome recorded.'
          }
        })
      }, AGENT_SERVICE_ID))
    }
  }
]

export const buildServiceTools = async (ctx: ServiceToolContext): Promise<BuiltServiceTools> => {
  const built: BuiltServiceTools = { tools: {} }
  for (const entry of ENTRIES) if (entry.applies(ctx)) await entry.build(ctx, built)
  return built
}

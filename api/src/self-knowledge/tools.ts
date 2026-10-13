/**
 * The self-knowledge tools of a configured autonomous agent: stateful reads (its tasks, its runs, the
 * catalog) handed to the pure renderers of ./operations.ts. Registered by the service-tool registry
 * (conversations/service-tools.ts), which wraps every result in the provenance envelope.
 */
import { tool, jsonSchema, type Tool } from 'ai'
import config from '#config'
import mongo from '#mongo'
import type { AccountKeys } from '@data-fair/lib-express'
import type { ServiceToolContext } from '../conversations/service-tools.ts'
import { listTasks, listRuns, getRun, type RunFilters } from '../tasks/service.ts'
import { memoryEnabledFor } from '../memory/operations.ts'
import { renderConfiguration, renderRunRow, exportPage, SELF_KNOWLEDGE_TOOL_NAMES, LIST_RUNS_MAX, LIST_MY_RUNS_DESCRIPTION, READ_CONVERSATION_DESCRIPTION } from './operations.ts'
import { buildConversationExport } from '../review/operations.ts'
import { runAsMessages } from '../tasks/run-messages.ts'
import type { ScheduleRule } from '@agents/shared/task-schedule'

const LIST_RUNS_DEFAULT = 10

/** An HTTP error from the read layer keeps its status in the text the model reads (e.g. "404 unknown run"). */
export const asToolError = (err: any): never => {
  throw new Error(err?.status ? `${err.status} ${err.message}` : err?.message ?? String(err))
}

const taskTitles = async (owner: AccountKeys, agentId: string) =>
  new Map((await listTasks(owner, agentId)).map(task => [task.id, task.title]))

export const createSelfKnowledgeTools = (ctx: ServiceToolContext, serviceToolNames: () => string[]): Record<string, Tool> => {
  const { agent, run, surface } = ctx
  const owner = run.owner as AccountKeys
  const own = new Set<string>(SELF_KNOWLEDGE_TOOL_NAMES)

  return {
    get_my_configuration: tool({
      description: 'Read your own configuration: identity, approval policy, every tool with whether you can use it here and why not, the servers you are not connected to, your planned tasks and whether your memory is on.',
      inputSchema: jsonSchema<unknown>({ type: 'object', additionalProperties: false, properties: {} }),
      execute: async () => {
        const referenced = new Set((agent.mcpServers ?? []).map(ref => ref.serverId))
        const tasks = await listTasks(owner, agent.id)
        return renderConfiguration({
          agent: { title: agent.title, persona: agent.persona, instructions: agent.instructions, approvals: agent.approvals, memoryEnabled: memoryEnabledFor(agent) },
          surface,
          files: !!ctx.files,
          catalog: ctx.catalog ?? { tools: {}, filteredOut: [], skippedServers: [] },
          serviceTools: serviceToolNames().filter(name => !own.has(name)),
          notConnected: (config.mcpServers ?? []).filter(server => !referenced.has(server.id))
            .map(({ id, name, description }) => ({ id, name, description })),
          skills: (ctx.guides?.list ?? []).flatMap(g => g.skills.map(s => ({ server: g.server, name: s.name, uri: s.uri }))),
          tasks: tasks.map(task => ({ ...task, scheduling: task.scheduling as ScheduleRule[] }))
        })
      }
    }),
    list_my_runs: tool({
      description: LIST_MY_RUNS_DESCRIPTION,
      inputSchema: jsonSchema<unknown>({
        type: 'object',
        additionalProperties: false,
        properties: {
          kind: { type: 'string', enum: ['task', 'conversation'] },
          taskId: { type: 'string' },
          status: { type: 'string', description: 'running, done, error, aborted, interrupted or skipped' },
          outcome: { type: 'string', enum: ['done', 'nothing-to-do', 'needs-attention'] },
          since: { type: 'string', description: 'An ISO date: only runs started at or after it.' },
          limit: { type: 'number', minimum: 1, maximum: LIST_RUNS_MAX, default: LIST_RUNS_DEFAULT }
        }
      }),
      execute: async (input: any) => {
        const filters: RunFilters = {}
        for (const key of ['kind', 'taskId', 'status', 'outcome', 'since'] as const) {
          if (typeof input?.[key] === 'string') (filters as any)[key] = input[key]
        }
        const limit = Math.min(Math.max(Math.floor(Number(input?.limit) || LIST_RUNS_DEFAULT), 1), LIST_RUNS_MAX)
        const { results, count } = await listRuns(owner, agent.id, filters, { page: 1, size: limit }).catch(asToolError)
        if (!results.length) return 'No runs.'
        const titles = await taskTitles(owner, agent.id)
        const conversationIds = [...new Set(results.map(r => r.conversationId).filter((id): id is string => !!id))]
        const conversationTitles = new Map((await mongo.conversations.find({ id: { $in: conversationIds } }, { projection: { _id: 0, id: 1, title: 1 } }).toArray()).map(c => [c.id, c.title]))
        return [`${results.length} of ${count} runs (id | kind | subject | trigger | started | status | outcome | credits):`,
          ...results.map(r => renderRunRow(r, r.taskId ? titles.get(r.taskId) : conversationTitles.get(r.conversationId ?? ''), run.conversationId)),
          'Read a conversation (conversationId) or a task run (runId) with read_conversation.'].join('\n')
      }
    }),
    // Every conversation of the agent, whoever had it: an agent has ONE history, which is why its
    // conversations are audited and carry no consent (docs/architecture/agent-memory.md). Read in the
    // conversation export, the file maintainers download and the simulation judge reads, page by page.
    read_conversation: tool({
      description: READ_CONVERSATION_DESCRIPTION,
      inputSchema: jsonSchema<unknown>({
        type: 'object',
        additionalProperties: false,
        properties: {
          conversationId: { type: 'string' },
          runId: { type: 'string', description: 'A task run, instead of a conversation' },
          line: { type: 'integer', minimum: 1, description: 'The line to read from: the page runs on from it, several lines at once. Without it: the file description and the outline only (lines 1 and 2)' },
          offset: { type: 'integer', minimum: 0, description: 'Where to go on inside that line, from a previous page' }
        }
      }),
      execute: async (input: any) => {
        // No line: the description and the outline only (exportPage), what a first read should be.
        const line = input?.line === undefined || input?.line === null ? undefined : Math.max(1, Math.floor(Number(input.line) || 1))
        const offset = Math.max(0, Math.floor(Number(input?.offset) || 0))
        if (input?.runId) {
          const run = await getRun(owner, agent.id, String(input.runId)).catch(asToolError)
          if (run.kind !== 'task') throw new Error(`run ${run.id} is a conversation turn: read conversation ${run.conversationId}`)
          const { prompt, parts, ...withoutContent } = run
          const title = run.taskId ? (await taskTitles(owner, agent.id)).get(run.taskId) : undefined
          return exportPage(buildConversationExport({
            conversation: { kind: 'task', id: run.id, taskId: run.taskId, agentId: agent.id, ...(title ? { title } : {}) },
            messages: runAsMessages(run),
            runs: [withoutContent]
          }), line, offset)
        }
        const conversation = await mongo.conversations.findOne(
          { id: String(input?.conversationId ?? ''), agentId: agent.id, 'owner.type': owner.type, 'owner.id': owner.id },
          { projection: { _id: 0 } }
        )
        if (!conversation) throw new Error('404 unknown conversation')
        const [messages, runs] = await Promise.all([
          mongo.messages.find({ conversationId: conversation.id }, { projection: { _id: 0 } }).sort({ seq: 1 }).toArray(),
          mongo.runs.find({ conversationId: conversation.id }, { projection: { _id: 0 } }).sort({ startedAt: 1 }).toArray()
        ])
        return exportPage(buildConversationExport({ conversation, messages, runs }), line, offset)
      }
    })
  }
}

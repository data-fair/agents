/**
 * The self-knowledge tools of a configured autonomous agent: stateful reads (its tasks, its runs, the
 * catalog) handed to the pure renderers of ./operations.ts. Registered by the service-tool registry
 * (conversations/service-tools.ts), which wraps every result in the provenance envelope.
 */
import { tool, jsonSchema, type Tool } from 'ai'
import config from '#config'
import type { AccountKeys } from '@data-fair/lib-express'
import type { ServiceToolContext } from '../conversations/service-tools.ts'
import { listTasks, listRuns, getRun, type RunFilters } from '../tasks/service.ts'
import { memoryEnabledFor } from '../memory/operations.ts'
import { renderConfiguration, renderRun, renderRunRow, SELF_KNOWLEDGE_TOOL_NAMES } from './operations.ts'
import type { ScheduleRule } from '@agents/shared/task-schedule'

const LIST_RUNS_DEFAULT = 10
const LIST_RUNS_MAX = 20

/** An HTTP error from the read layer keeps its status in the text the model reads (e.g. "404 unknown run"). */
const asToolError = (err: any): never => {
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
          catalog: ctx.catalog ?? { serverByTool: new Map(), annotationsByTool: new Map(), filteredOut: [], skippedServers: [] },
          serviceTools: serviceToolNames().filter(name => !own.has(name)),
          notConnected: (config.mcpServers ?? []).filter(server => !referenced.has(server.id))
            .map(({ id, name, description }) => ({ id, name, description })),
          tasks: tasks.map(task => ({ ...task, scheduling: task.scheduling as ScheduleRule[] }))
        })
      }
    }),
    list_my_runs: tool({
      description: `List your past runs, newest first: planned task runs and conversation turns, with their status, outcome and cost. At most ${LIST_RUNS_MAX} rows.`,
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
        return [`${results.length} of ${count} runs (id | kind | subject | trigger | started | status | outcome | credits):`,
          ...results.map(r => renderRunRow(r, r.taskId ? titles.get(r.taskId) : undefined))].join('\n')
      }
    }),
    get_run: tool({
      description: 'Read one of your runs by id: a task run with its outcome and transcript, a conversation run as its metadata only.',
      inputSchema: jsonSchema<unknown>({ type: 'object', additionalProperties: false, required: ['runId'], properties: { runId: { type: 'string' } } }),
      execute: async (input: any) => {
        const found = await getRun(owner, agent.id, String(input?.runId ?? '')).catch(asToolError)
        const title = found.taskId ? (await taskTitles(owner, agent.id)).get(found.taskId) : undefined
        return renderRun(found, title)
      }
    })
  }
}

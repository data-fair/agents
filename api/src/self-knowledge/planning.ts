/**
 * The planning tools of a configured autonomous agent: it plans, changes and deletes its own tasks, through
 * the same task service as the admin routes (caps, minimum interval and next slot included).
 *
 * Every call needs the person's approval in the chat (`needsApproval` on the tool itself: service tools are
 * outside the approval policy, so no policy can unset it). An approved call runs inside the continuation
 * run, which the decider triggered: the task records them, and the conversation it came from, as its actor.
 * Registered by the service-tool registry (conversations/service-tools.ts), chat surface only.
 */
import { tool, jsonSchema, type Tool } from 'ai'
import type { AccountKeys } from '@data-fair/lib-express'
import type { EventLogContext } from '@data-fair/lib-express/events-log.js'
import type { Account } from '@data-fair/lib-common-types/session/index.js'
import type { ServiceToolContext } from '../conversations/service-tools.ts'
import { createTask, updateTask, deleteTask, getTask, type TaskActor } from '../tasks/service.ts'
import * as taskWriteReq from '#doc/autonomous-agents/task-write-req/index.ts'
import taskWriteReqSchema from '#doc/autonomous-agents/task-write-req/schema.js'
import { describeScheduling, type ScheduleRule } from '@agents/shared/task-schedule'
import { asToolError } from './tools.ts'

// The `title` is the person's name for the call: it heads the approval card and labels the chip, where
// the description is written for the model.
export const PLANNING_TOOL_ANNOTATIONS: Record<string, Record<string, unknown>> = {
  plan_task: { title: 'Plan a task', readOnlyHint: false, destructiveHint: false },
  update_task: { title: 'Change a task', readOnlyHint: false, destructiveHint: false },
  delete_task: { title: 'Delete a task', destructiveHint: true }
}

/** The admin form's schema, without what only the form reads (i18n titles, layouts, ids): what the model reads. */
const forModel = (value: any): any => {
  if (Array.isArray(value)) return value.map(forModel)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !key.startsWith('x-') && !['$id', 'layout', 'oneOfLayout'].includes(key))
    .map(([key, child]) => [key, forModel(child)]))
}
const taskSchema = forModel(taskWriteReqSchema)

const APPROVAL_NOTE = 'The person in this chat will see the task and approve or reject it; nothing changes until they approve.'
const REFUSAL_NOTE = 'A refusal for the schedule, the minimum interval or the task cap is final: do not retry the same input, tell the person.'
const SCHEDULE_NOTE = 'Schedules use the rule format of data-fair processings (see the schema): one or more monthly, weekly, daily or every-N-hours rules, each at a time in a time zone.'

/** An HTTP error from the task service (400 cap or interval, invalid input, 404) keeps its status in the text. */
const guarded = <T>(write: () => Promise<T>): Promise<T> => write().catch(asToolError)

const planned = (task: { id: string, title: string, scheduling: unknown, nextRunAt?: string }) =>
  `Task "${task.title}" planned (id ${task.id}): ${describeScheduling(task.scheduling as ScheduleRule[], 'en')}, next run ${task.nextRunAt ?? 'none'}.`

export const createPlanningTools = ({ agent, run }: ServiceToolContext): Record<string, Tool> => {
  const owner = run.owner as AccountKeys
  // The continuation run's trigger: the person who approved the call. An approved call only ever runs in
  // such a run, so a missing one is refused rather than recorded as nobody. When two calls of one step are
  // decided by different people, the run is triggered by the LAST decider (conversations/approvals.ts), so
  // the recorded approver of the other call is that person: rare (a second instructor deciding in someone
  // else's conversation) and accepted.
  const actor = (): TaskActor => {
    const { userId, userName } = run.triggeredBy ?? {}
    if (!userId) throw new Error('no person approved this change')
    return { userId, ...(userName ? { userName } : {}), ...(run.conversationId ? { conversationId: run.conversationId } : {}) }
  }
  // The same events-log entry as the admin route's, for the account and the approver (no request here).
  const log = (): EventLogContext => {
    const { userId, userName } = actor()
    return { account: run.owner as Account, user: { id: userId, name: userName ?? userId } }
  }

  return {
    plan_task: tool({
      description: `Plan a new task of yours: an instruction you will run on a schedule, with nobody present. ${APPROVAL_NOTE} ${SCHEDULE_NOTE} ${REFUSAL_NOTE}`,
      inputSchema: jsonSchema<unknown>(taskSchema),
      needsApproval: true,
      execute: async (input: unknown) => {
        const task = await guarded(async () => createTask(owner, agent, taskWriteReq.returnValid(input, { name: 'input' }), actor(), log()))
        return planned(task)
      }
    }),
    update_task: tool({
      description: `Change one of your planned tasks: give its id and the whole new task (title, prompt, scheduling, enabled), not only what changes. ${APPROVAL_NOTE} ${SCHEDULE_NOTE} ${REFUSAL_NOTE}`,
      inputSchema: jsonSchema<unknown>({
        ...taskSchema,
        required: ['taskId', ...taskSchema.required],
        properties: { taskId: { type: 'string' }, ...taskSchema.properties }
      }),
      needsApproval: true,
      execute: async (input: any) => {
        const { taskId, ...body } = input ?? {}
        const task = await guarded(async () => updateTask(owner, agent, String(taskId ?? ''), taskWriteReq.returnValid(body, { name: 'input' }), actor(), log()))
        return planned(task)
      }
    }),
    delete_task: tool({
      description: `Delete one of your planned tasks, by id. ${APPROVAL_NOTE}`,
      inputSchema: jsonSchema<unknown>({ type: 'object', additionalProperties: false, required: ['taskId'], properties: { taskId: { type: 'string' } } }),
      needsApproval: true,
      execute: async (input: any) => {
        const taskId = String(input?.taskId ?? '')
        // Read first: a task deleted since the call was asked is a 404 here, not a silent success.
        const { title } = await guarded(() => getTask(owner, agent.id, taskId))
        await guarded(async () => deleteTask(owner, agent.id, taskId, log()))
        return `Task "${title}" deleted.`
      }
    })
  }
}

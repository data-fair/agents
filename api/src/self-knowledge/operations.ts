/**
 * operations.ts contains pure stateless functions
 *
 * What a configured autonomous agent reads about itself: its configuration, rendered with the reason each
 * tool is or is not within reach, and its runs. Rendered as plain text for the model, from plain data
 * (./tools.ts reads it). Whoever triggered a run is never named: the agent's history is not a directory of
 * who talks to it.
 */
import type { ConversationRun } from '#types'
import { describeScheduling, type ScheduleRule } from '@agents/shared/task-schedule'
import { classifyTool, resolveApproval, type ApprovalClass, type Approvals } from '../conversations/approval-policy.ts'
import type { TurnCatalog, TurnSurface } from '../conversations/service-tools.ts'
import { transcriptForReflection } from '../memory/operations.ts'
import { runAsMessages } from '../tasks/run-messages.ts'

export const SELF_KNOWLEDGE_TOOL_NAMES = ['get_my_configuration', 'list_my_runs', 'get_run'] as const

/** The planning tools (./planning.ts): the agent's writes to its own tasks, each approved in the chat. */
export const PLANNING_TOOL_NAMES = ['plan_task', 'update_task', 'delete_task'] as const

/** What a chat turn's configuration says when the planning tools were not offered. */
export const PLANNING_NEEDS_ADMIN = 'Planning tasks needs an administrator of the organization in the chat.'

/** The source a stored self-knowledge or planning call names. */
export const SELF_KNOWLEDGE_SERVER_ID = 'agent-self'

/** How much of an outcome summary a run row shows: the row is a listing, `get_run` has the rest. */
export const RUN_ROW_SUMMARY_CHARS = 300

export interface ConfigurationView {
  agent: { title: string, persona: string, instructions?: string, approvals?: Approvals, memoryEnabled: boolean }
  surface: TurnSurface
  catalog: TurnCatalog
  /** The other service tools offered this turn. */
  serviceTools: string[]
  /** Catalog servers the agent does not reference. */
  notConnected: { id: string, name: string, description?: string }[]
  tasks: { id: string, title: string, scheduling: ScheduleRule[], nextRunAt?: string, enabled: boolean, pausedReason?: string }[]
}

const CLASS_LABELS: Record<ApprovalClass, string> = { readOnly: 'read-only tools', write: 'write tools', destructive: 'destructive tools' }

/**
 * Why a catalog tool is or is not usable this turn, by the same rule the turn applies: `deny` removes it,
 * `approve` gates it in a chat and removes it on the task surface (withoutGatedTools).
 */
const toolStatus = (annotations: Record<string, unknown> | undefined, approvals: Approvals | undefined, surface: TurnSurface): string => {
  const policy = resolveApproval(classifyTool(annotations), approvals)
  if (policy === 'deny') return 'not usable: denied by policy'
  if (policy === 'approve') return surface === 'task' ? 'not usable here: needs approval and nobody is present' : 'needs the person\'s approval'
  return 'usable'
}

const bullets = (items: string[]) => items.length ? items.map(item => `- ${item}`).join('\n') : 'None.'

export const renderConfiguration = (view: ConfigurationView): string => {
  const { agent, surface, catalog } = view
  const tools = [
    ...[...catalog.serverByTool].map(([name, server]) => `${name} (server ${server}): ${toolStatus(catalog.annotationsByTool.get(name), agent.approvals, surface)}`),
    ...catalog.filteredOut.map(({ name, server }) => `${name} (server ${server}): not selected for you by an administrator`),
    ...catalog.skippedServers.map(({ id, reason }) => `server ${id}: server unreachable: ${reason}`)
  ]
  const tasks = view.tasks.map(task => {
    const state = task.pausedReason ? `paused: ${task.pausedReason}` : task.enabled ? 'enabled' : 'disabled'
    return `${task.id}: ${task.title} — ${describeScheduling(task.scheduling, 'en')} — next run: ${task.nextRunAt ?? 'none'} — ${state}`
  })
  return [
    `# ${agent.title}`,
    '## Persona',
    agent.persona,
    '## Instructions',
    agent.instructions || 'None.',
    '## Approval policy',
    bullets((Object.keys(CLASS_LABELS) as ApprovalClass[]).map(cls => `${CLASS_LABELS[cls]}: ${resolveApproval(cls, agent.approvals)}`)),
    '## Tools',
    bullets(tools),
    '## Service tools offered this turn',
    bullets(view.serviceTools),
    '## Not connected',
    bullets(view.notConnected.map(server => `${server.id}: ${server.name}${server.description ? ` — ${server.description}` : ''}`)),
    '## Planned tasks',
    bullets(tasks),
    // The planning tools are offered only in a turn an administrator of the organization started
    // (conversations/service-tools.ts): without this line the agent could only guess why it cannot plan.
    ...(surface === 'chat' && !view.serviceTools.includes(PLANNING_TOOL_NAMES[0]) ? [PLANNING_NEEDS_ADMIN] : []),
    '## Memory',
    agent.memoryEnabled ? 'On' : 'Off'
  ].join('\n')
}

const clip = (text: string, max: number) => text.length > max ? `${text.slice(0, max)}…` : text

const isTaskRun = (run: ConversationRun) => run.kind === 'task'

/** One line per run. `taskTitle` is the run's task's, when it still exists. */
export const renderRunRow = (run: ConversationRun, taskTitle: string | undefined): string => {
  const subject = isTaskRun(run) ? `task ${taskTitle ?? run.taskId}` : 'conversation'
  const status = run.status === 'skipped' ? `skipped: ${run.error ?? 'no reason recorded'}` : run.status
  const outcome = run.outcome ? `outcome ${run.outcome.status}: ${clip(run.outcome.summary, RUN_ROW_SUMMARY_CHARS)}` : 'no outcome'
  return [run.id, isTaskRun(run) ? 'task' : 'conversation', subject, `trigger ${run.trigger}`, run.startedAt, status, outcome, `${run.credits ?? 0} credits`].join(' | ')
}

/**
 * One run in full. A task run's content is on the run itself, read as a transcript like memory reflection
 * reads it (tool results cut to an excerpt). A conversation run is its metadata only: reading past
 * conversations belongs to the memory work.
 */
export const renderRun = (run: ConversationRun, taskTitle: string | undefined): string => {
  if (!isTaskRun(run)) return `${renderRunRow(run, taskTitle)}\nConversation content is not available here.`
  return [
    `Task: ${taskTitle ?? run.taskId}`,
    `Trigger: ${run.trigger}`,
    `Status: ${run.status}`,
    ...(run.error ? [`Error: ${run.error}`] : []),
    `Outcome: ${run.outcome ? `${run.outcome.status}: ${run.outcome.summary}` : 'none reported'}`,
    'Transcript:',
    transcriptForReflection(runAsMessages(run)).text
  ].join('\n')
}

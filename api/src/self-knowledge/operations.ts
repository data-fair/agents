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
import { transcriptTail } from '../memory/operations.ts'
import { runAsMessages } from '../tasks/run-messages.ts'

export const SELF_KNOWLEDGE_TOOL_NAMES = ['get_my_configuration', 'list_my_runs', 'get_run', 'read_conversation'] as const

/** How much of a conversation's export one `read_conversation` call returns. */
export const EXPORT_PAGE_CHARS = 30000

/** The planning tools (./planning.ts): the agent's writes to its own tasks, each approved in the chat. */
export const PLANNING_TOOL_NAMES = ['plan_task', 'update_task', 'delete_task'] as const

/** What a chat turn's configuration says when the planning tools were not offered. */
export const PLANNING_NEEDS_ADMIN = 'Planning tasks needs an administrator of the organization in the chat.'

/** What heads the agent's planned tasks in its configuration. */
export const PLANNED_TASKS_HEADER = 'These tasks exist and run on their schedule (an administrator approved or created each one): none awaits approval. A paused or disabled one says so.'

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
    // Said outright: a listed task needs nothing more. A judged run read its own approved, stored task
    // as still awaiting approval and told the person so until they had it deleted.
    ...(tasks.length ? [PLANNED_TASKS_HEADER] : []),
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

/**
 * One line per run. `title` is the run's task's, when it still exists, or its conversation's; `current`
 * marks the conversation being had now, so the agent never mistakes another one's turns for its own.
 */
export const renderRunRow = (run: ConversationRun, title: string | undefined, current?: string): string => {
  const subject = isTaskRun(run)
    ? `task ${title ?? run.taskId}`
    : `conversation ${run.conversationId}${title ? ` "${title}"` : ''}${run.conversationId === current ? ' (this conversation)' : ''}`
  const status = run.status === 'skipped' ? `skipped: ${run.error ?? 'no reason recorded'}` : run.status
  const outcome = run.outcome ? `outcome ${run.outcome.status}: ${clip(run.outcome.summary, RUN_ROW_SUMMARY_CHARS)}` : 'no outcome'
  return [run.id, isTaskRun(run) ? 'task' : 'conversation', subject, `trigger ${run.trigger}`, run.startedAt, status, outcome, `${run.credits ?? 0} credits`].join(' | ')
}

/**
 * One run in full. A task run's content is on the run itself, read as a transcript (tool results cut to
 * an excerpt); `read_conversation` reads it whole. A conversation turn is read in its conversation's
 * export, where its messages are found by their seq.
 */
export const renderRun = (run: ConversationRun, taskTitle: string | undefined, turnSeqs?: { from: number, to: number }): string => {
  if (!isTaskRun(run)) {
    return [
      renderRunRow(run, taskTitle),
      `Read it with read_conversation, conversationId ${run.conversationId}${turnSeqs ? `: this turn is messages seq ${turnSeqs.from} to ${turnSeqs.to}` : ''}.`
    ].join('\n')
  }
  return [
    `Task: ${taskTitle ?? run.taskId}`,
    `Trigger: ${run.trigger}`,
    `Status: ${run.status}`,
    ...(run.error ? [`Error: ${run.error}`] : []),
    `Outcome: ${run.outcome ? `${run.outcome.status}: ${run.outcome.summary}` : 'none reported'}`,
    'Transcript (tool results cut; read_conversation with this runId has them whole):',
    transcriptTail(runAsMessages(run)).text
  ].join('\n')
}

/**
 * One page of a conversation export (api/src/review/operations.ts), as the agent reads it: from `line`
 * (1-based), at most `maxChars`, each line prefixed with its number — the in-tool equivalent of
 * `sed -n`. A line longer than the page is cut, and the next page goes on inside it from `offset`.
 */
export const exportPage = (jsonl: string, line = 1, offset = 0, maxChars = EXPORT_PAGE_CHARS): string => {
  const lines = jsonl.split('\n').filter((l, i, all) => l || i < all.length - 1)
  if (line < 1 || line > lines.length) return `There is no line ${line}: the export has ${lines.length} lines.`
  const out: string[] = []
  let size = 0
  let next: { line: number, offset: number } | undefined
  for (let i = line - 1; i < lines.length; i++) {
    const from = i === line - 1 ? offset : 0
    const rest = lines[i].slice(from)
    const room = maxChars - size
    if (rest.length > room) {
      // Cut a line only when it alone overflows the page, so a page never splits a record it could hold.
      if (out.length && rest.length <= maxChars) { next = { line: i + 1, offset: 0 }; break }
      out.push(`${i + 1}: ${from ? '…' : ''}${rest.slice(0, room)}`)
      next = { line: i + 1, offset: from + room }
      break
    }
    out.push(`${i + 1}: ${from ? '…' : ''}${rest}`)
    size += rest.length
  }
  return [
    ...out,
    next
      ? `[more: call again with line ${next.line}${next.offset ? `, offset ${next.offset}` : ''}]`
      : `[end of the export, ${lines.length} lines]`
  ].join('\n')
}

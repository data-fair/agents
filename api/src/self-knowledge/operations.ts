/**
 * operations.ts contains pure stateless functions
 *
 * What a configured autonomous agent reads about itself: its configuration, rendered with the reason each
 * tool is or is not within reach, and its runs. Rendered as plain text for the model, from plain data
 * (./tools.ts reads it). Whoever triggered a run is never named: the agent's history is not a directory of
 * who talks to it.
 */
import type { ConversationRun } from '#types'
import { FILE_MAX_BYTES, SCOPE_MAX_BYTES, formatBytes } from '../files/operations.ts'
import { describeScheduling, type ScheduleRule } from '@agents/shared/task-schedule'
import { classifyTool, resolveApproval, type ApprovalClass, type Approvals } from '../conversations/approval-policy.ts'
import type { TurnCatalog, TurnSurface } from '../conversations/service-tools.ts'
import type { ServerGuide } from '../mcp-servers/guides.ts'

export const SELF_KNOWLEDGE_TOOL_NAMES = ['get_my_configuration', 'list_my_runs', 'read_conversation'] as const

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

/** How much of an outcome summary a run row shows: the row is a listing, `read_conversation` has the rest. */
export const RUN_ROW_SUMMARY_CHARS = 300

export interface ConfigurationView {
  agent: { title: string, persona: string, instructions?: string, approvals?: Approvals, memoryEnabled: boolean }
  /** Whether this turn has files (a file store is configured). */
  files: boolean
  /** Whether this turn is offered code_mode (code-mode/operations.ts, codeModeOfferedTo). */
  codeMode: boolean
  surface: TurnSurface
  catalog: TurnCatalog
  /** The other service tools offered this turn. */
  serviceTools: string[]
  /** Catalog servers the agent does not reference. */
  notConnected: { id: string, name: string, description?: string }[]
  /** The skills this turn's tool servers publish (docs/architecture/mcp-tools.md, "Server instructions and skills"). */
  skills?: { server: string, name: string, uri: string }[]
  tasks: { id: string, title: string, scheduling: ScheduleRule[], nextRunAt?: string, enabled: boolean, pausedReason?: string }[]
}

const CLASS_LABELS: Record<ApprovalClass, string> = { readOnly: 'read-only tools', write: 'write tools', destructive: 'destructive tools' }

/**
 * Why a catalog tool is or is not usable this turn, by the same rule the turn applies: `deny` removes it,
 * `approve` gates it in a chat and removes it on the task surface (unattended).
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
    ...Object.entries(catalog.tools).map(([name, { server, annotations }]) => `${name} (server ${server}): ${toolStatus(annotations, agent.approvals, surface)}`),
    ...catalog.filteredOut.map(({ name, server }) => `${name} (server ${server}): not selected for you by an administrator`),
    ...(catalog.profiled ?? []).map(({ server, profiles }) => `server ${server}: profiles ${profiles.join(', ')}, chosen by an administrator`),
    ...(catalog.needsFiles ?? []).map(({ name, server }) => `${name} (server ${server}): not usable: it takes a file, and this deployment has no file store`),
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
    '## Skills',
    bullets((view.skills ?? []).map(s => `${s.name} (server ${s.server}): load it with read_skill, uri ${s.uri}`)),
    '## Planned tasks',
    // Said outright: a listed task needs nothing more. A judged run read its own approved, stored task
    // as still awaiting approval and told the person so until they had it deleted.
    ...(tasks.length ? [PLANNED_TASKS_HEADER] : []),
    bullets(tasks),
    // The planning tools are offered only in a turn an administrator of the organization started
    // (conversations/service-tools.ts): without this line the agent could only guess why it cannot plan.
    ...(surface === 'chat' && !view.serviceTools.includes(PLANNING_TOOL_NAMES[0]) ? [PLANNING_NEEDS_ADMIN] : []),
    '## Memory',
    agent.memoryEnabled ? 'On' : 'Off',
    '## Files',
    view.files
      ? `On: your files belong to this conversation (or task run). ls lists them, read_file reads a text file, write_file writes one; fetch_url can save what it downloads (saveAs), a file a tool returns as a link is saved for you, and a tool argument that takes a file takes one of your paths. Up to ${formatBytes(FILE_MAX_BYTES)} per file and ${formatBytes(SCOPE_MAX_BYTES)} in all; a file is deleted 7 days after it was last written.`
      : 'Off: this deployment has no file store, so you cannot download, keep or upload files, and tools that take a file are not offered.',
    '## Code mode',
    view.codeMode ? 'On: code_mode runs a JavaScript script that calls your tools as async functions and transforms what they return, without the intermediate results entering this conversation. It can call every tool you have here except those needing approval, wait_for_user_action, the access and planning requests, read_skill and sub-agents. Limits per script: 100 tool calls, 2 minutes, 10 s of CPU.' : 'Off for this conversation: code_mode is not offered to someone outside the organization.'
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
 * One page of a conversation export (api/src/review/operations.ts), as the agent reads it: from `line`
 * (1-based), at most `maxChars`, each line prefixed with its number — the in-tool equivalent of
 * `sed -n`. A line longer than the page is cut, and the next page goes on inside it from `offset`.
 *
 * Without a `line`: the file description and the outline only (lines 1 and 2), so a first read is what
 * the earlier-work skill and the tool's own guide say to read first, and the rest is asked for by line.
 * Judged runs called it with a conversation id alone and were handed the whole export, system prompt
 * and telemetry included, where they needed two messages.
 */
export const exportPage = (jsonl: string, line?: number, offset = 0, maxChars = EXPORT_PAGE_CHARS): string => {
  const lines = jsonl.split('\n').filter((l, i, all) => l || i < all.length - 1)
  if (line === undefined) {
    const head = lines.slice(0, 2).map((l, i) => `${i + 1}: ${l.slice(0, maxChars)}`)
    const tail = lines.length > 2 ? `[outline only: read the lines you need with \`line\` (from 3 to ${lines.length})]` : `[end of the export, ${lines.length} lines]`
    return [...head, tail].join('\n')
  }
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

/** The most runs one list_my_runs call returns. */
export const LIST_RUNS_MAX = 20

/**
 * WHEN TO READ THE PAST, said where the model reads it: in the two history tools' descriptions, and in the
 * agent's own `earlier-work` skill (below). Judged runs answered "why did you leave them out?" by loading a
 * domain skill and saying they could not see the earlier list: the reference to earlier work was only
 * implied, and "load a matching skill before acting" won over a tool description that only said "earlier".
 */
const LOOK_FIRST = 'Your past conversations and runs are readable: when someone refers to something said, decided or produced earlier — a list, an answer, a choice, what you "left out", "last time", "why did you…" — look here first, even when they do not say it was in another conversation, and before loading a skill, fetching data again or saying you cannot see it. Never say something did not happen, or that you have no access to it, without having read it.'

export const LIST_MY_RUNS_DESCRIPTION = `List your past runs, newest first: planned task runs and conversation turns (with the conversation's title), their status, outcome and cost. At most ${LIST_RUNS_MAX} rows. ${LOOK_FIRST} Then read the one that matches with read_conversation.`

export const READ_CONVERSATION_DESCRIPTION = [
  'Read one of your past conversations (conversationId), whoever had it, or one of your task runs (runId), in full: what was said, every tool call with its whole result, and per turn the instructions and memory you had then. What you remember of other conversations is only what you read here.',
  LOOK_FIRST,
  'It is a JSON Lines file read by pages, each line prefixed with its number. Line 1 describes the file, line 2 is the outline: every record with its line, size and preview. Called without `line`, it returns those two; then call it once with `line` set to the first line you need: it returns from that line ONWARD, as many lines as fit a page, so one call from line 3 usually covers the whole transcript — a large tool result was lifted into its own `blob` line, which the message points at with `__ref`.',
  'A line longer than a page continues with `offset`. Find conversations with list_my_runs.'
].join(' ')

/**
 * The agent's own skills, listed in the system prompt's Skills index under the label `agent` beside the
 * skills its tool servers publish, and loaded with the same read_skill (api/src/mcp-servers/read-skill.ts).
 * A procedure spanning several of the service's own tools is a skill, not a system-prompt sentence: it sits
 * where the model looks for "how do I do this", on the same footing as the servers' skills.
 */
export const AGENT_SKILLS_SERVER = 'agent'
export const EARLIER_WORK_SKILL_URI = 'skill://agent/earlier-work/SKILL.md'

const EARLIER_WORK_BODY = `# Earlier work

Use this whenever someone refers to something said, decided or produced before this conversation, or asks why you did something — even when they only imply it ("the list I sent around", "why were they left out?").

1. Call list_my_runs (narrow it with \`since\` or \`kind: conversation\` when you know roughly when). A conversation row gives its title and conversation id; the one marked "(this conversation)" is the one you are in.
2. Read the conversation that matches with read_conversation: line 1, then the outline on line 2, then only the lines you need.
3. Answer from what you read: what was asked, what you did and why, quoting the instruction or the result. If it was deliberate, say so; do not apologise for a mistake you did not make.
4. Only if nothing matches, say what you looked through and ask a precise question.

Never say you cannot see, do not remember or have no access to earlier work without having looked. Do this before loading another skill, fetching data again or asking for details the earlier conversation already holds.`

const AGENT_SKILLS: Record<string, string> = { [EARLIER_WORK_SKILL_URI]: EARLIER_WORK_BODY }

/** The agent's own guide: its skills, in the shape the servers' guides have (api/src/mcp-servers/guides.ts). */
export const agentGuide = (): ServerGuide => ({
  server: AGENT_SKILLS_SERVER,
  skills: [{
    name: 'earlier-work',
    description: 'When someone refers to something said or done in an earlier conversation or task run, or asks why you did something: how to find and read it before answering.',
    uri: EARLIER_WORK_SKILL_URI
  }]
})

/** One of the agent's own skills, by URI. */
export const readAgentSkill = (uri: string): string => {
  const body = AGENT_SKILLS[uri]
  if (!body) throw new Error(`there is no skill at ${uri}`)
  return body
}

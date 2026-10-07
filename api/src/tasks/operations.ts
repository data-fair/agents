/**
 * operations.ts contains pure stateless functions
 *
 * A planned task's schedule: data-fair processings' rule array (monthly / weekly / daily / every N hours,
 * each with its time zone), converted to cron and computed with croner exactly as processings does
 * (processings/shared/runs.ts), so an admin who schedules a processing schedules a task the same way.
 */
import { Cron } from 'croner'
import type { AutonomousAgentTask } from '#types/autonomous-agent-task/index.ts'
import type { ConversationRun } from '#types'
import type { Event } from '@data-fair/lib-common-types/event/index.js'
import { partsText, type MessagePart } from '@agents/shared/message-parts'

export type Scheduling = AutonomousAgentTask['scheduling'][number]

export const toCron = (rule: Scheduling): string => {
  const r = rule as any
  const minute = r.minute + (r.minuteStep ? `/${r.minuteStep}` : '')
  const hour = r.hour + (r.hourStep ? `/${r.hourStep}` : '')
  const dayOfMonth = r.lastDayOfMonth ? 'L' : r.dayOfMonth + (r.dayOfMonthStep ? `/${r.dayOfMonthStep}` : '')
  const month = r.month + (r.monthStep ? `/${r.monthStep}` : '')
  return `${minute} ${hour} ${dayOfMonth} ${month} ${r.dayOfWeek}`
}

/** The earliest slot strictly after `after`, across rules. */
export const nextRunAfter = (rules: Scheduling[], after: Date): Date => {
  let next: Date | null = null
  for (const rule of rules) {
    const candidate = new Cron(toCron(rule), { timezone: (rule as any).timeZone || 'Europe/Paris' }).nextRun(after)
    if (!candidate) throw new Error(`no next slot for the schedule ${JSON.stringify(rule)}`)
    if (!next || candidate < next) next = candidate
  }
  if (!next) throw new Error('a task needs at least one schedule rule')
  return next
}

/**
 * The smallest gap, in seconds, between consecutive slots of the merged rules over the next `samples` slots.
 * Checked against the deployment's minimum interval: a forgotten every-hour task is a cost, and two rules ten
 * minutes apart are the same mistake in another form.
 */
export const minGapSeconds = (rules: Scheduling[], from: Date, samples = 50): number => {
  let at = from
  let previous: Date | undefined
  let min = Infinity
  for (let i = 0; i < samples; i++) {
    const next = nextRunAfter(rules, at)
    if (previous) min = Math.min(min, (next.getTime() - previous.getTime()) / 1000)
    previous = next
    at = next
  }
  return min
}

const pad = (n: unknown) => String(n).padStart(2, '0')

const DAYS = {
  en: { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' },
  fr: { 0: 'dimanche', 1: 'lundi', 2: 'mardi', 3: 'mercredi', 4: 'jeudi', 5: 'vendredi', 6: 'samedi' }
} as Record<'en' | 'fr', Record<number, string>>

const describeRule = (rule: Scheduling, locale: 'en' | 'fr'): string => {
  const r = rule as any
  const time = `${pad(r.hour)}:${pad(r.minute)}`
  const zone = `(${r.timeZone || 'Europe/Paris'})`
  if (locale === 'fr') {
    switch (r.type) {
      case 'hours': return `toutes les ${r.hourStep} heures à la minute ${pad(r.minute)} ${zone}`
      case 'daily': return `tous les jours à ${time} ${zone}`
      case 'weekly': return `tous les ${DAYS.fr[Number(r.dayOfWeek)]}s à ${time} ${zone}`
      default: return r.lastDayOfMonth ? `le dernier jour du mois à ${time} ${zone}` : `le ${r.dayOfMonth} de chaque mois à ${time} ${zone}`
    }
  }
  switch (r.type) {
    case 'hours': return `every ${r.hourStep} hours at minute ${pad(r.minute)} ${zone}`
    case 'daily': return `every day at ${time} ${zone}`
    case 'weekly': return `every ${DAYS.en[Number(r.dayOfWeek)]} at ${time} ${zone}`
    default: return r.lastDayOfMonth ? `on the last day of each month at ${time} ${zone}` : `on day ${r.dayOfMonth} of each month at ${time} ${zone}`
  }
}

/** One phrase per rule, joined: read by the agent about its own schedule and by the UI. */
export const describeScheduling = (rules: Scheduling[], locale: 'en' | 'fr'): string =>
  rules.map(rule => describeRule(rule, locale)).join('; ')

export type TaskEventKind = 'failed' | 'needs-attention' | 'paused'

/** An event as pushed to the events service, which stamps the date itself. */
export type TaskEvent = Omit<Event, 'date'> & { topic: { key: string } }

const EVENT_TITLES: Record<TaskEventKind, (title: string) => string> = {
  failed: title => `The planned task "${title}" failed.`,
  'needs-attention': title => `The planned task "${title}" needs attention.`,
  paused: title => `The planned task "${title}" was paused.`
}

/**
 * The notification one task run pushes, by kind. Keyed per task (processings' `<service>:<kind>:<id>`
 * shape), so an admin can subscribe to one task or, by prefix, to all of them. The body is what the reader
 * needs to act on it: the run's error, the agent's own summary, the pause reason.
 */
export const taskEvent = (
  kind: TaskEventKind,
  task: Pick<AutonomousAgentTask, 'id' | 'title' | 'owner' | 'pausedReason'>,
  run: Pick<ConversationRun, 'error' | 'outcome' | 'parts'>
): TaskEvent => {
  const body = kind === 'needs-attention'
    ? run.outcome?.summary
    : kind === 'paused'
      ? task.pausedReason
      : run.error ?? (partsText((run.parts ?? []) as MessagePart[]).trim() || undefined)
  return {
    title: EVENT_TITLES[kind](task.title),
    topic: { key: `agents:task-${kind}:${task.id}` },
    sender: task.owner,
    visibility: 'private',
    resource: { type: 'autonomous-agent-task', id: task.id, title: task.title },
    originator: { internalProcess: { id: 'agents-scheduler', name: 'Agents scheduler' } },
    ...(body ? { body } : {})
  }
}

/**
 * Whether a task's latest runs, newest first and skipped ones left out, are `max` failures in a row. An
 * aborted run is an admin's act, not a failure: it breaks the streak as a success does.
 */
export const failedInARow = (statuses: string[], max: number): boolean =>
  statuses.length >= max && statuses.slice(0, max).every(status => status === 'error' || status === 'interrupted')

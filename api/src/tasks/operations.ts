/**
 * operations.ts contains pure stateless functions
 *
 * A planned task's schedule: data-fair processings' rule array (monthly / weekly / daily / every N hours,
 * each with its time zone), converted to cron and computed with croner exactly as processings does
 * (processings/shared/runs.ts), so an admin who schedules a processing schedules a task the same way.
 */
import { Cron } from 'croner'
import type { AutonomousAgentTask } from '#types/autonomous-agent-task/index.ts'

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

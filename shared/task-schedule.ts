/**
 * A planned task's schedule described in words. In shared/ because the browser renders it too (the approval
 * card) as well as the agent reading about its own schedule.
 *
 * Reads only the keys of each rule's own type, as `toCron` (api/src/tasks/operations.ts) does: the schema
 * closes each type to its keys, so the words are the schedule that runs.
 */

/** The fields the description reads: structural, so shared/ does not import the api's types. */
export interface ScheduleRule {
  type: string
  hour?: number
  minute?: number
  hourStep?: number
  dayOfWeek?: string | number
  dayOfMonth?: number
  lastDayOfMonth?: boolean
  timeZone?: string
}

/** The zone of a rule that names none, and of "today" in an agent's system prompt outside a task run. */
export const DEFAULT_TIME_ZONE = 'Europe/Paris'

const pad = (n: unknown) => String(n).padStart(2, '0')

const DAYS = {
  en: { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' },
  fr: { 0: 'dimanche', 1: 'lundi', 2: 'mardi', 3: 'mercredi', 4: 'jeudi', 5: 'vendredi', 6: 'samedi' }
} as Record<'en' | 'fr', Record<number, string>>

const describeRule = (rule: ScheduleRule, locale: 'en' | 'fr'): string => {
  const r = rule as any
  const time = `${pad(r.hour)}:${pad(r.minute)}`
  const zone = `(${r.timeZone || DEFAULT_TIME_ZONE})`
  if (locale === 'fr') {
    switch (r.type) {
      case 'hours': return `${(r.hourStep ?? 1) === 1 ? 'toutes les heures' : `toutes les ${r.hourStep} heures`} à HH:${pad(r.minute)} ${zone}`
      case 'daily': return `tous les jours à ${time} ${zone}`
      case 'weekly': return `tous les ${DAYS.fr[Number(r.dayOfWeek)]}s à ${time} ${zone}`
      default: return r.lastDayOfMonth ? `le dernier jour du mois à ${time} ${zone}` : `le ${r.dayOfMonth} de chaque mois à ${time} ${zone}`
    }
  }
  switch (r.type) {
    case 'hours': return `${(r.hourStep ?? 1) === 1 ? 'every hour' : `every ${r.hourStep} hours`} at HH:${pad(r.minute)} ${zone}`
    case 'daily': return `every day at ${time} ${zone}`
    case 'weekly': return `every ${DAYS.en[Number(r.dayOfWeek)]} at ${time} ${zone}`
    default: return r.lastDayOfMonth ? `on the last day of each month at ${time} ${zone}` : `on day ${r.dayOfMonth} of each month at ${time} ${zone}`
  }
}

/** One phrase per rule, joined: read by the agent about its own schedule and by the UI. */
export const describeScheduling = (rules: ScheduleRule[], locale: 'en' | 'fr'): string =>
  rules.map(rule => describeRule(rule, locale)).join('; ')

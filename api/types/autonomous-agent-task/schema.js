const hour = { type: 'integer', minimum: 0, maximum: 23, default: 0, title: 'Hour', 'x-i18n-title': { en: 'Hour', fr: 'Heure' } }
const minute = { type: 'integer', minimum: 0, maximum: 59, default: 0, title: 'Minute', 'x-i18n-title': { en: 'Minute', fr: 'Minute' } }
const timeZone = { type: 'string', default: 'Europe/Paris', title: 'Time zone', 'x-i18n-title': { en: 'Time zone', fr: 'Fuseau horaire' } }

const actor = {
  type: 'object',
  additionalProperties: false,
  required: ['userId', 'at'],
  properties: {
    userId: { type: 'string' },
    userName: { type: 'string' },
    at: { type: 'string', format: 'date-time' },
    conversationId: { type: 'string' }
  }
}

/**
 * The scheduling rules of data-fair processings (processings/api/types/scheduling), so that an admin who
 * schedules a processing schedules a task the same way. Only the time zone picker's layout differs.
 */
export default {
  $id: 'https://github.com/data-fair/agents/autonomous-agent-task',
  'x-exports': ['types'],
  title: 'Autonomous agent task',
  'x-i18n-title': { en: 'Autonomous agent task', fr: 'Tâche d\'agent autonome' },
  type: 'object',
  additionalProperties: false,
  required: ['id', 'agentId', 'owner', 'title', 'prompt', 'scheduling', 'enabled', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt'],
  $defs: { hour, minute, timeZone },
  properties: {
    id: { type: 'string', readOnly: true },
    agentId: { type: 'string', readOnly: true },
    owner: {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'id'],
      readOnly: true,
      properties: {
        type: { type: 'string', enum: ['organization'] },
        id: { type: 'string' },
        name: { type: 'string' },
        department: { type: 'string' }
      }
    },
    title: { type: 'string', maxLength: 200, title: 'Title', 'x-i18n-title': { en: 'Title', fr: 'Titre' } },
    prompt: {
      type: 'string',
      maxLength: 20000,
      layout: 'textarea',
      title: 'Instruction',
      'x-i18n-title': { en: 'Instruction', fr: 'Consigne' },
      description: 'What the agent is asked to do at each run.',
      'x-i18n-description': { en: 'What the agent is asked to do at each run.', fr: "Ce qu'il est demandé à l'agent de faire à chaque exécution." }
    },
    scheduling: {
      type: 'array',
      minItems: 0,
      maxItems: 10,
      title: 'Scheduling',
      'x-i18n-title': { en: 'Scheduling', fr: 'Planification' },
      items: {
        type: 'object',
        required: ['type', 'month', 'dayOfWeek', 'dayOfMonth', 'hour', 'minute'],
        oneOfLayout: { emptyData: true },
        // Each variant is closed: a rule carries only the keys of its type, so `toCron` (what runs) and
        // `describeScheduling` (what the approval card and the agent read) cannot disagree. Open, a daily
        // rule with an `hourStep` validated, ran every 2 hours and was described as once a day.
        oneOf: [{
          title: 'Monthly',
          additionalProperties: false,
          'x-i18n-title': { en: 'Monthly', fr: 'Mensuel' },
          properties: {
            type: { const: 'monthly' },
            month: { const: '*' },
            dayOfWeek: { const: '*' },
            dayOfMonth: { type: 'integer', minimum: 1, maximum: 28, default: 1 },
            lastDayOfMonth: { type: 'boolean', default: false },
            hour: { $ref: '#/$defs/hour' },
            minute: { $ref: '#/$defs/minute' },
            timeZone: { $ref: '#/$defs/timeZone' }
          }
        }, {
          title: 'Weekly',
          additionalProperties: false,
          'x-i18n-title': { en: 'Weekly', fr: 'Hebdomadaire' },
          properties: {
            type: { const: 'weekly' },
            month: { const: '*' },
            dayOfMonth: { const: '*' },
            dayOfWeek: {
              type: 'string',
              default: '1',
              oneOf: ['1', '2', '3', '4', '5', '6', '0'].map(d => ({ const: d, title: d }))
            },
            hour: { $ref: '#/$defs/hour' },
            minute: { $ref: '#/$defs/minute' },
            timeZone: { $ref: '#/$defs/timeZone' }
          }
        }, {
          title: 'Daily',
          additionalProperties: false,
          'x-i18n-title': { en: 'Daily', fr: 'Quotidien' },
          properties: {
            type: { const: 'daily' },
            month: { const: '*' },
            dayOfMonth: { const: '*' },
            dayOfWeek: { const: '*' },
            hour: { $ref: '#/$defs/hour' },
            minute: { $ref: '#/$defs/minute' },
            timeZone: { $ref: '#/$defs/timeZone' }
          }
        }, {
          title: 'Every N hours',
          additionalProperties: false,
          'x-i18n-title': { en: 'Every N hours', fr: 'Toutes les N heures' },
          properties: {
            type: { const: 'hours' },
            month: { const: '*' },
            dayOfMonth: { const: '*' },
            dayOfWeek: { const: '*' },
            hour: { const: '*' },
            hourStep: { type: 'integer', minimum: 1, maximum: 12, default: 1 },
            minute: { $ref: '#/$defs/minute' },
            timeZone: { $ref: '#/$defs/timeZone' }
          }
        }]
      }
    },
    enabled: { type: 'boolean', default: true, title: 'Enabled', 'x-i18n-title': { en: 'Enabled', fr: 'Activée' } },
    pausedReason: { type: 'string', readOnly: true },
    // When an admin last resumed the task from a pause: the failure streak that pauses it counts only
    // runs started after this, so a resumed task is not re-paused by the failures that paused it.
    resumedAt: { type: 'string', format: 'date-time', readOnly: true },
    nextRunAt: { type: 'string', format: 'date-time', readOnly: true },
    // Webhook triggers (docs/architecture/planned-tasks.md): the secret of the trigger URL, never in a read but
    // the key route's; triggers waiting for the next run, rendered at reception; how many the bounds dropped;
    // the compare-and-swap counter of the two.
    webhookKey: { type: 'string', readOnly: true },
    pendingTriggers: {
      type: 'array',
      readOnly: true,
      items: { type: 'object', additionalProperties: false, required: ['receivedAt', 'payload'], properties: { receivedAt: { type: 'string', format: 'date-time' }, payload: { type: 'string' } } }
    },
    droppedTriggers: { type: 'integer', readOnly: true },
    triggerSeq: { type: 'integer', readOnly: true },
    createdBy: actor,
    updatedBy: actor,
    createdAt: { type: 'string', format: 'date-time', readOnly: true },
    updatedAt: { type: 'string', format: 'date-time', readOnly: true }
  }
}

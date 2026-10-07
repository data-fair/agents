import TaskSchema from '#types/autonomous-agent-task/schema.js'

/** @param {'title' | 'prompt' | 'scheduling' | 'enabled'} key */
const pick = (key) => JSON.parse(JSON.stringify(TaskSchema.properties[key]))

export default {
  $id: 'https://github.com/data-fair/agents/autonomous-agent-task/write-req',
  title: 'Planned task',
  'x-i18n-title': { en: 'Planned task', fr: 'Tâche planifiée' },
  'x-exports': ['validate', 'types'],
  type: 'object',
  additionalProperties: false,
  required: ['title', 'prompt', 'scheduling'],
  $defs: JSON.parse(JSON.stringify(TaskSchema.$defs)),
  properties: {
    title: pick('title'),
    prompt: pick('prompt'),
    scheduling: pick('scheduling'),
    enabled: pick('enabled')
  }
}

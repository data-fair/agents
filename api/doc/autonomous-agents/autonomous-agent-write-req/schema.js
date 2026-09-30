import AutonomousAgentSchema from '#types/autonomous-agent/schema.js'

/** @param {'title' | 'persona' | 'instructions' | 'mcpServers' | 'nhi' | 'instructors' | 'enabled'} key */
const pick = (key) => JSON.parse(JSON.stringify(AutonomousAgentSchema.properties[key]))

export default {
  $id: 'https://github.com/data-fair/agents/autonomous-agent/write-req',
  title: 'Autonomous agent',
  'x-i18n-title': { en: 'Autonomous agent', fr: 'Agent autonome' },
  'x-exports': ['validate', 'types', 'vjsf'],
  'x-vjsf': { xI18n: true, pluginsImports: ['@koumoul/vjsf-markdown'] },
  'x-vjsf-locales': ['en', 'fr'],
  type: 'object',
  additionalProperties: false,
  required: ['title', 'persona', 'mcpServers', 'enabled'],
  layout: { title: null },
  properties: {
    title: pick('title'),
    persona: pick('persona'),
    instructions: pick('instructions'),
    mcpServers: pick('mcpServers'),
    nhi: pick('nhi'),
    instructors: pick('instructors'),
    enabled: pick('enabled')
  }
}

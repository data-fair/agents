import AutonomousAgentSchema from '#types/autonomous-agent/schema.js'

/** @param {'title' | 'persona' | 'instructions' | 'mcpServers' | 'nhi' | 'instructors' | 'role' | 'approvalLevel' | 'memory' | 'web' | 'externalMcpServers' | 'enabled'} key */
const pick = (key) => JSON.parse(JSON.stringify(AutonomousAgentSchema.properties[key]))

export default {
  $id: 'https://github.com/data-fair/agents/autonomous-agent/write-req',
  title: 'Autonomous agent',
  'x-i18n-title': { en: 'Autonomous agent', fr: 'Agent autonome' },
  // the form is rendered per tab from slices of the agent schema (see ../autonomous-agent-form-part.js),
  // this one validates the whole body
  'x-exports': ['validate', 'types'],
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
    role: pick('role'),
    approvalLevel: pick('approvalLevel'),
    memory: pick('memory'),
    web: pick('web'),
    externalMcpServers: pick('externalMcpServers'),
    enabled: pick('enabled')
  }
}

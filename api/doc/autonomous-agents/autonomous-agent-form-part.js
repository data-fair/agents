import AutonomousAgentSchema from '#types/autonomous-agent/schema.js'

/**
 * The autonomous agent page shows its configuration in tabs, one vjsf form per tab. Each tab schema is
 * a slice of the autonomous agent schema, as ../settings/org-form-part.js does for the org config, so
 * the tabs cannot drift from it. The page composes the slices back into the whole write body (with the
 * fields no tab shows, nhi and enabled) before saving; the write-req schema validates that body.
 *
 * @param {string} name
 * @param {('title' | 'persona' | 'instructions' | 'mcpServers' | 'externalMcpServers' | 'web' | 'approvalLevel' | 'instructors' | 'role' | 'memory')[]} keys
 */
export const autonomousAgentFormPart = (name, keys) => {
  /** @type {Record<string, any>} */
  const properties = {}
  for (const key of keys) properties[key] = JSON.parse(JSON.stringify(AutonomousAgentSchema.properties[key]))
  return {
    $id: `https://github.com/data-fair/agents/autonomous-agent/form-${name}`,
    'x-exports': ['vjsf'],
    'x-vjsf': { xI18n: true, pluginsImports: ['@koumoul/vjsf-markdown'] },
    'x-vjsf-locales': ['en', 'fr'],
    type: 'object',
    additionalProperties: false,
    required: AutonomousAgentSchema.required.filter(key => /** @type {string[]} */(keys).includes(key)),
    layout: { title: null },
    properties
  }
}

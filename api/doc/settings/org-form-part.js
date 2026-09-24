import OrgPutReq from './org-put-req/schema.js'

/**
 * The org config page shows its form in tabs, one vjsf form per tab. Each tab
 * schema is a slice of the org PUT body schema (the single source of truth,
 * still used to validate the whole body server side), so they cannot drift.
 * The page composes the slices back into the full body before saving.
 *
 * @param {string} name
 * @param {('modelMapping' | 'quotas' | 'moderation' | 'storeTraces')[]} keys
 */
export const orgFormPart = (name, keys) => {
  /** @type {Record<string, any>} */
  const properties = {}
  for (const key of keys) {
    properties[key] = JSON.parse(JSON.stringify(OrgPutReq.properties[key]))
    // the tab already titles the section (a plain field keeps its title: it
    // is its label)
    // is its label). An untitled section would render its description as a
    // stray tooltip, so the page shows that text above the tab's form instead.
    if (properties[key].type === 'object') {
      properties[key].layout = { ...properties[key].layout, title: null }
      delete properties[key].description
      delete properties[key]['x-i18n-description']
    }
  }
  return {
    $id: `https://github.com/data-fair/agents/settings/org-form-${name}`,
    'x-exports': ['vjsf'],
    'x-vjsf': { xI18n: true },
    'x-vjsf-locales': ['en', 'fr'],
    type: 'object',
    additionalProperties: false,
    layout: { title: null },
    definitions: JSON.parse(JSON.stringify(OrgPutReq.definitions)),
    properties
  }
}

import SettingsSchema from '#types/settings/schema.js'

/**
 * The subset of the settings document an ORG admin may edit (as opposed to the
 * superadmin-only providers / models catalog). Created ahead of the endpoint
 * that will consume it, so wiring the router is all that is left.
 */
/** @param {'modelMapping' | 'quotas' | 'moderation' | 'storeTraces'} key */
const pick = (key) => {
  const picked = JSON.parse(JSON.stringify(SettingsSchema.properties[key]))
  // These sections are hidden in the superadmin form until the account has at
  // least one org provider. An org admin can legitimately have zero org
  // providers and still use the global catalog, so the guard must not apply
  // here — the sections would never show up.
  delete picked.layout?.if
  return picked
}

export default {
  $id: 'https://github.com/data-fair/agents/settings/org-put-req',
  title: 'Org settings',
  'x-i18n-title': { en: 'Org settings', fr: "Paramètres d'organisation" },
  'x-exports': ['validate', 'types', 'vjsf'],
  'x-vjsf': { xI18n: true },
  'x-vjsf-locales': ['en', 'fr'],
  type: 'object',
  additionalProperties: false,
  // the picked `quotas` copy keeps its local $ref to RoleQuota
  definitions: { RoleQuota: JSON.parse(JSON.stringify(SettingsSchema.definitions.RoleQuota)) },
  properties: {
    modelMapping: pick('modelMapping'),
    quotas: pick('quotas'),
    moderation: pick('moderation'),
    storeTraces: pick('storeTraces')
  }
}

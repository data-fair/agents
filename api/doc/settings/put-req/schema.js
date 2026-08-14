import SettingsSchema from '#types/settings/schema.js'

/** @param {'providers' | 'models'} key */
const pick = (key) => JSON.parse(JSON.stringify(SettingsSchema.properties[key]))

export default {
  $id: 'https://github.com/data-fair/agents/settings/put-req',
  title: 'Settings',
  'x-i18n-title': { en: 'Settings', fr: 'Paramètres' },
  'x-exports': ['validate', 'types', 'vjsf'],
  'x-vjsf': { xI18n: true, pluginsImports: ['@koumoul/vjsf-markdown'] },
  'x-vjsf-locales': ['en', 'fr'],
  type: 'object',
  additionalProperties: false,
  layout: { title: null },
  // the picked `models` copy keeps its per-role $ref to the shared Model definition
  definitions: { Model: JSON.parse(JSON.stringify(SettingsSchema.definitions.Model)) },
  properties: {
    providers: pick('providers'),
    models: pick('models')
  }
}

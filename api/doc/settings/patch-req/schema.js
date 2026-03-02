import jsonSchema from '@data-fair/lib-utils/json-schema.js'
import SettingsSchema from '#types/settings/schema.js'

const body = jsonSchema(SettingsSchema)
  .removeReadonlyProperties()
  .pickProperties(['globalPrompt', 'providers'])
  .removeId()
  .appendTitle(' patch')
  .schema

export default {
  $id: 'https://github.com/data-fair/agents/settings/patch-req',
  title: 'Patch settings req',
  'x-exports': ['validate', 'types', 'resolvedSchemaJson', 'vjsf'],
  type: 'object',
  required: ['body', 'query'],
  properties: {
    body,
    query: {
      type: 'object',
      additionalProperties: false,
      properties: {}
    }
  },
  'x-vjsf': { xI18n: true },
  'x-vjsf-locales': ['en', 'fr', 'it', 'de', 'pt', 'es']
}

import jsonSchema from '@data-fair/lib-utils/json-schema.js'
import SettingsSchema from '#types/settings/schema.js'

const body = jsonSchema(SettingsSchema)
  .removeReadonlyProperties()
  .removeId()
  .appendTitle(' put')
  .schema

export default {
  ...body,
  $id: 'https://github.com/data-fair/agents/settings/put-req',
  'x-exports': ['validate', 'types', 'vjsf'],
  'x-vjsf': { xI18n: true },
  'x-vjsf-locales': ['en', 'fr']
}

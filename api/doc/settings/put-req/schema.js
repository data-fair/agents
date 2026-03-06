import jsonSchema from '@data-fair/lib-utils/json-schema.js'
import SettingsSchema from '#types/settings/schema.js'

const schema = jsonSchema(SettingsSchema).makePutSchema().schema

export default {
  ...schema,
  'x-exports': ['validate', 'types', 'vjsf'],
  'x-vjsf': {
    xI18n: true,
    pluginsImports: ['@koumoul/vjsf-markdown']
  },
  'x-vjsf-locales': ['en', 'fr']
}

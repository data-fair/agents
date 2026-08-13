import jsonSchema from '@data-fair/lib-utils/json-schema.js'
import LimitsSchema from '#types/limits/schema.js'

export default {
  $id: 'https://github.com/data-fair/agents/limits/post-req',
  title: 'Post limits req',
  'x-exports': ['validate', 'types'],
  type: 'object',
  required: ['body'],
  properties: {
    body: jsonSchema(LimitsSchema)
      .removeFromRequired(['id', 'type'])
      .removeId()
      .appendTitle(' post')
      .schema
  }
}

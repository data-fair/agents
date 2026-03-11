export default {
  $id: 'https://github.com/data-fair/agents/evaluator',
  title: 'Evaluator',
  type: 'object',
  oneOf: [
    { required: ['tasks'] },
    { required: ['traceId', 'idealResult'] }
  ],
  properties: {
    tasks: {
      type: 'array',
      title: 'Evaluation Tasks',
      items: {
        type: 'object',
        required: ['initialPrompt', 'idealResult'],
        properties: {
          initialPrompt: {
            type: 'string',
            title: 'Initial Prompt'
          },
          idealResult: {
            type: 'string',
            title: 'Ideal Result',
            description: 'Expected final outcome'
          },
          userDescription: {
            type: 'string',
            title: 'User Description',
            description: 'Description of user to simulate (e.g., "intentionally vague customer who wants to buy shoes")'
          },
          maxTurns: {
            type: 'number',
            title: 'Max Turns',
            default: 5,
            maximum: 10,
            description: 'Maximum conversation turns (capped at 10)'
          }
        }
      }
    },
    traceId: {
      type: 'string',
      title: 'Trace ID'
    },
    idealResult: {
      type: 'string',
      title: 'Ideal Result'
    }
  }
}

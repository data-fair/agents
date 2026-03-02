export default {
  $id: 'https://github.com/data-fair/agents/settings',
  'x-exports': ['types'],
  title: 'Settings',
  type: 'object',
  additionalProperties: false,
  required: ['owner', 'providers'],
  properties: {
    _id: {
      type: 'string'
    },
    createdAt: {
      type: 'string',
      format: 'date-time'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time'
    },
    owner: {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'id'],
      properties: {
        type: {
          type: 'string',
          enum: ['user', 'organization']
        },
        id: {
          type: 'string'
        },
        name: {
          type: 'string'
        },
        department: {
          type: 'string'
        }
      }
    },
    globalPrompt: {
      type: 'string',
      title: 'Global Prompt',
      description: 'This prompt will be injected into all AI agents for this account'
    },
    providers: {
      type: 'array',
      title: 'AI Providers',
      items: {
        type: 'object',
        title: 'Provider',
        additionalProperties: false,
        required: ['type'],
        properties: {
          id: { type: 'string', title: 'Provider ID' },
          type: {
            type: 'string',
            title: 'Provider Type',
            enum: ['openai', 'anthropic', 'google', 'mistral', 'openrouter', 'ollama', 'custom']
          },
          name: { type: 'string', title: 'Display Name' },
          enabled: { type: 'boolean', title: 'Enabled', default: true },
          openai: {
            type: 'object',
            title: 'OpenAI Configuration',
            properties: {
              apiKey: { type: 'string', title: 'API Key' },
              organization: { type: 'string', title: 'Organization ID' },
              project: { type: 'string', title: 'Project ID' },
              defaultModel: { type: 'string', title: 'Default Model' }
            }
          },
          anthropic: {
            type: 'object',
            title: 'Anthropic Configuration',
            properties: {
              apiKey: { type: 'string', title: 'API Key' },
              defaultModel: { type: 'string', title: 'Default Model' }
            }
          },
          google: {
            type: 'object',
            title: 'Google AI Configuration',
            properties: {
              apiKey: { type: 'string', title: 'API Key' },
              project: { type: 'string', title: 'Project ID' },
              location: { type: 'string', title: 'Location', default: 'us-central1' },
              defaultModel: { type: 'string', title: 'Default Model' }
            }
          },
          mistral: {
            type: 'object',
            title: 'Mistral AI Configuration',
            properties: {
              apiKey: { type: 'string', title: 'API Key' },
              defaultModel: { type: 'string', title: 'Default Model' }
            }
          },
          openrouter: {
            type: 'object',
            title: 'OpenRouter Configuration',
            properties: {
              apiKey: { type: 'string', title: 'API Key' },
              defaultModel: { type: 'string', title: 'Default Model' }
            }
          },
          ollama: {
            type: 'object',
            title: 'Ollama Configuration',
            properties: {
              baseURL: { type: 'string', title: 'Base URL', default: 'http://localhost:11434' },
              defaultModel: { type: 'string', title: 'Default Model' }
            }
          },
          custom: {
            type: 'object',
            title: 'Custom Provider',
            properties: {
              name: { type: 'string', title: 'Provider Name' },
              baseURL: { type: 'string', title: 'Base URL' },
              apiKey: { type: 'string', title: 'API Key' },
              defaultModel: { type: 'string', title: 'Default Model' }
            },
            required: ['name', 'baseURL']
          }
        }
      }
    }
  }
}

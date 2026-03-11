export default {
  $id: 'https://github.com/data-fair/agents/settings',
  'x-exports': ['types'],
  title: 'Settings',
  'x-i18n-title': {
    en: 'Settings',
    fr: 'Paramètres'
  },
  layout: {
    title: null
  },
  definitions: {
    Model: { $ref: 'https://github.com/data-fair/agents/model' }
  },
  type: 'object',
  additionalProperties: false,
  required: ['owner', 'providers', 'agents'],
  properties: {
    createdAt: {
      type: 'string',
      format: 'date-time',
      readOnly: true,
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      readOnly: true,
    },
    owner: {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'id'],
      readOnly: true,
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
    providers: {
      type: 'array',
      title: 'AI Providers',
      'x-i18n-title': {
        en: 'AI Providers',
        fr: 'Fournisseurs IA'
      },
      layout: {
        // eslint-disable-next-line no-template-curly-in-string
        itemTitle: 'item ? `${item.name || ""} - ${item.id.slice(0, 8)}` : ""',
        listActions: ['add', 'edit', 'delete']
      },
      items: {
        type: 'object',
        title: 'Provider',
        'x-i18n-title': {
          en: 'Provider',
          fr: 'Fournisseur'
        },
        unevaluatedProperties: false,
        oneOfLayout: { emptyData: true },
        discriminator: { propertyName: 'type' },
        layout: {
          getDefaultData: '{ id: crypto.randomUUID() }',
          switch: [{ if: 'summary', children: [] }],
        },
        oneOf: [{
          required: ['type', 'name', 'id', 'enabled'],
          title: 'Open AI',
          properties: {
            type: {
              type: 'string',
              title: 'Provider Type',
              const: 'openai'
            },
            id: {
              type: 'string',
              title: 'Provider ID',
              'x-i18n-title': {
                en: 'Provider ID',
                fr: 'ID du fournisseur'
              },
              readOnly: true
            },
            name: {
              type: 'string',
              title: 'Display Name',
              'x-i18n-title': {
                en: 'Display Name',
                fr: "Nom d'affichage"
              },
              layout: {
                getDefaultData: '"Open AI"',
              },
            },
            enabled: {
              type: 'boolean',
              title: 'Enabled',
              'x-i18n-title': {
                en: 'Enabled',
                fr: 'Activé'
              },
              default: true
            },
            apiKey: {
              type: 'string',
              title: 'API Key',
              'x-i18n-title': {
                en: 'API Key',
                fr: 'Clé API'
              }
            }
          }
        }, {
          required: ['type', 'name', 'id', 'enabled'],
          title: 'Anthropic',
          properties: {
            type: {
              type: 'string',
              title: 'Provider Type',
              const: 'anthropic'
            },
            id: {
              type: 'string',
              title: 'Provider ID',
              'x-i18n-title': {
                en: 'Provider ID',
                fr: 'ID du fournisseur'
              },
              readOnly: true
            },
            name: {
              type: 'string',
              title: 'Display Name',
              'x-i18n-title': {
                en: 'Display Name',
                fr: "Nom d'affichage"
              },
              layout: {
                getDefaultData: '"Anthropic"',
              },
            },
            enabled: {
              type: 'boolean',
              title: 'Enabled',
              'x-i18n-title': {
                en: 'Enabled',
                fr: 'Activé'
              },
              default: true
            },
            apiKey: {
              type: 'string',
              title: 'API Key',
              'x-i18n-title': {
                en: 'API Key',
                fr: 'Clé API'
              }
            }
          }
        }, {
          required: ['type', 'name', 'id', 'enabled'],
          title: 'Google',
          properties: {
            type: {
              type: 'string',
              title: 'Provider Type',
              const: 'google'
            },
            id: {
              type: 'string',
              title: 'Provider ID',
              'x-i18n-title': {
                en: 'Provider ID',
                fr: 'ID du fournisseur'
              },
              readOnly: true
            },
            name: {
              type: 'string',
              title: 'Display Name',
              'x-i18n-title': {
                en: 'Display Name',
                fr: "Nom d'affichage"
              },
              layout: {
                getDefaultData: '"Google"',
              },
            },
            enabled: {
              type: 'boolean',
              title: 'Enabled',
              'x-i18n-title': {
                en: 'Enabled',
                fr: 'Activé'
              },
              default: true
            },
            apiKey: {
              type: 'string',
              title: 'API Key',
              'x-i18n-title': {
                en: 'API Key',
                fr: 'Clé API'
              }
            }
          }
        }, {
          required: ['type', 'name', 'id', 'enabled'],
          title: 'Mistral',
          properties: {
            type: {
              type: 'string',
              title: 'Provider Type',
              const: 'mistral'
            },
            id: {
              type: 'string',
              title: 'Provider ID',
              'x-i18n-title': {
                en: 'Provider ID',
                fr: 'ID du fournisseur'
              },
              readOnly: true
            },
            name: {
              type: 'string',
              title: 'Display Name',
              'x-i18n-title': {
                en: 'Display Name',
                fr: "Nom d'affichage"
              },
              layout: {
                getDefaultData: '"Mistral"',
              },
            },
            enabled: {
              type: 'boolean',
              title: 'Enabled',
              'x-i18n-title': {
                en: 'Enabled',
                fr: 'Activé'
              },
              default: true
            },
            apiKey: {
              type: 'string',
              title: 'API Key',
              'x-i18n-title': {
                en: 'API Key',
                fr: 'Clé API'
              }
            }
          }
        }, {
          required: ['type', 'name', 'id', 'enabled'],
          title: 'OpenRouter',
          properties: {
            type: {
              type: 'string',
              title: 'Provider Type',
              const: 'openrouter'
            },
            id: {
              type: 'string',
              title: 'Provider ID',
              'x-i18n-title': {
                en: 'Provider ID',
                fr: 'ID du fournisseur'
              },
              readOnly: true
            },
            name: {
              type: 'string',
              title: 'Display Name',
              'x-i18n-title': {
                en: 'Display Name',
                fr: "Nom d'affichage"
              },
              layout: {
                getDefaultData: '"OpenRouter"',
              },
            },
            enabled: {
              type: 'boolean',
              title: 'Enabled',
              'x-i18n-title': {
                en: 'Enabled',
                fr: 'Activé'
              },
              default: true
            },
            apiKey: {
              type: 'string',
              title: 'API Key',
              'x-i18n-title': {
                en: 'API Key',
                fr: 'Clé API'
              }
            }
          }
        }, {
          required: ['type', 'name', 'id', 'enabled', 'baseURL'],
          title: 'Ollama',
          properties: {
            type: {
              type: 'string',
              title: 'Provider Type',
              const: 'ollama'
            },
            id: {
              type: 'string',
              title: 'Provider ID',
              'x-i18n-title': {
                en: 'Provider ID',
                fr: 'ID du fournisseur'
              },
              readOnly: true
            },
            name: {
              type: 'string',
              title: 'Display Name',
              'x-i18n-title': {
                en: 'Display Name',
                fr: "Nom d'affichage"
              },
              layout: {
                getDefaultData: '"Ollama"',
              },
            },
            enabled: {
              type: 'boolean',
              title: 'Enabled',
              'x-i18n-title': {
                en: 'Enabled',
                fr: 'Activé'
              },
              default: true
            },
            apiKey: {
              type: 'string',
              title: 'API Key',
              'x-i18n-title': {
                en: 'API Key',
                fr: 'Clé API'
              }
            },
            baseURL: {
              type: 'string',
              title: 'Base URL',
              'x-i18n-title': {
                en: 'Base URL',
                fr: 'URL de base'
              },
              default: 'http://localhost:11434'
            }
          }
        }, {
          required: ['type', 'name', 'id', 'enabled'],
          title: 'Mock',
          description: 'To a message "hello" respond "world", to a message "call tool ARG1 ARG2" respond with a tool call, to anything else respond "what do you mean ?"',
          properties: {
            type: {
              type: 'string',
              title: 'Provider Type',
              const: 'mock'
            },
            id: {
              type: 'string',
              title: 'Provider ID',
              'x-i18n-title': {
                en: 'Provider ID',
                fr: 'ID du fournisseur'
              },
              readOnly: true
            },
            name: {
              type: 'string',
              title: 'Display Name',
              'x-i18n-title': {
                en: 'Display Name',
                fr: "Nom d'affichage"
              },
              layout: {
                getDefaultData: '"Mock"',
              },
            },
            enabled: {
              type: 'boolean',
              title: 'Enabled',
              'x-i18n-title': {
                en: 'Enabled',
                fr: 'Activé'
              },
              default: true
            }
          }
        }]
      }
    },
    agents: {
      type: 'object',
      title: 'Agents',
      properties: {
        backOfficeAssistant: {
          type: 'object',
          required: ['model'],
          properties: {
            name: {
              type: 'string',
              title: 'Name',
              default: 'Data Fair Assistant',
              'x-i18n-default': {
                fr: 'Assistant Data Fair',
                en: 'Data Fair Assistance'
              }
            },
            prompt: {
              type: 'string',
              title: 'Main prompt',
              layout: 'markdown',
              description: 'In this prompt you can instruct your assistant to behave in certain ways.'
            },
            model: { $ref: '#/definitions/Model' },
            datasetsExplorer: {
              type: 'object',
              title: 'Datasets Explorer',
              description: 'Optional sub-agent for exploring datasets. If not configured, uses the main model.',
              properties: {
                model: {
                  $ref: '#/definitions/Model',
                  title: 'Model',
                  description: 'Model to use for datasets exploration. Uses main model if not set.'
                }
              }
            }
          }
        },
        evaluator: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: 'Name',
              default: 'Evaluator',
              'x-i18n-default': {
                fr: 'Évaluateur',
                en: 'Evaluator'
              }
            },
            prompt: {
              type: 'string',
              title: 'Evaluation prompt',
              layout: 'markdown',
              description: 'System prompt for the evaluator to grade responses and analyze traces.'
            },
            model: { $ref: '#/definitions/Model' },
            defaultToBackOfficeModel: {
              type: 'boolean',
              default: true,
              title: 'Use back-office-assistant model',
              description: 'Use the same model as back-office-assistant by default.'
            }
          }
        }
      }
    }
  }
}

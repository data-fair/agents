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
  type: 'object',
  additionalProperties: false,
  required: ['owner', 'providers'],
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
        itemTitle: '`${item.name || ""} - ${item.id}`',
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
        }],

        /*
        properties: {
          id: {
            type: 'string',
            title: 'Provider ID',
            'x-i18n-title': {
              en: 'Provider ID',
              fr: 'ID du fournisseur'
            },
            getDefaultData: '{ uuid: crypto.randomUUID() }'
          },
          type: {
            type: 'string',
            title: 'Provider Type',
            'x-i18n-title': {
              en: 'Provider Type',
              fr: 'Type de fournisseur'
            },
            enum: ['openai', 'anthropic', 'google', 'mistral', 'openrouter', 'ollama', 'custom']
          },
          name: {
            type: 'string',
            title: 'Display Name',
            'x-i18n-title': {
              en: 'Display Name',
              fr: "Nom d'affichage"
            }
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
          openai: {
            type: 'object',
            title: 'OpenAI Configuration',
            'x-i18n-title': {
              en: 'OpenAI Configuration',
              fr: 'Configuration OpenAI'
            },
            properties: {

              defaultModel: {
                type: 'string',
                title: 'Default Model',
                'x-i18n-title': {
                  en: 'Default Model',
                  fr: 'Modèle par défaut'
                }
              }
            }
          },
          anthropic: {
            type: 'object',
            title: 'Anthropic Configuration',
            'x-i18n-title': {
              en: 'Anthropic Configuration',
              fr: 'Configuration Anthropic'
            },
            properties: {
              apiKey: {
                type: 'string',
                title: 'API Key',
                'x-i18n-title': {
                  en: 'API Key',
                  fr: 'Clé API'
                }
              },
              defaultModel: {
                type: 'string',
                title: 'Default Model',
                'x-i18n-title': {
                  en: 'Default Model',
                  fr: 'Modèle par défaut'
                }
              }
            }
          },
          google: {
            type: 'object',
            title: 'Google AI Configuration',
            'x-i18n-title': {
              en: 'Google AI Configuration',
              fr: 'Configuration Google AI'
            },
            properties: {
              apiKey: {
                type: 'string',
                title: 'API Key',
                'x-i18n-title': {
                  en: 'API Key',
                  fr: 'Clé API'
                }
              },
              project: {
                type: 'string',
                title: 'Project ID',
                'x-i18n-title': {
                  en: 'Project ID',
                  fr: 'ID du projet'
                }
              },
              location: {
                type: 'string',
                title: 'Location',
                'x-i18n-title': {
                  en: 'Location',
                  fr: 'Emplacement'
                },
                default: 'us-central1'
              },
              defaultModel: {
                type: 'string',
                title: 'Default Model',
                'x-i18n-title': {
                  en: 'Default Model',
                  fr: 'Modèle par défaut'
                }
              }
            }
          },
          mistral: {
            type: 'object',
            title: 'Mistral AI Configuration',
            'x-i18n-title': {
              en: 'Mistral AI Configuration',
              fr: 'Configuration Mistral AI'
            },
            properties: {
              apiKey: {
                type: 'string',
                title: 'API Key',
                'x-i18n-title': {
                  en: 'API Key',
                  fr: 'Clé API'
                }
              },
              defaultModel: {
                type: 'string',
                title: 'Default Model',
                'x-i18n-title': {
                  en: 'Default Model',
                  fr: 'Modèle par défaut'
                }
              }
            }
          },
          openrouter: {
            type: 'object',
            title: 'OpenRouter Configuration',
            'x-i18n-title': {
              en: 'OpenRouter Configuration',
              fr: 'Configuration OpenRouter'
            },
            properties: {
              apiKey: {
                type: 'string',
                title: 'API Key',
                'x-i18n-title': {
                  en: 'API Key',
                  fr: 'Clé API'
                }
              },
              defaultModel: {
                type: 'string',
                title: 'Default Model',
                'x-i18n-title': {
                  en: 'Default Model',
                  fr: 'Modèle par défaut'
                }
              }
            }
          },
          ollama: {
            type: 'object',
            title: 'Ollama Configuration',
            'x-i18n-title': {
              en: 'Ollama Configuration',
              fr: 'Configuration Ollama'
            },
            properties: {
              baseURL: {
                type: 'string',
                title: 'Base URL',
                'x-i18n-title': {
                  en: 'Base URL',
                  fr: 'URL de base'
                },
                default: 'http://localhost:11434'
              },
              defaultModel: {
                type: 'string',
                title: 'Default Model',
                'x-i18n-title': {
                  en: 'Default Model',
                  fr: 'Modèle par défaut'
                }
              }
            }
          }
        }
          */
      }

    }
  }
}

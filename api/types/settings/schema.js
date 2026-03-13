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
    Model: {
      type: 'object',
      required: ['id', 'name', 'provider'],
      layout: {
        comp: 'autocomplete',
        getItems: {
          expr: 'context.models',
          // eslint-disable-next-line no-template-curly-in-string
          itemTitle: '`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`'
        },
      },
      properties: {
        id: { type: 'string', title: 'Model ID' },
        name: { type: 'string', title: 'Name' },
        provider: {
          type: 'object',
          required: ['type', 'name', 'id'],
          properties: {
            type: { type: 'string', title: 'Provider Type' },
            name: { type: 'string', title: 'Provider Name' },
            id: { type: 'string', title: 'Provider ID' }
          }
        }
      }
    }
  },
  type: 'object',
  additionalProperties: false,
  required: ['owner', 'providers', 'models', 'limits'],
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
    models: {
      type: 'object',
      title: 'Models',
      'x-i18n-title': {
        en: 'Models',
        fr: 'Modèles'
      },
      required: ['assistant'],
      properties: {
        assistant: {
          type: 'object',
          title: 'Assistant',
          description: 'Main conversational model. Suggested models: claude-3-5-haiku, gpt-4o-mini, gemini-2.0-flash, mistral-small-latest, minimax-01.',
          'x-i18n-title': {
            en: 'Assistant',
            fr: 'Assistant'
          },
          'x-i18n-description': {
            en: 'Main conversational model. Suggested models: claude-3-5-haiku, gpt-4o-mini, gemini-2.0-flash, mistral-small-latest, minimax-01.',
            fr: 'Modèle conversationnel principal. Modèles suggérés : claude-3-5-haiku, gpt-4o-mini, gemini-2.0-flash, mistral-small-latest, minimax-01.'
          },
          required: [],
          properties: {
            model: {
              $ref: '#/definitions/Model',
              title: 'Model',
              'x-i18n-title': {
                en: 'Model',
                fr: 'Modèle'
              }
            },
            roles: {
              type: 'array',
              title: 'Roles',
              'x-i18n-title': {
                en: 'Allowed Roles',
                fr: 'Rôles autorisés'
              },
              description: 'Roles allowed to use this model through the gateway (empty = admin only)',
              'x-i18n-description': {
                en: 'Roles allowed to use this model through the gateway (empty = admin only)',
                fr: 'Rôles autorisés à utiliser ce modèle via la passerelle (vide = admin uniquement)'
              },
              items: { type: 'string' },
              default: []
            },
            ratio: {
              type: 'number',
              title: 'Usage Ratio',
              'x-i18n-title': {
                en: 'Usage Ratio',
                fr: "Ratio d'utilisation"
              },
              description: 'Multiplier applied to token usage for quota accounting (e.g. 1.0 = full cost, 0.5 = half cost)',
              'x-i18n-description': {
                en: 'Multiplier applied to token usage for quota accounting (e.g. 1.0 = full cost, 0.5 = half cost)',
                fr: "Multiplicateur appliqué à l'utilisation des tokens pour le calcul des quotas (ex : 1.0 = coût plein, 0.5 = demi-coût)"
              },
              default: 1,
              minimum: 0
            }
          }
        },
        summarizer: {
          type: 'object',
          title: 'Summarizer',
          description: 'Model used for chat history summarization (optional, defaults to assistant). Suggested models: claude-3-5-haiku, gpt-4o-mini, gemini-2.0-flash-lite, mistral-small-latest.',
          'x-i18n-title': {
            en: 'Summarizer',
            fr: 'Résumeur'
          },
          'x-i18n-description': {
            en: 'Model used for chat history summarization (optional, defaults to assistant). Suggested models: claude-3-5-haiku, gpt-4o-mini, gemini-2.0-flash-lite, mistral-small-latest.',
            fr: "Modèle utilisé pour la synthèse de l'historique (optionnel, par défaut l'assistant). Modèles suggérés : claude-3-5-haiku, gpt-4o-mini, gemini-2.0-flash-lite, mistral-small-latest."
          },
          properties: {
            model: {
              $ref: '#/definitions/Model',
              title: 'Model',
              'x-i18n-title': {
                en: 'Model',
                fr: 'Modèle'
              }
            },
            roles: {
              type: 'array',
              title: 'Roles',
              'x-i18n-title': {
                en: 'Allowed Roles',
                fr: 'Rôles autorisés'
              },
              description: 'Roles allowed to use this model through the gateway (empty = admin only)',
              'x-i18n-description': {
                en: 'Roles allowed to use this model through the gateway (empty = admin only)',
                fr: 'Rôles autorisés à utiliser ce modèle via la passerelle (vide = admin uniquement)'
              },
              items: { type: 'string' },
              default: []
            },
            ratio: {
              type: 'number',
              title: 'Usage Ratio',
              'x-i18n-title': {
                en: 'Usage Ratio',
                fr: "Ratio d'utilisation"
              },
              description: 'Multiplier applied to token usage for quota accounting (e.g. 0.5 for cheaper summarization)',
              'x-i18n-description': {
                en: 'Multiplier applied to token usage for quota accounting (e.g. 0.5 for cheaper summarization)',
                fr: "Multiplicateur appliqué à l'utilisation des tokens pour le calcul des quotas (ex : 0.5 pour une synthèse moins coûteuse)"
              },
              default: 0.5,
              minimum: 0
            }
          }
        },
        evaluator: {
          type: 'object',
          title: 'Evaluator',
          description: 'Model used for evaluation tasks (optional, defaults to assistant). Suggested models: claude-3-5-haiku, gpt-4o-mini, gemini-2.0-flash, mistral-small-latest.',
          'x-i18n-title': {
            en: 'Evaluator',
            fr: 'Évaluateur'
          },
          'x-i18n-description': {
            en: 'Model used for evaluation tasks (optional, defaults to assistant). Suggested models: claude-3-5-haiku, gpt-4o-mini, gemini-2.0-flash, mistral-small-latest.',
            fr: "Modèle utilisé pour les tâches d'évaluation (optionnel, par défaut l'assistant). Modèles suggérés : claude-3-5-haiku, gpt-4o-mini, gemini-2.0-flash, mistral-small-latest."
          },
          properties: {
            model: {
              $ref: '#/definitions/Model',
              title: 'Model',
              'x-i18n-title': {
                en: 'Model',
                fr: 'Modèle'
              }
            },
            roles: {
              type: 'array',
              title: 'Roles',
              'x-i18n-title': {
                en: 'Allowed Roles',
                fr: 'Rôles autorisés'
              },
              description: 'Roles allowed to use this model through the gateway (empty = admin only)',
              'x-i18n-description': {
                en: 'Roles allowed to use this model through the gateway (empty = admin only)',
                fr: 'Rôles autorisés à utiliser ce modèle via la passerelle (vide = admin uniquement)'
              },
              items: { type: 'string' },
              default: []
            },
            ratio: {
              type: 'number',
              title: 'Usage Ratio',
              'x-i18n-title': {
                en: 'Usage Ratio',
                fr: "Ratio d'utilisation"
              },
              description: 'Multiplier applied to token usage for quota accounting',
              'x-i18n-description': {
                en: 'Multiplier applied to token usage for quota accounting',
                fr: "Multiplicateur appliqué à l'utilisation des tokens pour le calcul des quotas"
              },
              default: 1,
              minimum: 0
            }
          }
        }
      }
    },
    limits: {
      type: 'object',
      title: 'Usage Limits',
      'x-i18n-title': {
        en: 'Usage Limits',
        fr: "Limites d'utilisation"
      },
      required: ['dailyTokenLimit', 'monthlyTokenLimit'],
      default: {
        dailyTokenLimit: 100000,
        monthlyTokenLimit: 1000000
      },
      properties: {
        dailyTokenLimit: {
          type: 'integer',
          title: 'Daily Token Limit',
          'x-i18n-title': {
            en: 'Daily Token Limit',
            fr: 'Limite de tokens journalière'
          },
          description: 'Maximum number of tokens allowed per day (0 for unlimited)',
          'x-i18n-description': {
            en: 'Maximum number of tokens allowed per day (0 for unlimited)',
            fr: 'Nombre maximum de tokens autorisés par jour (0 pour illimité)'
          },
          default: 100000,
          minimum: 0
        },
        monthlyTokenLimit: {
          type: 'integer',
          title: 'Monthly Token Limit',
          'x-i18n-title': {
            en: 'Monthly Token Limit',
            fr: 'Limite de tokens mensuelle'
          },
          description: 'Maximum number of tokens allowed per month (0 for unlimited)',
          'x-i18n-description': {
            en: 'Maximum number of tokens allowed per month (0 for unlimited)',
            fr: 'Nombre maximum de tokens autorisés par mois (0 pour illimité)'
          },
          default: 1000000,
          minimum: 0
        }
      }
    },
    userLimits: {
      type: 'object',
      title: 'Per-User Usage Limits',
      'x-i18n-title': {
        en: 'Per-User Usage Limits',
        fr: "Limites d'utilisation par utilisateur"
      },
      required: ['dailyTokenLimit', 'monthlyTokenLimit'],
      default: {
        dailyTokenLimit: 100000,
        monthlyTokenLimit: 1000000
      },
      properties: {
        dailyTokenLimit: {
          type: 'integer',
          title: 'Daily Token Limit',
          'x-i18n-title': {
            en: 'Daily Token Limit',
            fr: 'Limite de tokens journalière'
          },
          description: 'Maximum number of tokens allowed per day (0 for unlimited)',
          'x-i18n-description': {
            en: 'Maximum number of tokens allowed per day (0 for unlimited)',
            fr: 'Nombre maximum de tokens autorisés par jour (0 pour illimité)'
          },
          default: 100000,
          minimum: 0
        },
        monthlyTokenLimit: {
          type: 'integer',
          title: 'Monthly Token Limit',
          'x-i18n-title': {
            en: 'Monthly Token Limit',
            fr: 'Limite de tokens mensuelle'
          },
          description: 'Maximum number of tokens allowed per month (0 for unlimited)',
          'x-i18n-description': {
            en: 'Maximum number of tokens allowed per month (0 for unlimited)',
            fr: 'Nombre maximum de tokens autorisés par mois (0 pour illimité)'
          },
          default: 1000000,
          minimum: 0
        }
      }
    }
  }
}

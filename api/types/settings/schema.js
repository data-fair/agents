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
    RoleQuota: {
      type: 'object',
      layout: 'card',
      required: ['unlimited', 'monthlyLimit'],
      properties: {
        unlimited: {
          type: 'boolean',
          title: 'Unlimited',
          'x-i18n-title': {
            en: 'Unlimited',
            fr: 'Illimité'
          },
          default: false
        },
        monthlyLimit: {
          layout: { if: '!parent.data.unlimited' },
          type: 'number',
          title: 'Monthly Limit',
          'x-i18n-title': {
            en: 'Monthly Limit',
            fr: 'Limite mensuelle'
          },
          description: 'Weekly limit = monthly / 2, daily limit = monthly / 4',
          'x-i18n-description': {
            en: 'Weekly limit = monthly / 2, daily limit = monthly / 4',
            fr: 'Limite hebdomadaire = mensuelle / 2, limite journalière = mensuelle / 4'
          },
          default: 0,
          minimum: 0
        }
      }
    },
    Model: {
      type: 'object',
      required: ['id', 'name', 'provider'],
      layout: {
        comp: 'autocomplete',
        getItems: {
          // expr: 'context.models',
          // eslint-disable-next-line no-template-curly-in-string
          url: '${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${parent.parent.parent.data.providers.map(p => p.id).join(",")}',
          itemsResults: 'data.results',
          // eslint-disable-next-line no-template-curly-in-string
          itemTitle: '`${item.name} (${item.provider.name} - ${item.provider.id.slice(0, 8)})`',
          itemKey: 'item.id'
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
  required: ['owner', 'providers', 'models', 'quotas'],
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
      layout: {
        title: null,
        if: 'parent.data.providers?.length'
      },
      default: {},
      properties: {
        assistant: {
          type: 'object',
          title: 'Assistant',
          description: `
The primary conversational interface. Balanced for reasoning, instruction-following, and human-like interaction. This model manages the high-level flow and delegates complex tasks to subagents.
          
Recommendations: GPT-5.4, Claude 4.5 Sonnet, Llama 4 Maverick, Mistral Large 3, etc.`,
          'x-i18n-title': {
            en: 'Assistant',
            fr: 'Assistant'
          },
          'x-i18n-description': {
            en: 'The primary conversational interface. Balanced for reasoning, instruction-following, and human-like interaction. This model manages the high-level flow and delegates complex tasks to subagents.\n\nRecommendations: GPT-5.4, Claude 4.5 Sonnet, Llama 4 Maverick, Mistral Large 3, etc.',
            fr: 'L\'interface conversationnelle principale. Équilibré pour le raisonnement, le suivi d\'instructions et l\'interaction naturelle. Ce modèle gère le flux de haut niveau et délègue les tâches complexes aux sous-agents.\n\nRecommandations : GPT-5.4, Claude 4.5 Sonnet, Llama 4 Maverick, Mistral Large 3, etc.'
          },
          layout: {
            comp: 'card',
            children: [{ key: 'model' }, { key: 'inputPricePerMillion', cols: 6 }, { key: 'outputPricePerMillion', cols: 6 }],
            cols: 6
          },
          properties: {
            model: {
              $ref: '#/definitions/Model',
              title: 'Model',
              'x-i18n-title': {
                en: 'Model',
                fr: 'Modèle'
              },
            },
            inputPricePerMillion: {
              type: 'number',
              title: 'Input price (per 1M tokens)',
              'x-i18n-title': {
                en: 'Input price (per 1M tokens)',
                fr: "Prix d'entrée (par million de tokens)"
              },
              default: 0,
              minimum: 0
            },
            outputPricePerMillion: {
              type: 'number',
              title: 'Output price (per 1M tokens)',
              'x-i18n-title': {
                en: 'Output price (per 1M tokens)',
                fr: 'Prix de sortie (par million de tokens)'
              },
              default: 0,
              minimum: 0
            }
          }
        },
        tools: {
          type: 'object',
          title: 'Tools',
          description: `
The "technician." Specialized in structured data and API interaction. It excels at chaining multiple tool calls without conversational filler, ensuring high reliability in automated workflows.

Recommendations: GPT-5.4 Mini, Mistral DevStral, Claude 4.5 Sonnet (Computer Use), MiMo-V2-Flash, etc.`,
          'x-i18n-title': {
            en: 'Tools',
            fr: 'Outils'
          },
          'x-i18n-description': {
            en: 'The "technician." Specialized in structured data and API interaction. It excels at chaining multiple tool calls without conversational filler, ensuring high reliability in automated workflows.\n\nRecommendations: GPT-5.4 Mini, Mistral DevStral, Claude 4.5 Sonnet (Computer Use), MiMo-V2-Flash, etc.',
            fr: "Le « technicien ». Spécialisé dans les données structurées et l'interaction avec les API. Il excelle à enchaîner plusieurs appels d'outils sans remplissage conversationnel, garantissant une haute fiabilité dans les workflows automatisés.\n\nRecommandations : GPT-5.4 Mini, Mistral DevStral, Claude 4.5 Sonnet (Computer Use), MiMo-V2-Flash, etc."
          },
          layout: {
            comp: 'card',
            children: [{ key: 'model' }, { key: 'inputPricePerMillion', cols: 6 }, { key: 'outputPricePerMillion', cols: 6 }],
            cols: 6
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
            inputPricePerMillion: {
              type: 'number',
              title: 'Input price (per 1M tokens)',
              'x-i18n-title': {
                en: 'Input price (per 1M tokens)',
                fr: "Prix d'entrée (par million de tokens)"
              },
              default: 0,
              minimum: 0
            },
            outputPricePerMillion: {
              type: 'number',
              title: 'Output price (per 1M tokens)',
              'x-i18n-title': {
                en: 'Output price (per 1M tokens)',
                fr: 'Prix de sortie (par million de tokens)'
              },
              default: 0,
              minimum: 0
            }
          }
        },
        summarizer: {
          type: 'object',
          title: 'Summarizer',
          description: `
A "shorthand" specialist. Optimized for quickly distilling key points from small-to-medium text blocks. It focuses on high information density and brevity to keep context windows lean and costs low.
          
Recommendations: GPT-5.4 Mini, Claude 4.5 Haiku, Mistral Small 4, Llama 4 (8B), etc.`,
          'x-i18n-title': {
            en: 'Summarizer',
            fr: 'Résumeur'
          },
          'x-i18n-description': {
            en: 'A "shorthand" specialist. Optimized for quickly distilling key points from small-to-medium text blocks. It focuses on high information density and brevity to keep context windows lean and costs low.\n\nRecommendations: GPT-5.4 Mini, Claude 4.5 Haiku, Mistral Small 4, Llama 4 (8B), etc.',
            fr: "Un spécialiste de la « synthèse ». Optimisé pour extraire rapidement les points clés de blocs de texte petits à moyens. Il privilégie la densité d'information et la concision pour garder les fenêtres de contexte légères et les coûts bas.\n\nRecommandations : GPT-5.4 Mini, Claude 4.5 Haiku, Mistral Small 4, Llama 4 (8B), etc."
          },
          layout: {
            comp: 'card',
            children: [{ key: 'model' }, { key: 'inputPricePerMillion', cols: 6 }, { key: 'outputPricePerMillion', cols: 6 }],
            cols: 6
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
            inputPricePerMillion: {
              type: 'number',
              title: 'Input price (per 1M tokens)',
              'x-i18n-title': {
                en: 'Input price (per 1M tokens)',
                fr: "Prix d'entrée (par million de tokens)"
              },
              default: 0,
              minimum: 0
            },
            outputPricePerMillion: {
              type: 'number',
              title: 'Output price (per 1M tokens)',
              'x-i18n-title': {
                en: 'Output price (per 1M tokens)',
                fr: 'Prix de sortie (par million de tokens)'
              },
              default: 0,
              minimum: 0
            }
          }
        },
        evaluator: {
          type: 'object',
          title: 'Evaluator',
          description: `
The "quality controller." Analyzes the assistant's logic and tool outputs for accuracy and safety. It requires the highest reasoning capabilities to act as a reliable ground truth for system performance.

Recommendations: Claude Opus 4.6, GPT-5.4 (Reasoning), DeepSeek-R1, Pharia-1-LLM, etc.`,
          'x-i18n-title': {
            en: 'Evaluator',
            fr: 'Évaluateur'
          },
          'x-i18n-description': {
            en: 'The "quality controller." Analyzes the assistant\'s logic and tool outputs for accuracy and safety. It requires the highest reasoning capabilities to act as a reliable ground truth for system performance.\n\nRecommendations: Claude Opus 4.6, GPT-5.4 (Reasoning), DeepSeek-R1, Pharia-1-LLM, etc.',
            fr: "Le « contrôleur qualité ». Analyse la logique de l'assistant et les sorties des outils pour vérifier la précision et la sécurité. Il nécessite les capacités de raisonnement les plus élevées pour servir de référence fiable pour les performances du système.\n\nRecommandations : Claude Opus 4.6, GPT-5.4 (Reasoning), DeepSeek-R1, Pharia-1-LLM, etc."
          },
          layout: {
            comp: 'card',
            children: [{ key: 'model' }, { key: 'inputPricePerMillion', cols: 6 }, { key: 'outputPricePerMillion', cols: 6 }],
            cols: 6
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
            inputPricePerMillion: {
              type: 'number',
              title: 'Input price (per 1M tokens)',
              'x-i18n-title': {
                en: 'Input price (per 1M tokens)',
                fr: "Prix d'entrée (par million de tokens)"
              },
              default: 0,
              minimum: 0
            },
            outputPricePerMillion: {
              type: 'number',
              title: 'Output price (per 1M tokens)',
              'x-i18n-title': {
                en: 'Output price (per 1M tokens)',
                fr: 'Prix de sortie (par million de tokens)'
              },
              default: 0,
              minimum: 0
            }
          }
        }
      }
    },
    quotas: {
      type: 'object',
      title: 'Role Quotas',
      'x-i18n-title': {
        en: 'Role Quotas',
        fr: 'Quotas par rôle'
      },
      layout: {
        title: null,
        if: 'parent.data.providers?.length',
        children: [
          { key: 'global', cols: { sm: 6, md: 4 } },
          { key: 'admin', cols: { sm: 6, md: 4 } },
          { key: 'contrib', cols: { sm: 6, md: 4 }, if: 'context.accountType === "organization"' },
          { key: 'user', cols: { sm: 6, md: 4 }, if: 'context.accountType === "organization"' },
          { key: 'external', cols: { sm: 6, md: 4 } },
          { key: 'anonymous', cols: { sm: 6, md: 4 } }
        ]
      },
      required: ['global', 'admin', 'contrib', 'user', 'external', 'anonymous'],
      default: {
        global: { unlimited: false, monthlyLimit: 10 },
        admin: { unlimited: true, monthlyLimit: 0 },
        contrib: { unlimited: false, monthlyLimit: 0 },
        user: { unlimited: false, monthlyLimit: 0 },
        external: { unlimited: false, monthlyLimit: 0 },
        anonymous: { unlimited: false, monthlyLimit: 0 }
      },
      properties: {
        global: {
          $ref: '#/definitions/RoleQuota',
          title: 'Global quotas',
          'x-i18n-title': {
            en: 'Global quotas',
            fr: 'Quotas globaux'
          },
          default: { unlimited: false, monthlyLimit: 10 }
        },
        admin: {
          $ref: '#/definitions/RoleQuota',
          title: 'Admin quotas',
          'x-i18n-title': { en: 'Admin quotas', fr: 'Quotas administrateur' },
          default: { unlimited: true, monthlyLimit: 0 }
        },
        contrib: {
          $ref: '#/definitions/RoleQuota',
          title: 'Contributor quotas',
          'x-i18n-title': { en: 'Contributor quotas', fr: 'Quotas contributeur' },
          default: { unlimited: false, monthlyLimit: 0 }
        },
        user: {
          $ref: '#/definitions/RoleQuota',
          title: 'Simple user Quotas',
          'x-i18n-title': { en: 'Simple user Quotas', fr: 'Quotas utilisateur simple' },
          default: { unlimited: false, monthlyLimit: 0 }
        },
        external: {
          $ref: '#/definitions/RoleQuota',
          title: 'External user quotas',
          'x-i18n-title': { en: 'External user quotas', fr: 'Quotas utilisateur externe' },
          default: { unlimited: false, monthlyLimit: 0 }
        },
        anonymous: {
          $ref: '#/definitions/RoleQuota',
          title: 'Anonymous user quotas',
          'x-i18n-title': { en: 'Anonymous user quotas', fr: 'Quotas utilisateur anonyme' },
          default: { unlimited: false, monthlyLimit: 0 }
        }
      }
    }
  }
}

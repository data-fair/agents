// The roles a model can be bound to. Each org may pick, per role, any model of
// its catalog (global models + its own `models` entries); an unmapped role falls
// back to the global default, then along the role's fallback chain.
const MODEL_ROLES = ['assistant', 'tools', 'summarizer', 'evaluator', 'moderator']

/** @type {Record<string, { en: string, fr: string }>} */
const MODEL_ROLE_TITLES = {
  assistant: { en: 'Assistant', fr: 'Assistant' },
  tools: { en: 'Tools', fr: 'Outils' },
  summarizer: { en: 'Summarizer', fr: 'Résumeur' },
  evaluator: { en: 'Evaluator', fr: 'Évaluateur' },
  moderator: { en: 'Moderator', fr: 'Modérateur' }
}

/** @type {Record<string, { en: string, fr: string }>} */
const MODEL_ROLE_DESCRIPTIONS = {
  assistant: {
    en: 'The primary conversational interface. Balanced for reasoning, instruction-following, and human-like interaction. This model manages the high-level flow and delegates complex tasks to subagents.',
    fr: "L'interface conversationnelle principale. Équilibré pour le raisonnement, le suivi d'instructions et l'interaction naturelle. Ce modèle gère le flux de haut niveau et délègue les tâches complexes aux sous-agents."
  },
  tools: {
    en: 'The "technician." Specialized in structured data and API interaction. It excels at chaining multiple tool calls without conversational filler, ensuring high reliability in automated workflows.',
    fr: "Le « technicien ». Spécialisé dans les données structurées et l'interaction avec les API. Il excelle à enchaîner plusieurs appels d'outils sans remplissage conversationnel, garantissant une haute fiabilité dans les workflows automatisés."
  },
  summarizer: {
    en: 'A "shorthand" specialist. Optimized for quickly distilling key points from small-to-medium text blocks. It focuses on high information density and brevity to keep context windows lean and costs low.',
    fr: "Un spécialiste de la « synthèse ». Optimisé pour extraire rapidement les points clés de blocs de texte petits à moyens. Il privilégie la densité d'information et la concision pour garder les fenêtres de contexte légères et les coûts bas."
  },
  evaluator: {
    en: 'The "quality controller." Analyzes the assistant\'s logic and tool outputs for accuracy and safety. It requires the highest reasoning capabilities to act as a reliable ground truth for system performance.',
    fr: "Le « contrôleur qualité ». Analyse la logique de l'assistant et les sorties des outils pour vérifier la précision et la sécurité. Il nécessite les capacités de raisonnement les plus élevées pour servir de référence fiable pour les performances du système."
  },
  moderator: {
    en: 'The "gatekeeper." Classifies each new user message for profanity, prompt-injection, persona override, and out-of-scope requests. Should be fast and cheap — it sits on the critical path to the first response token. Dedicated moderation classifiers (Llama Guard, moderation APIs) are not compatible: they use fixed taxonomies and output formats that cannot express this platform\'s custom policy.',
    fr: 'Le « gardien ». Classe chaque nouveau message utilisateur (grossièretés, injection de prompt, usurpation de persona, demandes hors périmètre). Doit être rapide et peu coûteux — il se trouve sur le chemin critique vers le premier token de réponse. Les classifieurs de modération dédiés (Llama Guard, API de modération) ne sont pas compatibles : leurs taxonomies et formats de sortie fixes ne peuvent pas exprimer la politique spécifique de cette plateforme.'
  }
}

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
          // rootData is the whole settings document, so this expression is
          // independent of how deeply the Model definition is nested (it now
          // lives inside the `models` array items).
          // eslint-disable-next-line no-template-curly-in-string
          url: '${context.apiPath}/models/${context.accountType}/${context.accountId}?provider=${(rootData.providers || []).map(p => p.id).join(",")}',
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
    storeTraces: {
      type: 'boolean',
      title: 'Store conversation traces',
      'x-i18n-title': {
        en: 'Store conversation traces',
        fr: 'Enregistrer les traces de conversation'
      },
      description: 'When enabled, conversations of consenting users are stored on the server for 30 days for admin review. Each user must explicitly accept.',
      'x-i18n-description': {
        en: 'When enabled, conversations of consenting users are stored on the server for 30 days for admin review. Each user must explicitly accept.',
        fr: 'Si activé, les conversations des utilisateurs consentants sont enregistrées sur le serveur pendant 30 jours pour relecture par un administrateur. Chaque utilisateur doit explicitement accepter.'
      },
      default: false
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
          required: ['type', 'name', 'id', 'enabled', 'apiKey'],
          title: 'Scaleway',
          description: 'For an API key scoped to a specific Scaleway Project, set the Project ID so requests target that project. Leave it empty to use the organization default project.',
          'x-i18n-description': {
            en: 'For an API key scoped to a specific Scaleway Project, set the Project ID so requests target that project. Leave it empty to use the organization default project.',
            fr: "Pour une clé API liée à un Projet Scaleway spécifique, renseignez l'ID du projet afin que les requêtes ciblent ce projet. Laissez vide pour utiliser le projet par défaut de l'organisation."
          },
          properties: {
            type: {
              type: 'string',
              title: 'Provider Type',
              const: 'scaleway'
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
                getDefaultData: '"Scaleway"',
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
            projectId: {
              type: 'string',
              title: 'Project ID',
              'x-i18n-title': {
                en: 'Project ID',
                fr: 'ID du projet'
              },
              description: 'Optional. The Scaleway Project ID (UUID) the API key is scoped to. Required when the key only has access to a specific project, otherwise model listing and inference return 403.',
              'x-i18n-description': {
                en: 'Optional. The Scaleway Project ID (UUID) the API key is scoped to. Required when the key only has access to a specific project, otherwise model listing and inference return 403.',
                fr: "Optionnel. L'ID du Projet Scaleway (UUID) auquel la clé API est liée. Requis lorsque la clé n'a accès qu'à un projet spécifique, sinon le listing des modèles et l'inférence renvoient une erreur 403."
              }
            }
          }
        }, {
          required: ['type', 'name', 'id', 'enabled', 'baseURL'],
          title: 'OpenAI Compatible',
          'x-i18n-title': {
            en: 'OpenAI Compatible',
            fr: 'Compatible OpenAI'
          },
          description: 'Generic provider for any OpenAI-compatible endpoint (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). API Key is optional for unauthenticated local servers.',
          'x-i18n-description': {
            en: 'Generic provider for any OpenAI-compatible endpoint (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). API Key is optional for unauthenticated local servers.',
            fr: 'Fournisseur générique pour tout endpoint compatible OpenAI (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). La clé API est optionnelle pour les serveurs locaux sans authentification.'
          },
          properties: {
            type: {
              type: 'string',
              title: 'Provider Type',
              const: 'openai-compatible'
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
                getDefaultData: '"OpenAI Compatible"',
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
            baseURL: {
              type: 'string',
              title: 'Base URL',
              'x-i18n-title': {
                en: 'Base URL',
                fr: 'URL de base'
              }
            },
            apiKey: {
              type: 'string',
              title: 'API Key',
              'x-i18n-title': {
                en: 'API Key',
                fr: 'Clé API'
              }
            },
            compatibility: {
              type: 'string',
              title: 'Compatibility Mode',
              'x-i18n-title': {
                en: 'Compatibility Mode',
                fr: 'Mode de compatibilité'
              },
              description: 'Use "compatible" for providers that do not support the new /v1/responses endpoint (e.g. LiteLLM, older OpenAI-compatible APIs). Leave empty for standard OpenAI behavior.',
              'x-i18n-description': {
                en: 'Utilisez "compatible" pour les fournisseurs qui ne supportent pas le nouveau endpoint /v1/responses (ex: LiteLLM, anciennes APIs compatibles OpenAI). Laissez vide pour le comportement OpenAI standard.',
                fr: 'Utilisez "compatible" pour les fournisseurs qui ne supportent pas le nouveau endpoint /v1/responses (ex: LiteLLM, anciennes APIs compatibles OpenAI). Laissez vide pour le comportement OpenAI standard.'
              },
              enum: ['default', 'compatible'],
              default: 'default'
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
      type: 'array',
      title: 'Models',
      'x-i18n-title': { en: 'Models', fr: 'Modèles' },
      default: [],
      layout: {
        if: 'parent.data.providers?.length',
        // eslint-disable-next-line no-template-curly-in-string
        itemTitle: 'item?.model ? `${item.model.name} (${item.usage?.join(", ")})` : ""',
        listActions: ['add', 'edit', 'delete']
      },
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['model', 'usage'],
        properties: {
          model: { $ref: '#/definitions/Model', title: 'Model', 'x-i18n-title': { en: 'Model', fr: 'Modèle' } },
          usage: {
            type: 'array',
            uniqueItems: true,
            minItems: 1,
            title: 'Appropriate usages',
            'x-i18n-title': { en: 'Appropriate usages', fr: 'Usages appropriés' },
            items: {
              type: 'string',
              oneOf: [
                { const: 'assistant', title: 'Assistant' },
                { const: 'tools', title: 'Tools', 'x-i18n-title': { en: 'Tools', fr: 'Outils' } },
                { const: 'summarizer', title: 'Summarizer', 'x-i18n-title': { en: 'Summarizer', fr: 'Résumeur' } },
                { const: 'evaluator', title: 'Evaluator', 'x-i18n-title': { en: 'Evaluator', fr: 'Évaluateur' } },
                { const: 'moderator', title: 'Moderator', 'x-i18n-title': { en: 'Moderator', fr: 'Modérateur' } }
              ]
            }
          },
          multiplier: {
            type: 'number',
            minimum: 0,
            default: 1,
            title: 'Credit multiplier',
            'x-i18n-title': { en: 'Credit multiplier', fr: 'Multiplicateur de crédits' },
            description: 'credits = (input tokens + output tokens × output weight) / 1M × multiplier',
            'x-i18n-description': { en: 'credits = (input tokens + output tokens × output weight) / 1M × multiplier', fr: 'crédits = (tokens d\'entrée + tokens de sortie × poids de sortie) / 1M × multiplicateur' }
          }
        }
      }
    },
    modelMapping: {
      type: 'object',
      additionalProperties: false,
      title: 'Model roles',
      'x-i18n-title': { en: 'Model roles', fr: 'Rôles de modèles' },
      layout: { if: 'parent.data.providers?.length' },
      properties: Object.fromEntries(MODEL_ROLES.map(role => [role, {
        type: 'object',
        additionalProperties: false,
        required: ['provider', 'id'],
        title: MODEL_ROLE_TITLES[role].en,
        'x-i18n-title': MODEL_ROLE_TITLES[role],
        description: MODEL_ROLE_DESCRIPTIONS[role].en,
        'x-i18n-description': MODEL_ROLE_DESCRIPTIONS[role],
        layout: {
          comp: 'autocomplete',
          cols: { md: 6 },
          getItems: {
            // eslint-disable-next-line no-template-curly-in-string
            url: '${context.apiPath}/catalog/${context.accountType}/${context.accountId}?usage=' + role,
            itemsResults: 'data.results',
            // itemKey/itemTitle are applied both to a catalog entry (whose
            // `provider` is an object) and to the STORED ref (whose `provider`
            // is the provider id string): vjsf matches the stored value against
            // the fetched items by key, and renders the value itself when no
            // item matches. They must therefore accept both shapes: a key that
            // only reads the object shape never matches a stored mapping
            // against the catalog, and the value then falls back to rendering
            // itself through a title expression that reads `provider.name` off
            // a string.
            // eslint-disable-next-line no-template-curly-in-string
            itemTitle: 'item.provider.name ? `${item.name} (${item.provider.name})` : item.name',
            itemKey: '(item.provider.id || item.provider) + ":" + item.id',
            // map the catalog entry onto the stored ref shape
            itemValue: '({ provider: item.provider.id, id: item.id, name: item.name })'
          }
        },
        properties: {
          provider: { type: 'string' },
          id: { type: 'string' },
          name: { type: 'string' }
        }
      }]))
    },
    moderation: {
      type: 'object',
      title: 'Input moderation',
      'x-i18n-title': { en: 'Input moderation', fr: 'Modération des entrées' },
      layout: { if: 'parent.data.providers?.length' },
      default: { enabled: false, categories: ['anonymous', 'external'] },
      required: ['enabled', 'categories'],
      additionalProperties: false,
      properties: {
        enabled: {
          type: 'boolean',
          title: 'Enable input moderation',
          'x-i18n-title': { en: 'Enable input moderation', fr: 'Activer la modération des entrées' },
          description: 'When enabled, the last user message of each request from a moderated category is classified before the model responds.',
          'x-i18n-description': {
            en: 'When enabled, the last user message of each request from a moderated category is classified before the model responds.',
            fr: 'Si activé, le dernier message utilisateur de chaque requête provenant d\'une catégorie modérée est classé avant la réponse du modèle.'
          },
          default: false
        },
        categories: {
          type: 'array',
          uniqueItems: true,
          default: ['anonymous', 'external'],
          title: 'Moderated user categories',
          'x-i18n-title': { en: 'Moderated user categories', fr: 'Catégories d\'utilisateurs modérées' },
          description: 'User categories whose requests are checked by the gate when moderation is enabled.',
          'x-i18n-description': {
            en: 'User categories whose requests are checked by the gate when moderation is enabled.',
            fr: 'Catégories d\'utilisateurs dont les requêtes sont vérifiées par le filtre lorsque la modération est activée.'
          },
          items: {
            type: 'string',
            oneOf: [
              { const: 'anonymous', title: 'Anonymous', 'x-i18n-title': { en: 'Anonymous', fr: 'Anonyme' } },
              { const: 'external', title: 'External', 'x-i18n-title': { en: 'External', fr: 'Externe' } },
              { const: 'user', title: 'User', 'x-i18n-title': { en: 'User', fr: 'Utilisateur' } },
              { const: 'contrib', title: 'Contributor', 'x-i18n-title': { en: 'Contributor', fr: 'Contributeur' } },
              { const: 'admin', title: 'Admin', 'x-i18n-title': { en: 'Admin', fr: 'Administrateur' } }
            ]
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
          { key: 'admin', cols: { sm: 6, md: 4 } },
          { key: 'contrib', cols: { sm: 6, md: 4 }, if: 'context.accountType === "organization"' },
          { key: 'user', cols: { sm: 6, md: 4 }, if: 'context.accountType === "organization"' },
          { key: 'external', cols: { sm: 6, md: 4 } },
          { key: 'anonymous', cols: { sm: 6, md: 4 } },
          { key: 'untrusted', cols: { sm: 6, md: 4 } }
        ]
      },
      required: ['admin', 'contrib', 'user', 'external', 'anonymous'],
      default: {
        admin: { unlimited: true, monthlyLimit: 0 },
        contrib: { unlimited: false, monthlyLimit: 0 },
        user: { unlimited: false, monthlyLimit: 0 },
        external: { unlimited: false, monthlyLimit: 0 },
        anonymous: { unlimited: false, monthlyLimit: 0 },
        untrusted: { unlimited: false, monthlyLimit: 0 }
      },
      properties: {
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
        },
        untrusted: {
          $ref: '#/definitions/RoleQuota',
          title: 'Anonymous + external pool',
          'x-i18n-title': { en: 'Anonymous + external pool', fr: 'Réserve anonyme + externe' },
          description: 'Aggregate cap shared by all anonymous and external usage combined, so untrusted traffic cannot consume the whole account budget. 0 = no pool cap.',
          'x-i18n-description': {
            en: 'Aggregate cap shared by all anonymous and external usage combined, so untrusted traffic cannot consume the whole account budget. 0 = no pool cap.',
            fr: "Plafond agrégé partagé par l'ensemble des usages anonymes et externes, afin que le trafic non fiable ne puisse pas consommer tout le budget du compte. 0 = pas de plafond de réserve."
          },
          default: { unlimited: false, monthlyLimit: 0 }
        }
      }
    }
  }
}

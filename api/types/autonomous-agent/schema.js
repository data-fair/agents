export default {
  $id: 'https://github.com/data-fair/agents/autonomous-agent',
  'x-exports': ['types'],
  title: 'Autonomous agent',
  'x-i18n-title': { en: 'Autonomous agent', fr: 'Agent autonome' },
  type: 'object',
  additionalProperties: false,
  required: ['id', 'owner', 'title', 'persona', 'mcpServers', 'toolDisclosure', 'enabled'],
  properties: {
    id: { type: 'string', readOnly: true },
    owner: {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'id'],
      readOnly: true,
      properties: {
        type: { type: 'string', enum: ['user', 'organization'] },
        id: { type: 'string' },
        name: { type: 'string' },
        department: { type: 'string' }
      }
    },
    title: {
      type: 'string',
      title: 'Name',
      'x-i18n-title': { en: 'Name', fr: 'Nom' }
    },
    persona: {
      type: 'string',
      layout: 'textarea',
      title: 'Persona',
      'x-i18n-title': { en: 'Persona', fr: 'Persona' },
      description: 'Who this autonomous agent is: its role, tone and scope. Becomes the system prompt.',
      'x-i18n-description': {
        en: 'Who this autonomous agent is: its role, tone and scope. Becomes the system prompt.',
        fr: 'Qui est cet agent autonome : son rôle, son ton et son périmètre. Devient le prompt système.'
      }
    },
    instructions: {
      type: 'string',
      layout: 'textarea',
      title: 'Instructions',
      'x-i18n-title': { en: 'Instructions', fr: 'Instructions' },
      description: 'How it should work: procedures, constraints, what to do when unsure.',
      'x-i18n-description': {
        en: 'How it should work: procedures, constraints, what to do when unsure.',
        fr: 'Comment il doit travailler : procédures, contraintes, conduite à tenir en cas de doute.'
      }
    },
    mcpServers: {
      type: 'array',
      default: [],
      title: 'MCP servers',
      'x-i18n-title': { en: 'MCP servers', fr: 'Serveurs MCP' },
      description: 'Picked from the servers configured for this deployment.',
      'x-i18n-description': {
        en: 'Picked from the servers configured for this deployment.',
        fr: 'Choisis parmi les serveurs configurés pour ce déploiement.'
      },

      layout: { itemTitle: 'item?.serverId || ""', listActions: ['add', 'edit', 'delete'] },
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['serverId'],
        properties: {
          serverId: {
            type: 'string',
            title: 'Server',
            'x-i18n-title': { en: 'Server', fr: 'Serveur' },
            layout: {
              comp: 'autocomplete',
              getItems: {
                // eslint-disable-next-line no-template-curly-in-string
                url: '${context.apiPath}/autonomous-agents/${context.accountType}/${context.accountId}/mcp-servers',
                itemsResults: 'data.results',
                itemTitle: 'item.name',
                itemKey: 'item.id',
                itemValue: 'item.id'
              }
            }
          },
          toolFilter: {
            type: 'array',
            title: 'Only these tools',
            'x-i18n-title': { en: 'Only these tools', fr: 'Uniquement ces outils' },
            description: 'Leave empty to expose every tool this server offers.',
            'x-i18n-description': {
              en: 'Leave empty to expose every tool this server offers.',
              fr: 'Laissez vide pour exposer tous les outils proposés par ce serveur.'
            },
            items: { type: 'string' }
          }
        }
      }
    },
    toolDisclosure: {
      type: 'string',
      enum: ['static', 'exploration'],
      default: 'static',
      title: 'Tool disclosure',
      'x-i18n-title': { en: 'Tool disclosure', fr: 'Exposition des outils' },
      description: '"static" sends every selected tool on every turn. "exploration" shows names only and lets the autonomous agent promote the ones it needs — use it when the selection is large.',
      'x-i18n-description': {
        en: '"static" sends every selected tool on every turn. "exploration" shows names only and lets the autonomous agent promote the ones it needs — use it when the selection is large.',
        fr: "« static » envoie tous les outils sélectionnés à chaque tour. « exploration » n'affiche que les noms et laisse l'agent autonome promouvoir ceux dont il a besoin — à utiliser quand la sélection est grande."
      }
    },
    nhi: {
      type: 'object',
      additionalProperties: false,
      required: ['clientId'],
      title: 'Non-human identity',
      'x-i18n-title': { en: 'Non-human identity', fr: 'Identité non humaine' },
      properties: {
        clientId: {
          type: 'string',
          title: 'Client id',
          'x-i18n-title': { en: 'Client id', fr: 'Identifiant client' }
        }
      }
    },
    instructors: {
      type: 'array',
      default: [],
      title: 'Users allowed to instruct',
      'x-i18n-title': { en: 'Users allowed to instruct', fr: 'Utilisateurs autorisés à donner des instructions' },
      description: 'Admins of the owning organization are always allowed. Anyone listed here borrows this autonomous agent\'s permissions.',
      'x-i18n-description': {
        en: 'Admins of the owning organization are always allowed. Anyone listed here borrows this autonomous agent\'s permissions.',
        fr: "Les administrateurs de l'organisation propriétaire sont toujours autorisés. Toute personne listée ici emprunte les permissions de cet agent autonome."
      },
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['userId'],
        properties: {
          userId: { type: 'string', title: 'User id', 'x-i18n-title': { en: 'User id', fr: 'Identifiant utilisateur' } },
          userName: { type: 'string', title: 'User name', 'x-i18n-title': { en: 'User name', fr: 'Nom' } }
        }
      }
    },
    enabled: {
      type: 'boolean',
      default: true,
      title: 'Enabled',
      'x-i18n-title': { en: 'Enabled', fr: 'Activé' }
    },
    createdAt: { type: 'string', format: 'date-time', readOnly: true },
    updatedAt: { type: 'string', format: 'date-time', readOnly: true },
    createdBy: {
      type: 'object',
      additionalProperties: false,
      required: ['id'],
      readOnly: true,
      properties: { id: { type: 'string' }, name: { type: 'string' } }
    }
  }
}

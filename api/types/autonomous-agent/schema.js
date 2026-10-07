export default {
  $id: 'https://github.com/data-fair/agents/autonomous-agent',
  'x-exports': ['types'],
  title: 'Autonomous agent',
  'x-i18n-title': { en: 'Autonomous agent', fr: 'Agent autonome' },
  type: 'object',
  additionalProperties: false,
  required: ['id', 'owner', 'title', 'persona', 'mcpServers', 'enabled'],
  properties: {
    id: { type: 'string', readOnly: true },
    owner: {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'id'],
      readOnly: true,
      properties: {
        // Autonomous agents are only ever owned by an organization: their identity
        // model rests on NHIs, which simple-directory binds to exactly one
        // organization, so a personal-account (owner.type: 'user') autonomous agent
        // is meaningless. See assertOrganizationOwner in api/src/autonomous-agents/service.ts,
        // which enforces this at the route level (a schema enum alone cannot: it
        // guards writes, not the read paths keyed on the URL's :type param).
        type: { type: 'string', enum: ['organization'] },
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
    nhi: {
      type: 'object',
      additionalProperties: false,
      required: ['clientId'],
      title: 'Non-human identity',
      'x-i18n-title': { en: 'Non-human identity', fr: 'Identité non humaine' },
      properties: {
        clientId: {
          type: 'string',
          minLength: 1,
          title: 'Client id',
          'x-i18n-title': { en: 'Client id', fr: 'Identifiant client' }
        },
        // Captured server-side from the proxied request that enrolled this autonomous
        // agent (reqSiteUrl), never sent by the client. Everything the exchange needs is
        // derived from these two, so they cannot drift from each other.
        siteUrl: { type: 'string', readOnly: true },
        issuer: { type: 'string', readOnly: true }
      }
    },
    instructors: {
      type: 'array',
      default: [],
      title: 'Who may instruct',
      'x-i18n-title': { en: 'Who may instruct', fr: 'Qui peut donner des instructions' },
      description: 'Admins of the owning organization are always allowed. Anyone matched here borrows this autonomous agent\'s permissions.',
      'x-i18n-description': {
        en: 'Admins of the owning organization are always allowed. Anyone matched here borrows this autonomous agent\'s permissions.',
        fr: "Les administrateurs de l'organisation propriétaire sont toujours autorisés. Toute personne correspondant à une référence ci-dessous emprunte les permissions de cet agent autonome."
      },
      // The uniform access reference (member, email, partner organization, role/department), so
      // who may instruct is expressed the same way as every other permission list in the stack.
      items: { $ref: 'https://github.com/data-fair/lib/access-ref' }
    },
    approvals: {
      type: 'object',
      additionalProperties: false,
      title: 'Approvals',
      'x-i18n-title': { en: 'Approvals', fr: 'Approbations' },
      description: 'What happens when this autonomous agent calls a tool, by the kind of action the tool declares. "Approve" stops the turn until the person in the chat approves the call; a scheduled task never gets such a tool. Tools that declare nothing count as writing.',
      'x-i18n-description': {
        en: 'What happens when this autonomous agent calls a tool, by the kind of action the tool declares. "Approve" stops the turn until the person in the chat approves the call; a scheduled task never gets such a tool. Tools that declare nothing count as writing.',
        fr: "Ce qui se passe quand cet agent autonome appelle un outil, selon le type d'action que l'outil déclare. « Approuver » arrête le tour jusqu'à ce que la personne dans la conversation approuve l'appel ; une tâche planifiée ne reçoit jamais un tel outil. Les outils qui ne déclarent rien comptent comme écrivant."
      },
      properties: Object.fromEntries(/** @type {[string, { en: string, fr: string }, string][]} */([
        ['readOnly', { en: 'Reading', fr: 'Lecture' }, 'allow'],
        ['write', { en: 'Writing', fr: 'Écriture' }, 'allow'],
        ['destructive', { en: 'Destructive', fr: 'Destruction' }, 'approve']
      ]).map(([key, title, fallback]) => [key, {
        type: 'string',
        title: title.en,
        'x-i18n-title': title,
        default: fallback,
        oneOf: [
          { const: 'allow', title: 'Allow', 'x-i18n-title': { en: 'Allow', fr: 'Autoriser' } },
          { const: 'approve', title: 'Approve each call', 'x-i18n-title': { en: 'Approve each call', fr: 'Approuver chaque appel' } },
          { const: 'deny', title: 'Never offer', 'x-i18n-title': { en: 'Never offer', fr: 'Ne jamais proposer' } }
        ]
      }]))
    },
    memory: {
      type: 'object',
      additionalProperties: false,
      required: ['enabled'],
      title: 'Memory',
      'x-i18n-title': { en: 'Memory', fr: 'Mémoire' },
      properties: {
        enabled: {
          type: 'boolean',
          default: false,
          title: 'Keep a memory across conversations',
          'x-i18n-title': { en: 'Keep a memory across conversations', fr: 'Conserver une mémoire entre les conversations' },
          description: 'The agent keeps notes it reuses in every later conversation, and reviews its past conversations to update them. Administrators can read, edit and restore this memory. Memory writes are not subject to the approval settings: every change is versioned and can be restored.',
          'x-i18n-description': {
            en: 'The agent keeps notes it reuses in every later conversation, and reviews its past conversations to update them. Administrators can read, edit and restore this memory. Memory writes are not subject to the approval settings: every change is versioned and can be restored.',
            fr: "L'agent conserve des notes qu'il réutilise dans toutes ses conversations suivantes, et relit ses conversations passées pour les mettre à jour. Les administrateurs peuvent lire, modifier et restaurer cette mémoire. Les écritures en mémoire ne sont pas soumises aux réglages d'approbation : chaque modification est versionnée et peut être restaurée."
          }
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

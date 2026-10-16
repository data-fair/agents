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
      // simple-directory caps an identity name at 150 characters and ours adds " (autonomous agent)" (19)
      maxLength: 131,
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
          profiles: {
            type: 'array',
            title: 'Profiles',
            'x-i18n-title': { en: 'Profiles', fr: 'Profils' },
            description: 'What this server lets the agent do, by profile.',
            'x-i18n-description': { en: 'What this server lets the agent do, by profile.', fr: 'Ce que ce serveur permet à l\'agent, par profil.' },
            // a profiled server only (context.profiledServers, from the mcp-servers listing), drawn by McpProfilesTree.vue
            layout: {
              if: 'context.profiledServers?.includes(parent.data?.serverId)',
              slots: { component: { name: 'mcp-profiles' } }
            },
            items: { type: 'string' }
          },
          toolFilter: {
            type: 'array',
            layout: { if: '!context.profiledServers?.includes(parent.data?.serverId)' },
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
    role: {
      type: 'string',
      default: 'user',
      title: 'Role in the organization',
      'x-i18n-title': { en: 'Role in the organization', fr: "Rôle dans l'organisation" },
      description: "What the agent can do in the platform's services, like a member with this role.",
      'x-i18n-description': {
        en: "What the agent can do in the platform's services, like a member with this role.",
        fr: "Ce que l'agent peut faire dans les services de la plateforme, comme un membre ayant ce rôle."
      },
      layout: {
        getItems: {
          // eslint-disable-next-line no-template-curly-in-string
          url: '/simple-directory/api/organizations/${context.owner.id}/roles'
        }
      }
    },
    approvalLevel: {
      type: 'string',
      default: 'destructive',
      layout: 'radio-group',
      title: 'Ask for approval for',
      'x-i18n-title': { en: 'Ask for approval for', fr: 'Demander une approbation pour' },
      description: 'A planned task has nobody to approve: tools that need approval are not offered to it.',
      'x-i18n-description': {
        en: 'A planned task has nobody to approve: tools that need approval are not offered to it.',
        fr: "Une tâche planifiée n'a personne pour approuver : les outils soumis à approbation ne lui sont pas proposés."
      },
      oneOf: [
        { const: 'write', title: 'Every operation that makes changes', 'x-i18n-title': { en: 'Every operation that makes changes', fr: 'Toutes les opérations qui effectuent des modifications' } },
        { const: 'destructive', title: 'Only operations marked as particularly destructive', 'x-i18n-title': { en: 'Only operations marked as particularly destructive', fr: 'Uniquement les opérations notées comme particulièrement destructives' } },
        { const: 'none', title: 'None (the agent is fully autonomous in its tool calls)', 'x-i18n-title': { en: 'None (the agent is fully autonomous in its tool calls)', fr: "Aucune (l'agent est entièrement autonome dans ses appels d'outils)" } }
      ]
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
          description: 'The agent keeps notes it reuses in every later conversation, and tidies them once a day from what people told it. Administrators can read, edit and restore this memory. Memory writes are not subject to the approval settings: every change is versioned and can be restored.',
          'x-i18n-description': {
            en: 'The agent keeps notes it reuses in every later conversation, and tidies them once a day from what people told it. Administrators can read, edit and restore this memory. Memory writes are not subject to the approval settings: every change is versioned and can be restored.',
            fr: "L'agent conserve des notes qu'il réutilise dans toutes ses conversations suivantes, et les remet en ordre une fois par jour à partir de ce qu'on lui a dit. Les administrateurs peuvent lire, modifier et restaurer cette mémoire. Les écritures en mémoire ne sont pas soumises aux réglages d'approbation : chaque modification est versionnée et peut être restaurée."
          }
        }
      }
    },
    web: {
      type: 'object',
      additionalProperties: false,
      required: ['enabled'],
      title: 'Web access',
      'x-i18n-title': { en: 'Web access', fr: 'Accès au web' },
      description: 'Pages under the allowed URLs are read by the agent as text, and text can contain instructions: their authors can in effect instruct this agent, with its identity and all its tools, and make it send information out. Enable this only on agents with very restricted write and administration capabilities.',
      'x-i18n-description': {
        en: 'Pages under the allowed URLs are read by the agent as text, and text can contain instructions: their authors can in effect instruct this agent, with its identity and all its tools, and make it send information out. Enable this only on agents with very restricted write and administration capabilities.',
        fr: "Les pages sous les URL autorisées sont lues par l'agent comme du texte, et un texte peut contenir des instructions : leurs auteurs peuvent de fait donner des instructions à cet agent, avec son identité et tous ses outils, et lui faire envoyer des informations à l'extérieur. N'activez cet accès que sur des agents aux capacités d'écriture et d'administration très restreintes."
      },
      properties: {
        enabled: {
          type: 'boolean',
          default: false,
          title: 'Read web pages',
          'x-i18n-title': { en: 'Read web pages', fr: 'Lire des pages web' },
          description: 'The agent can read pages, feeds and sitemaps under the allowed URLs, and ask an administrator of the organization, in a conversation, to allow more.',
          'x-i18n-description': {
            en: 'The agent can read pages, feeds and sitemaps under the allowed URLs, and ask an administrator of the organization, in a conversation, to allow more.',
            fr: "L'agent peut lire les pages, flux et plans de site sous les URL autorisées, et demander à un administrateur de l'organisation, dans une conversation, d'en autoriser d'autres."
          }
        },
        allowedUrls: {
          type: 'array',
          maxItems: 100,
          default: [],
          title: 'Allowed URLs',
          'x-i18n-title': { en: 'Allowed URLs', fr: 'URL autorisées' },
          description: 'An address can be read when it starts with one of these: "https://github.com/data-fair" allows the repositories of that organization only, "https://www.data.gouv.fr/" the whole site. A site\'s robots.txt, sitemaps and search description are readable as soon as one of its addresses is allowed.',
          'x-i18n-description': {
            en: 'An address can be read when it starts with one of these: "https://github.com/data-fair" allows the repositories of that organization only, "https://www.data.gouv.fr/" the whole site. A site\'s robots.txt, sitemaps and search description are readable as soon as one of its addresses is allowed.',
            fr: "Une adresse peut être lue quand elle commence par l'une de celles-ci : « https://github.com/data-fair » n'autorise que les dépôts de cette organisation, « https://www.data.gouv.fr/ » tout le site. Le robots.txt, les plans de site et la description de recherche d'un site sont lisibles dès que l'une de ses adresses est autorisée."
          },
          layout: { if: 'parent.data?.enabled' },
          items: { type: 'string', minLength: 1 }
        }
      }
    },
    externalMcpServers: {
      type: 'array',
      // Keep equal to EXTERNAL_MCP_SERVERS_MAX (api/src/mcp-servers/operations.ts), which request_mcp_access enforces.
      maxItems: 50,
      default: [],
      title: 'External MCP servers',
      'x-i18n-title': { en: 'External MCP servers', fr: 'Serveurs MCP externes' },
      description: 'Public MCP servers the agent uses anonymously — another data portal, on this platform or elsewhere. Their authors write the descriptions the agent reads, and what it sends them leaves the platform: like web access, this lets them in effect instruct the agent.',
      'x-i18n-description': {
        en: 'Public MCP servers the agent uses anonymously — another data portal, on this platform or elsewhere. Their authors write the descriptions the agent reads, and what it sends them leaves the platform: like web access, this lets them in effect instruct the agent.',
        fr: "Serveurs MCP publics que l'agent utilise de façon anonyme — un autre portail de données, sur cette plateforme ou ailleurs. Leurs auteurs écrivent les descriptions que l'agent lit, et ce qu'il leur envoie quitte la plateforme : comme l'accès au web, cela leur permet de fait de donner des instructions à l'agent."
      },
      layout: { itemTitle: 'item?.url || ""', listActions: ['add', 'edit', 'delete'] },
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['url'],
        properties: {
          url: { type: 'string', minLength: 1, title: 'URL', 'x-i18n-title': { en: 'URL', fr: 'URL' } }
        }
      }
    },
    enabled: {
      type: 'boolean',
      default: true,
      title: 'Enabled',
      'x-i18n-title': { en: 'Enabled', fr: 'Activé' }
    },
    // Memory consolidation bookkeeping (api/src/memory/consolidation.ts). Server-written; absent until
    // the first pass of an agent with memory.
    memoryConsolidation: {
      type: 'object',
      readOnly: true,
      additionalProperties: false,
      properties: {
        at: { type: 'string', format: 'date-time' },
        until: { type: 'string', format: 'date-time' },
        failedAt: { type: 'string', format: 'date-time' },
        deferredAt: { type: 'string', format: 'date-time' }
      }
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

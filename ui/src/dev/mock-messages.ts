import type { ChatMessage } from '~/composables/use-agent-chat'

export const mockMessages: ChatMessage[] = [
  {
    role: 'user',
    content: 'Quels jeux de données sont disponibles sur le portail ?'
  },
  {
    role: 'assistant',
    content: 'Je vais rechercher les jeux de données disponibles sur le portail.',
    toolInvocations: [
      { toolCallId: 'call_1', toolName: 'listDatasets', state: 'done' }
    ]
  },
  {
    role: 'assistant',
    content: 'Voici les jeux de données disponibles :\n\n- **Registre des entreprises** (1 245 lignes) — Données issues du registre national des entreprises\n- **Qualité de l\'air 2024** (8 760 lignes) — Mesures horaires de la qualité de l\'air\n- **Budget communal** (342 lignes) — Données budgétaires des communes'
  },
  {
    role: 'user',
    content: 'Peux-tu me montrer les colonnes du jeu de données sur la qualité de l\'air ?'
  },
  {
    role: 'assistant',
    content: 'Le jeu de données **Qualité de l\'air 2024** contient les colonnes suivantes :\n\n- `date` — Date et heure de la mesure\n- `station` — Identifiant de la station de mesure\n- `polluant` — Type de polluant (PM2.5, PM10, NO2, O3)\n- `valeur` — Valeur mesurée (µg/m³)\n- `qualite` — Indice de qualité (Bon, Moyen, Mauvais)'
  },
  {
    role: 'user',
    content: 'Quelle est la moyenne de PM2.5 par station ?'
  },
  {
    role: 'assistant',
    content: 'Je lance le calcul des moyennes de PM2.5 par station.',
    toolInvocations: [
      { toolCallId: 'call_2', toolName: 'queryDataset', state: 'done' }
    ]
  },
  {
    role: 'assistant',
    content: 'Voici les moyennes de PM2.5 par station :\n\n| Station | Moyenne PM2.5 (µg/m³) |\n|---------|----------------------|\n| ST-001  | 12.3                 |\n| ST-002  | 18.7                 |\n| ST-003  | 9.1                  |\n| ST-004  | 15.4                 |'
  }
]

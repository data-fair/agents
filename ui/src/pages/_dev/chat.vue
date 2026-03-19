<template>
  <div class="chat-page">
    <AgentChat
      :account-type="session.account.value?.type ?? 'user'"
      :account-id="session.account.value?.id ?? ''"
      :debug="true"
      title="Chat Dev"
      :initial-messages="mockMessages"
    />
  </div>
</template>

<script lang="ts" setup>
import AgentChat from '~/components/AgentChat.vue'
import type { ChatMessage } from '~/composables/use-agent-chat'
import { useAgentSubAgent, useFrameServer } from '@data-fair/lib-vue-agents'
import { useSessionAuthenticated } from '@data-fair/lib-vue/session.js'

const session = useSessionAuthenticated()

useFrameServer('self')

// Register a demo sub-agent for testing
useAgentSubAgent({
  name: 'data_analyst',
  description: 'Analyzes datasets and produces summaries with statistics',
  prompt: 'You are a data analyst specialized in exploring and summarizing datasets. Answer concisely with key statistics.',
  tools: ['queryDataset', 'getSchema']
})

const mockMessages: ChatMessage[] = [
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
    content: 'Je délègue l\'analyse au sous-agent spécialisé.',
    toolInvocations: [
      { toolCallId: 'call_sub_1', toolName: 'subagent_data_analyst', state: 'done' }
    ],
    subAgentMessages: [
      {
        role: 'assistant',
        content: 'Je récupère le schéma et lance la requête.',
        toolInvocations: [
          { toolCallId: 'call_sub_t1', toolName: 'getSchema', state: 'done' },
          { toolCallId: 'call_sub_t2', toolName: 'queryDataset', state: 'done' }
        ]
      },
      {
        role: 'assistant',
        content: 'Analyse terminée. Moyennes de PM2.5 : ST-001 = 12.3, ST-002 = 18.7, ST-003 = 9.1, ST-004 = 15.4 µg/m³.'
      }
    ]
  },
  {
    role: 'assistant',
    content: 'Voici les moyennes de PM2.5 par station :\n\n| Station | Moyenne PM2.5 (µg/m³) |\n|---------|----------------------|\n| ST-001  | 12.3                 |\n| ST-002  | 18.7                 |\n| ST-003  | 9.1                  |\n| ST-004  | 15.4                 |'
  }
]
</script>

<style scoped>
.chat-page {
  height: 100vh;
  padding: 0;
  margin: 0;
}
</style>

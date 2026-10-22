<template>
  <v-dialog
    :model-value="modelValue"
    fullscreen
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card
      class="d-flex flex-column"
      flat
    >
      <div class="d-flex align-center px-4 pt-2">
        <v-btn
          :icon="mdiArrowLeft"
          variant="text"
          size="small"
          color="secondary"
          :title="t('close')"
          class="mr-1"
          @click="$emit('update:modelValue', false)"
        />
        <!-- Shrinks rather than clipping: the chat is often a narrow iframe. -->
        <v-tabs
          v-model="activeDebugTab"
          density="compact"
          class="agent-chat__tabs"
        >
          <v-tab value="tools">
            {{ t('tools') }}
          </v-tab>
          <v-tab value="settings">
            {{ t('settings') }}
          </v-tab>
          <v-tab
            v-if="fetchSelfUsage"
            value="consumption"
          >
            {{ t('consumption') }}
          </v-tab>
        </v-tabs>
      </div>
      <v-card-text class="flex-grow-1 pt-2 px-4">
        <v-window v-model="activeDebugTab">
          <v-window-item value="tools">
            <v-btn
              v-if="showReview"
              variant="tonal"
              size="small"
              :prepend-icon="mdiOpenInNew"
              class="mt-3"
              @click="openReview"
            >
              {{ t('openReview') }}
            </v-btn>

            <!--
              What the agent can call, grouped by where each tool comes from. The rest of what the model
              is given (instructions, page context, per-call usage) is on the review page, which is the
              exhaustive view; this one is a quick look.
            -->
            <div class="text-caption font-weight-bold mt-3 mb-1 px-2">
              {{ t('availableTools') }} ({{ availableCount }})
            </div>
            <div
              v-if="!lastTurnTools.names.length"
              class="text-caption text-medium-emphasis px-2 mb-1"
            >
              {{ t('beforeFirstTurn') }}
            </div>
            <tool-group-list
              :groups="availableGroups"
              :descriptions="pageToolDescriptions"
              data-testid="available-tools"
            />
          </v-window-item>

          <v-window-item value="settings">
            <v-defaults-provider
              :defaults="{ VSwitch: { hideDetails: true, density: 'compact', color: 'primary' } }"
            >
              <div class="pa-3">
                <template v-if="showConsentToggle">
                  <df-tutorial-alert
                    id="agent-settings-review-consent"
                    :text="t('reviewConsentHint')"
                    :initial="false"
                    persistent
                  />
                  <v-switch
                    :model-value="consentRef === 'yes'"
                    :label="t('reviewConsent')"
                    @update:model-value="(v: boolean | null) => writeConsent(v ? 'yes' : 'no')"
                  />
                </template>

                <div class="text-caption font-weight-bold text-medium-emphasis mt-4 mb-1">
                  {{ t('experimental') }}
                </div>

                <df-tutorial-alert
                  id="agent-settings-simple-subagents"
                  :text="t('simpleSubAgentsHint')"
                  :initial="false"
                  persistent
                />
                <v-switch
                  :model-value="simpleSubAgents"
                  :label="t('simpleSubAgents')"
                  @update:model-value="(v: boolean | null) => $emit('update:simpleSubAgents', v ?? true)"
                />

                <df-tutorial-alert
                  id="agent-settings-mermaid"
                  :text="t('mermaidHint')"
                  :initial="false"
                  persistent
                />
                <v-switch
                  :model-value="mermaid"
                  :label="t('mermaid')"
                  @update:model-value="(v: boolean | null) => $emit('update:mermaid', v ?? false)"
                />

                <df-tutorial-alert
                  id="agent-settings-show-reasoning"
                  :text="t('showReasoningHint')"
                  :initial="false"
                  persistent
                />
                <v-switch
                  :model-value="showReasoning"
                  :label="t('showReasoning')"
                  @update:model-value="(v: boolean | null) => $emit('update:showReasoning', v ?? false)"
                />
              </div>
            </v-defaults-provider>
          </v-window-item>

          <v-window-item
            v-if="fetchSelfUsage"
            value="consumption"
          >
            <agent-chat-consumption
              :conversation-cost="conversationCost ?? 0"
              :usage-version="usageVersion ?? 0"
              :fetch-self-usage="fetchSelfUsage"
              :active="modelValue && activeDebugTab === 'consumption'"
            />
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<i18n lang="yaml">
fr:
  close: Fermer
  tools: Outils
  availableTools: Outils disponibles
  beforeFirstTurn: Les outils intégrés au service s'y ajouteront au premier tour.
  openReview: Ouvrir l'analyse
  settings: Paramètres
  consumption: Consommation
  reviewConsent: Enregistrer mes conversations pour relecture
  reviewConsentHint: "Vos conversations seront enregistrées sur le serveur pendant 30 jours afin qu'un administrateur puisse les relire. Vous pouvez retirer votre consentement à tout moment."
  experimental: Expérimental
  simpleSubAgents: Affichage simplifié des sous-agents
  simpleSubAgentsHint: "Affiche les sous-agents délégués sous forme d'une simple puce de statut, au lieu d'un panneau de trace dépliable. Ce réglage ne réinitialise pas la conversation."
  mermaid: Diagrammes Mermaid
  mermaidHint: "Affiche les blocs de code Mermaid sous forme de diagrammes (graphiques XY, organigrammes, etc.). Changer ce réglage réinitialise la conversation."
  showReasoning: Affichage complet du raisonnement
  showReasoningHint: "Affiche la réflexion des modèles de raisonnement dans un panneau dépliable au-dessus de chaque réponse. Désactivé, une brève ligne « Réflexion… » apparaît pendant que le modèle raisonne, sans rien conserver ensuite."
en:
  close: Close
  tools: Tools
  availableTools: Available tools
  beforeFirstTurn: The service's own tools are added on the first turn.
  openReview: Open review
  settings: Settings
  consumption: Consumption
  reviewConsent: Store my conversations for review
  reviewConsentHint: "Your conversations will be stored on the server for 30 days so an administrator can review them. You can withdraw your consent at any time."
  experimental: Experimental
  simpleSubAgents: Simplify sub-agent display
  simpleSubAgentsHint: "Shows delegated sub-agents as a simple status chip instead of an expandable trace panel. This setting does not reset the conversation."
  mermaid: Mermaid diagrams
  mermaidHint: "Renders Mermaid code blocks as diagrams (XY charts, flowcharts, etc.). Changing this setting resets the conversation."
  showReasoning: Full reasoning display
  showReasoningHint: "Shows reasoning models' thinking as a foldable panel above each answer. When off, a brief 'Thinking…' line appears while the model reasons and nothing is kept afterward."
</i18n>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { mdiArrowLeft, mdiOpenInNew } from '@mdi/js'
import DfTutorialAlert from '@data-fair/lib-vuetify/tutorial-alert.vue'
import type { SelfUsage } from '../../../../api/src/usage/operations'
import AgentChatConsumption from './AgentChatConsumption.vue'
import type { Tool } from 'ai'
import { toolDescription } from '@agents/shared/tool-description'
import { isPersonalAgentId } from '@agents/shared/agent-audit'
import { availableToolGroups, lastOfferedTools, type SourcedTools } from '~/utils/tool-groups'
import ToolGroupList from './ToolGroupList.vue'
import { $apiPath, $fetch } from '~/context'
import { reviewOffered, consentRef, writeConsent } from '~/review/review-consent'

const props = defineProps<{
  modelValue: boolean
  /** The page's tools as the aggregator discovered them, i.e. what the socket sends up. */
  pageTools: Record<string, Tool>
  /** Absent until the socket has attached: the server assigns it, so the client cannot know it earlier. */
  conversationId?: string
  /** The chat's current agent: an admin is shown its MCP servers' tools before its first turn. */
  agentId?: string
  isAdmin?: boolean
  /** A configured agent's chat: reviewable by the admins whatever the consent, so none is asked. */
  audited?: boolean
  accountType: string
  accountId: string
  simpleSubAgents?: boolean
  mermaid?: boolean
  showReasoning?: boolean
  // The Consumption tab is shown only when the chat can report usage: optional rather than required,
  // so the dialog does not demand a capability from every host that embeds it.
  conversationCost?: number
  usageVersion?: number
  fetchSelfUsage?: () => Promise<SelfUsage>
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
  'update:simpleSubAgents': [value: boolean]
  'update:mermaid': [value: boolean]
  'update:showReasoning': [value: boolean]
}>()

const { t } = useI18n()
const router = useRouter()

const activeDebugTab = ref('tools')

/** The page's tools' descriptions, which only the page can give: the run records names. */
const pageToolDescriptions = computed(() => Object.fromEntries(Object.entries(props.pageTools).map(([name, tool]) => [name, toolDescription(tool)])))

/**
 * The tools the model was offered on the conversation's last turn, read from the run when the dialog
 * opens and again when a turn ends: the run's record is written as it closes, a moment after its answer
 * has streamed, so a dialog opened in between first reads the turn before. Empty before a first turn, and
 * for an anonymous chat, which has no run to read: an admin is then shown what the agent's MCP servers
 * offer now.
 */
const noTools: SourcedTools = { names: [], sources: {} }
const lastTurnTools = ref<SourcedTools>(noTools)
const agentServerTools = ref<SourcedTools>(noTools)
const availableGroups = computed(() => availableToolGroups(
  lastTurnTools.value.names.length ? lastTurnTools.value : agentServerTools.value,
  Object.keys(props.pageTools)
))
const availableCount = computed(() => availableGroups.value.reduce((count, group) => count + group.names.length, 0))

watch(() => [props.modelValue, props.usageVersion, props.conversationId] as const, async ([open], previous) => {
  if (!open) return
  // Cleared on opening and on another thread, so a list never lingers where it is not true; a refetch
  // after a turn keeps the one on screen until the new one replaces it.
  if (!previous?.[0] || previous[2] !== props.conversationId) {
    lastTurnTools.value = noTools
    agentServerTools.value = noTools
  }
  if (props.conversationId) {
    try {
      const res = await $fetch<{ results: Parameters<typeof lastOfferedTools>[0] }>(
        `${$apiPath}/conversations/${props.accountType}/${props.accountId}/${props.conversationId}/runs`
      )
      lastTurnTools.value = lastOfferedTools(res.results)
    } catch { /* the before-first-turn state says it */ }
  }
  if (lastTurnTools.value.names.length || !props.isAdmin || !props.agentId || isPersonalAgentId(props.agentId)) return
  try {
    const res = await $fetch<{ results: Array<{ name: string, server: string, kind: 'platform' | 'catalog' | 'external' }> }>(
      `${$apiPath}/autonomous-agents/${props.accountType}/${props.accountId}/${props.agentId}/tools`
    )
    agentServerTools.value = {
      names: res.results.map(tool => tool.name),
      sources: Object.fromEntries(res.results.map(tool => [tool.name, { kind: tool.kind, server: tool.server }]))
    }
  } catch { /* a server that cannot be listed: its turns say so */ }
})

// Show the consent toggle as soon as storage is advertised, OR if a prior
// decision is already stored in the cookie — so a user who consented in a
// previous session can flip it back without sending a first message.
const showConsentToggle = computed(() => !props.audited && (reviewOffered.value || consentRef.value !== undefined))

// `conversationId` gates it too: the review route needs one, and offering a button that resolves to
// a path with `undefined` in it is worse than not offering it for the moment before attach.
const showReview = computed(() => !!props.isAdmin && !!props.conversationId && (props.audited || (reviewOffered.value && consentRef.value === 'yes')))

// Open the review in a new tab at the account-scoped review route. `router.resolve(...).href`
// includes the app's base ('/agents'), so this works whether the chat is standalone or
// embedded in data-fair.
const openReview = () => {
  const href = router.resolve({ path: `/${props.accountType}/${props.accountId}/review/${props.conversationId}` }).href
  window.open(href, '_blank')
}
</script>

<style scoped>
.agent-chat__tabs {
  flex: 1 1 0;
  min-width: 0;
}
/* Vuetify's 90px minimum per tab is what clips them in a narrow iframe. */
.agent-chat__tabs :deep(.v-tab) {
  min-width: 0;
  padding: 0 10px;
}
</style>

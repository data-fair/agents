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
          class="mr-2"
          @click="$emit('update:modelValue', false)"
        />
        <v-tabs
          v-model="activeDebugTab"
          density="compact"
        >
          <v-tab value="info">
            {{ t('info') }}
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
        <v-spacer />
      </div>
      <v-card-text class="flex-grow-1 pt-2 px-4">
        <v-window v-model="activeDebugTab">
          <v-window-item value="info">
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

            <div class="text-caption font-weight-bold mt-3 mb-1 px-2">
              {{ t('hostContext') }}
            </div>
            <!--
              What this PAGE tells the model, not the whole system prompt. The persona lives on the
              server now (api/src/agent-session/personal-agent.ts) and is not client-readable, so a
              panel claiming to show "the system prompt" would be showing a fraction of it and
              labelling it as the whole. This is the client's entire contribution, which is the part a
              host integrator can actually affect and debug.
            -->
            <pre class="agent-chat__pre pa-3">{{ hostContextText }}</pre>

            <!-- What this page registered right now: the descriptors the socket carries up to the server. -->
            <div class="text-caption font-weight-bold mt-3 mb-1 px-2">
              {{ t('pageTools') }} ({{ pageToolList.length }})
            </div>
            <div
              v-if="!pageToolList.length"
              class="text-center text-medium-emphasis pa-4"
            >
              {{ t('noPageTools') }}
            </div>
            <v-expansion-panels
              v-else
              variant="accordion"
              density="compact"
              class="mt-1 agent-chat__tools-panels"
              data-testid="page-tools"
            >
              <v-expansion-panel
                v-for="dtool in pageToolList"
                :key="dtool.name"
                density="compact"
              >
                <v-expansion-panel-title class="text-caption py-0">
                  <span class="font-weight-medium">{{ dtool.title || dtool.name }}</span>
                  <span
                    v-if="dtool.title"
                    class="text-medium-emphasis ml-1"
                  >{{ dtool.name }}</span>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <p class="text-caption mb-1">
                    {{ dtool.description }}
                  </p>
                  <p class="text-caption text-medium-emphasis mb-1">
                    {{ t('inputSchema') }}:
                  </p>
                  <pre class="agent-chat__pre pa-2">{{ JSON.stringify(dtool.inputSchema, null, 2) }}</pre>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <!--
              The server's own record of the last turn: what the model was actually offered, which no
              page-side computation can claim to be. Names only, as stored on the run.
            -->
            <div class="text-caption font-weight-bold mt-3 mb-1 px-2">
              {{ t('offeredTools') }} ({{ offeredTools.length }})
            </div>
            <div
              v-if="!offeredTools.length"
              class="text-center text-medium-emphasis pa-4"
              data-testid="offered-tools-empty"
            >
              {{ t('noTools') }}
            </div>
            <ul
              v-else
              class="text-caption px-2"
              data-testid="offered-tools"
            >
              <li
                v-for="name in offeredTools"
                :key="name"
              >
                {{ name }}
              </li>
            </ul>
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
  info: Info
  hostContext: Contexte transmis par la page
  pageTools: Outils enregistrés par la page
  noPageTools: Aucun outil enregistré par la page
  offeredTools: Outils proposés au dernier tour
  inputSchema: Schéma d'entrée
  noTools: Aucun outil proposé lors du dernier tour
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
  info: Info
  hostContext: Context reported by this page
  pageTools: Tools registered by this page
  noPageTools: No tools registered by this page
  offeredTools: Tools offered on the last turn
  inputSchema: Input Schema
  noTools: No tools offered on the last turn
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
import { $apiPath, $fetch } from '~/context'
import { reviewOffered, consentRef, writeConsent } from '~/review/review-consent'

const props = defineProps<{
  modelValue: boolean
  hostContext: Record<string, string | null>
  /** The page's tools as the aggregator discovered them, i.e. what the socket sends up. */
  pageTools: Record<string, Tool>
  /** Absent until the socket has attached: the server assigns it, so the client cannot know it earlier. */
  conversationId?: string
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

/**
 * The reported facts as lines, with the withdrawn ones left out.
 *
 * A null value means "no longer true", so printing it as `surface: null` would read as a fact whose
 * value is the word null — which is how a panel meant to explain the model's view starts misleading
 * the person reading it.
 */
const hostContextText = computed(() => {
  const lines = Object.entries(props.hostContext)
    .filter(([, detail]) => detail !== null && detail !== undefined)
    .map(([key, detail]) => `${key}: ${detail}`)
  return lines.length ? lines.join('\n') : '—'
})

defineEmits<{
  'update:modelValue': [value: boolean]
  'update:simpleSubAgents': [value: boolean]
  'update:mermaid': [value: boolean]
  'update:showReasoning': [value: boolean]
}>()

const { t } = useI18n()
const router = useRouter()

const activeDebugTab = ref('info')

/** The tools the page in front of the person offers now. */
const pageToolList = computed(() => Object.entries(props.pageTools).map(([name, tool]) => ({
  name,
  title: (tool as any).title as string | undefined,
  description: tool.description ?? '',
  inputSchema: (tool as any).inputSchema?.jsonSchema ?? {}
})))

/**
 * The tools the model was offered on the conversation's last turn, read from the run when the dialog
 * opens (cleared first, so another thread's list never lingers). Empty before a first turn, and for an
 * anonymous chat, which has no run to read.
 */
const offeredTools = ref<string[]>([])
watch(() => props.modelValue, async open => {
  if (!open) return
  offeredTools.value = []
  if (!props.conversationId) return
  try {
    const res = await $fetch<{ results: Array<{ calls?: Array<{ toolNames?: string[] }> }> }>(
      `${$apiPath}/conversations/${props.accountType}/${props.accountId}/${props.conversationId}/runs`
    )
    const last = res.results.filter(run => run.calls?.some(call => call.toolNames)).pop()
    offeredTools.value = [...new Set((last?.calls ?? []).flatMap(call => call.toolNames ?? []))].sort()
  } catch {
    offeredTools.value = []
  }
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
.agent-chat__tools-panels :deep(.v-expansion-panel-title) {
  min-height: 28px;
}

.agent-chat__tools-panels :deep(.v-expansion-panel-text__wrapper) {
  padding: 4px 12px 8px;
}

.agent-chat__pre {
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  border-radius: 4px;
  font-size: 0.75rem;
  overflow-x: auto;
  max-height: 300px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

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
              server now (api/src/agent-session/standard-agents.ts) and is not client-readable, so a
              panel claiming to show "the system prompt" would be showing a fraction of it and
              labelling it as the whole. This is the client's entire contribution, which is the part a
              host integrator can actually affect and debug.
            -->
            <pre class="agent-chat__pre pa-3">{{ hostContextText }}</pre>

            <div class="text-caption font-weight-bold mt-3 mb-1 px-2">
              {{ t('tools') }} ({{ totalToolCount }})
            </div>
            <div
              v-if="!totalToolCount"
              class="text-center text-medium-emphasis pa-4"
            >
              {{ t('noTools') }}
            </div>
            <template v-else>
              <v-expansion-panels
                v-if="debugToolsPartition.mainTools.length"
                variant="accordion"
                density="compact"
                class="mt-1 agent-chat__tools-panels"
              >
                <v-expansion-panel
                  v-for="dtool in debugToolsPartition.mainTools"
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

              <template
                v-for="sa in debugToolsPartition.subAgents"
                :key="sa.name"
              >
                <div class="text-caption font-weight-bold mt-3 mb-1 px-2">
                  {{ sa.displayName }}
                  <span class="text-medium-emphasis ml-1">({{ sa.tools.length }} {{ t('tools').toLowerCase() }})</span>
                </div>
                <p
                  v-if="sa.description"
                  class="text-caption text-medium-emphasis px-2 mb-1"
                >
                  {{ sa.description }}
                </p>
                <v-expansion-panels
                  variant="accordion"
                  density="compact"
                  class="agent-chat__tools-panels"
                >
                  <v-expansion-panel
                    v-for="dtool in sa.tools"
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
              </template>
            </template>
          </v-window-item>

          <v-window-item value="settings">
            <v-defaults-provider
              :defaults="{ VSwitch: { hideDetails: true, density: 'compact', color: 'primary' } }"
            >
              <div class="pa-3">
                <template v-if="showConsentToggle">
                  <df-tutorial-alert
                    id="agent-settings-store-traces"
                    :text="t('storeTracesHint')"
                    :initial="false"
                    persistent
                  />
                  <v-switch
                    :model-value="consentRef === 'yes'"
                    :label="t('storeTraces')"
                    @update:model-value="(v: boolean | null) => writeConsent(v ? 'yes' : 'no')"
                  />
                </template>

                <div class="text-caption font-weight-bold text-medium-emphasis mt-4 mb-1">
                  {{ t('experimental') }}
                </div>

                <df-tutorial-alert
                  id="agent-settings-tool-exploration"
                  :text="t('toolExplorationHint')"
                  :initial="false"
                  persistent
                />
                <v-switch
                  :model-value="toolExploration"
                  :label="t('toolExploration')"
                  @update:model-value="$emit('update:toolExploration', $event ?? false)"
                />

                <df-tutorial-alert
                  id="agent-settings-subagents"
                  :text="t('subAgentsHint')"
                  :initial="false"
                  persistent
                />
                <v-switch
                  :model-value="subAgents"
                  :label="t('subAgents')"
                  @update:model-value="$emit('update:subAgents', $event ?? true)"
                />

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
  tools: Outils
  noTools: Aucun outil enregistré
  inputSchema: Schéma d'entrée
  openReview: Ouvrir l'analyse
  settings: Paramètres
  storeTraces: Enregistrer mes conversations pour relecture
  storeTracesHint: "Vos conversations seront enregistrées sur le serveur pendant 30 jours afin qu'un administrateur puisse les relire. Vous pouvez retirer votre consentement à tout moment."
  experimental: Expérimental
  toolExploration: Exploration des outils
  toolExplorationHint: "Temporairement inactif : l'assistant tourne désormais côté serveur, où l'exploration des outils (l'étape « explore_tools ») n'est pas encore réimplémentée. Tous les outils de la page lui sont proposés à chaque étape. Ce réglage est conservé mais n'a aucun effet."
  subAgents: Sous-agents
  subAgentsHint: "Délègue les tâches complexes à des sous-agents spécialisés (comportement par défaut). Désactivez pour exposer tous les outils des sous-agents directement à l'assistant : chaque sous-agent devient un outil de consigne qui renvoie son prompt. Changer ce réglage réinitialise la conversation."
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
  tools: Tools
  noTools: No tools registered
  inputSchema: Input Schema
  openReview: Open review
  settings: Settings
  storeTraces: Store my conversations for review
  storeTracesHint: "Your conversations will be stored on the server for 30 days so an administrator can review them. You can withdraw your consent at any time."
  experimental: Experimental
  toolExploration: Tool exploration
  toolExplorationHint: "Temporarily inactive: the assistant now runs on the server, where tool exploration (the 'explore_tools' step) has not been reimplemented yet. Every tool on the page is offered at every step. The setting is kept but has no effect."
  subAgents: Sub-agents
  subAgentsHint: "Delegates complex tasks to specialised sub-agents (the default behaviour). Turn off to expose every sub-agent tool directly to the assistant: each sub-agent becomes a guidance tool that returns its prompt. Changing this setting resets the conversation."
  simpleSubAgents: Simplify sub-agent display
  simpleSubAgentsHint: "Shows delegated sub-agents as a simple status chip instead of an expandable trace panel. This setting does not reset the conversation."
  mermaid: Mermaid diagrams
  mermaidHint: "Renders Mermaid code blocks as diagrams (XY charts, flowcharts, etc.). Changing this setting resets the conversation."
  showReasoning: Full reasoning display
  showReasoningHint: "Shows reasoning models' thinking as a foldable panel above each answer. When off, a brief 'Thinking…' line appears while the model reasons and nothing is kept afterward."
</i18n>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { mdiArrowLeft, mdiOpenInNew } from '@mdi/js'
import DfTutorialAlert from '@data-fair/lib-vuetify/tutorial-alert.vue'
import type { DebugToolsPartition } from '~/utils/tools-partition'
import { traceStorageAvailable, consentRef, writeConsent } from '~/traces/trace-consent'

const props = defineProps<{
  modelValue: boolean
  hostContext: Record<string, string | null>
  debugToolsPartition: DebugToolsPartition
  /** Absent until the socket has attached: the server assigns it, so the client cannot know it earlier. */
  conversationId?: string
  isAdmin?: boolean
  accountType: string
  accountId: string
  toolExploration?: boolean
  subAgents?: boolean
  simpleSubAgents?: boolean
  mermaid?: boolean
  showReasoning?: boolean
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
  'update:toolExploration': [value: boolean]
  'update:subAgents': [value: boolean]
  'update:simpleSubAgents': [value: boolean]
  'update:mermaid': [value: boolean]
  'update:showReasoning': [value: boolean]
}>()

const { t } = useI18n()
const router = useRouter()

const activeDebugTab = ref('info')
const totalToolCount = computed(() => {
  const p = props.debugToolsPartition
  return p.mainTools.length + p.subAgents.reduce((sum, sa) => sum + sa.tools.length, 0)
})

// Show the consent toggle as soon as storage is advertised, OR if a prior
// decision is already stored in the cookie — so a user who consented in a
// previous session can flip it back without sending a first message.
const showConsentToggle = computed(() => traceStorageAvailable.value || consentRef.value !== undefined)

// `conversationId` gates it too: the review route needs one, and offering a button that resolves to
// a path with `undefined` in it is worse than not offering it for the moment before attach.
const showReview = computed(() => !!props.isAdmin && !!props.conversationId && traceStorageAvailable.value && consentRef.value === 'yes')

// Open the review in a new tab at the account-scoped trace route. `router.resolve(...).href`
// includes the app's base ('/agents'), so this works whether the chat is standalone or
// embedded in data-fair.
const openReview = () => {
  const href = router.resolve({ path: `/${props.accountType}/${props.accountId}/traces/${props.conversationId}` }).href
  window.open(href, '_blank')
}
</script>

<style scoped>
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

.agent-chat__tools-panels :deep(.v-expansion-panel-title) {
  min-height: 28px;
}

.agent-chat__tools-panels :deep(.v-expansion-panel-text__wrapper) {
  padding: 4px 12px 8px;
}
</style>

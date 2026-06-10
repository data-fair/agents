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
      <v-btn
        :icon="mdiClose"
        variant="text"
        size="small"
        :title="t('close')"
        class="position-absolute"
        style="top: 8px; left: 8px; z-index: 1"
        @click="$emit('update:modelValue', false)"
      />
      <v-card-text class="flex-grow-1 pt-10 px-4">
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

        <v-window v-model="activeDebugTab">
          <v-window-item value="info">
            <div class="text-caption font-weight-bold mt-3 mb-1 px-2">
              {{ t('systemPrompt') }}
            </div>
            <pre class="agent-chat__pre pa-3">{{ systemPrompt }}</pre>

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

            <v-btn
              v-if="showReview"
              variant="tonal"
              size="small"
              :prepend-icon="mdiOpenInNew"
              class="mt-2"
              @click="openReview"
            >
              {{ t('openReview') }}
            </v-btn>
          </v-window-item>

          <v-window-item value="settings">
            <div class="pa-3">
              <v-switch
                v-if="traceStorageAvailable"
                :model-value="consentRef === 'yes'"
                :label="t('storeTraces')"
                color="primary"
                density="compact"
                hide-details
                @update:model-value="(v: boolean | null) => writeConsent(v ? 'yes' : 'no')"
              />
              <v-switch
                :model-value="toolExploration"
                color="primary"
                density="compact"
                hide-details
                :label="t('toolExploration')"
                class="mt-2"
                @update:model-value="$emit('update:toolExploration', $event ?? false)"
              />
              <p class="text-caption text-medium-emphasis mt-1">
                {{ t('toolExplorationHint') }}
              </p>
              <v-switch
                :model-value="moderationSelfTest"
                color="primary"
                density="compact"
                hide-details
                :label="t('moderationSelfTest')"
                class="mt-2"
                @update:model-value="$emit('update:moderationSelfTest', $event ?? false)"
              />
              <p class="text-caption text-medium-emphasis mt-1">
                {{ t('moderationSelfTestHint') }}
              </p>
            </div>
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
  systemPrompt: Prompt système
  tools: Outils
  noTools: Aucun outil enregistré
  inputSchema: Schéma d'entrée
  openReview: Ouvrir l'analyse
  settings: Paramètres
  storeTraces: Enregistrer mes conversations pour relecture
  toolExploration: Exploration des outils (expérimental)
  toolExplorationHint: "Masque les outils derrière un outil « explore_tools » que l'assistant appelle pour découvrir et activer les outils pertinents à la demande. Changer ce réglage réinitialise la conversation."
  moderationSelfTest: Modération en self-test (aperçu)
  moderationSelfTestHint: "Soumet vos propres messages à la modération comme pour un utilisateur externe, afin de prévisualiser l'expérience. N'affecte que votre navigateur ; n'enregistre ni évènement ni sanction."
en:
  close: Close
  info: Info
  systemPrompt: System Prompt
  tools: Tools
  noTools: No tools registered
  inputSchema: Input Schema
  openReview: Open review
  settings: Settings
  storeTraces: Store my conversations for review
  toolExploration: Tool exploration (experimental)
  toolExplorationHint: "Hides tools behind an 'explore_tools' tool the assistant calls to discover and enable relevant tools on demand. Changing this setting resets the conversation."
  moderationSelfTest: Moderation self-test (preview)
  moderationSelfTestHint: "Subjects your own messages to moderation like an external user, to preview the experience. Affects only your browser; records no events or strikes."
</i18n>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { mdiClose, mdiOpenInNew } from '@mdi/js'
import type { DebugToolsPartition } from '~/composables/use-agent-chat'
import { traceStorageAvailable, consentRef, writeConsent } from '~/traces/trace-consent'

const props = defineProps<{
  modelValue: boolean
  systemPrompt: string
  debugToolsPartition: DebugToolsPartition
  conversationId: string
  isAdmin?: boolean
  accountType: string
  accountId: string
  toolExploration?: boolean
  moderationSelfTest?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
  'update:toolExploration': [value: boolean]
  'update:moderationSelfTest': [value: boolean]
}>()

const { t } = useI18n()
const router = useRouter()

const activeDebugTab = ref('info')
const totalToolCount = computed(() => {
  const p = props.debugToolsPartition
  return p.mainTools.length + p.subAgents.reduce((sum, sa) => sum + sa.tools.length, 0)
})

const showReview = computed(() => !!props.isAdmin && traceStorageAvailable.value && consentRef.value === 'yes')

// Open the review in a new tab. `router.resolve(...).href` includes the app's
// base ('/agents'), so this works whether the chat is standalone or embedded in
// data-fair — and avoids relying on host navigation for a route the host doesn't have.
const openReview = () => {
  const href = router.resolve({ path: `/traces/${props.conversationId}/review` }).href
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

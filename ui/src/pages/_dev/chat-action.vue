<template>
  <v-app-bar
    flat
    :elevation="0"
  >
    <v-spacer />
    <personal-menu dark-mode-switch />
    <df-agent-chat-toggle />
  </v-app-bar>

  <df-agent-chat-drawer
    :src="chatSrc"
    :drawer-props="drawerProps"
  />

  <v-container>
    <h1 class="text-h5 mb-4">
      {{ t('title') }}
    </h1>
    <p class="text-body-2 text-medium-emphasis mb-4">
      {{ t('instructions') }}
    </p>

    <v-list>
      <v-list-item>
        <template #default>
          <div class="d-flex align-center">
            <span class="text-body-1">{{ t('createDataset') }}</span>
            <v-spacer />
            <df-agent-chat-action
              action-id="create-dataset"
              :visible-prompt="t('createDatasetPrompt')"
              :hidden-context="createDatasetContext"
              :title="t('askAssistant')"
            />
          </div>
        </template>
      </v-list-item>

      <v-list-item>
        <template #default>
          <div class="d-flex align-center">
            <span class="text-body-1">{{ t('configureProcessing') }}</span>
            <v-spacer />
            <df-agent-chat-action
              action-id="configure-processing"
              :visible-prompt="t('configureProcessingPrompt')"
              :hidden-context="configureProcessingContext"
              :title="t('askAssistant')"
            />
          </div>
        </template>
      </v-list-item>

      <v-list-item v-if="showDestroyable">
        <template #default>
          <div class="d-flex align-center">
            <span class="text-body-1">{{ t('destroyableAction') }}</span>
            <v-spacer />
            <df-agent-chat-action
              action-id="destroyable"
              :visible-prompt="t('destroyablePrompt')"
              :hidden-context="destroyableContext"
              :title="t('askAssistant')"
            />
          </div>
        </template>
      </v-list-item>
    </v-list>

    <v-btn
      class="mt-4"
      variant="tonal"
      color="primary"
      @click="showDestroyable = !showDestroyable"
    >
      {{ showDestroyable ? t('hideDestroyable') : t('showDestroyable') }}
    </v-btn>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  title: Test des boutons d'action agent
  instructions: Cliquez sur les boutons robot pour ouvrir une session contextuelle.
  createDataset: Créer un jeu de données
  createDatasetPrompt: Aide-moi à créer un nouveau jeu de données
  configureProcessing: Configurer un traitement
  configureProcessingPrompt: Aide-moi à configurer un traitement de données
  destroyableAction: Action temporaire
  destroyablePrompt: Aide-moi avec cette action temporaire
  askAssistant: Demander à l'assistant
  showDestroyable: Afficher l'action temporaire
  hideDestroyable: Masquer l'action temporaire
en:
  title: Agent action buttons test
  instructions: Click the robot buttons to open a contextual session.
  createDataset: Create a dataset
  createDatasetPrompt: Help me create a new dataset
  configureProcessing: Configure a processing
  configureProcessingPrompt: Help me configure a data processing
  destroyableAction: Temporary action
  destroyablePrompt: Help me with this temporary action
  askAssistant: Ask the assistant
  showDestroyable: Show temporary action
  hideDestroyable: Hide temporary action
</i18n>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DfAgentChatToggle, DfAgentChatDrawer, DfAgentChatAction } from '@data-fair/lib-vuetify-agents'
import { useFrameServer } from '@data-fair/lib-vue-agents'
import personalMenu from '@data-fair/lib-vuetify/personal-menu.vue'

const { t } = useI18n()

useFrameServer('parent')

const showDestroyable = ref(true)

const chatSrc = computed(() => {
  return `${window.location.origin}/agents/_dev/chat`
})

const createDatasetContext = `The user wants to create a new dataset on the Data Fair platform.
Relevant tools to focus on: dataset creation tools, file upload tools.
Guide the user through the dataset creation process step by step.`

const configureProcessingContext = `The user wants to configure a data processing pipeline.
Relevant tools to focus on: processing configuration tools, scheduling tools.
Ask about the data source, transformation steps, and output format.`

const destroyableContext = `This is a temporary action for testing the session-cleared flow.
Help the user with a generic task.`

const drawerProps = {
  class: 'border-secondary border-md border-e-0 border-b-0 border-opacity-100 rounded-ts-xl',
  style: 'overflow: hidden'
}
</script>

<template>
  <v-app-bar>
    <v-spacer />
  </v-app-bar>
  <v-container>
    <df-agent-chat
      :src="chatSrc"
      :drawer-props="drawerProps"
    />
    <h1 class="text-h5 mb-4">
      {{ t('title') }}
    </h1>
    <p class="text-body-2 text-medium-emphasis mb-4">
      {{ t('instructions') }}
    </p>
    <v-btn
      :color="pseudoToolRegistered ? 'success' : 'info'"
      variant="tonal"
      @click="togglePseudoTool"
    >
      {{ pseudoToolRegistered ? t('unregisterTool') : t('registerTool') }}
    </v-btn>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  title: Test du tiroir de chat
  instructions: Cliquez sur le bouton pour ouvrir le chat dans un tiroir.
  registerTool: Ajouter un outil de test
  unregisterTool: Retirer l'outil de test
en:
  title: Chat drawer test
  instructions: Click the floating button to open the chat in a drawer.
  registerTool: Add test tool
  unregisterTool: Remove test tool
</i18n>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DfAgentChat } from '@data-fair/lib-vuetify-agents'
import { useFrameServer } from '@data-fair/lib-vue-agents'

const { t } = useI18n()

const chatSrc = computed(() => {
  return `${window.location.origin}/agents/_dev/chat`
})

useFrameServer('parent')

const pseudoToolRegistered = ref(false)

function togglePseudoTool () {
  if (pseudoToolRegistered.value) {
    navigator.modelContext.unregisterTool('test_tool')
    pseudoToolRegistered.value = false
  } else {
    navigator.modelContext.registerTool({
      name: 'test_tool',
      description: 'A pseudo-tool for testing tools-changed notifications',
      inputSchema: { type: 'object', properties: {} },
      execute: () => ({ content: [{ type: 'text' as const, text: 'ok' }] })
    } as any)
    pseudoToolRegistered.value = true
  }
}

const drawerProps = {
  class: 'border-secondary border-md border-e-0 border-b-0 border-opacity-100 rounded-ts-xl',
  style: 'overflow: hidden'
}
</script>

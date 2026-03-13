<template>
  <v-container
    class="chat-iframe-2-container"
    fluid
  >
    <h1 class="text-h5 mb-2">
      {{ t('title') }}
    </h1>
    <p class="text-body-2 text-medium-emphasis mb-4">
      {{ t('instructions') }}
    </p>
    <v-row class="fill-height">
      <v-col
        cols="5"
        class="d-flex flex-column"
      >
        <p class="text-subtitle-2 mb-2">
          {{ t('toolsIframe') }}
        </p>
        <iframe
          :src="toolsIframeSrc"
          class="frame fill-height"
        />
      </v-col>

      <v-col
        cols="7"
        class="d-flex flex-column"
      >
        <p class="text-subtitle-2 mb-2">
          {{ t('chatIframe') }}
        </p>
        <iframe
          :src="chatIframeSrc"
          class="frame fill-height"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  title: Chat Iframe 2 - Iframes multiples
  instructions: "Le chat et les outils sont dans des iframes séparées. L'iframe de gauche expose l'outil set_data, l'iframe de droite contient le chat. Les outils sont découverts via BroadcastChannel. Demandez à l'agent: 'Définis les données à: Bonjour le monde'"
  toolsIframe: Iframe outils (expose set_data)
  chatIframe: Iframe chat (découvre les outils)
en:
  title: Chat Iframe 2 - Multiple Iframes
  instructions: "The chat and tools live in separate iframes. The left iframe exposes the set_data tool, the right iframe contains the chat. Tools are discovered via BroadcastChannel. Ask the agent: 'Set the data to: Hello World'"
  toolsIframe: Tools iframe (exposes set_data)
  chatIframe: Chat iframe (discovers tools)
</i18n>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const toolsIframeSrc = computed(() => {
  return `${window.location.origin}/_dev/chat-iframe-tools`
})

const chatIframeSrc = computed(() => {
  return `${window.location.origin}/_dev/chat-iframe-child`
})
</script>

<style scoped>
.chat-iframe-2-container {
  height: calc(100vh - 100px);
}

.frame {
  width: 100%;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
}
</style>

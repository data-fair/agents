<template>
  <v-app-bar
    flat
    :elevation="scrolled ? 2 : 0"
    :style="scrolled ? '' : 'background: transparent;'"
  >
    <v-spacer />
    <personal-menu dark-mode-switch />
  </v-app-bar>

  <v-container>
    <h1 class="text-h5 mb-4">
      {{ t('title') }}
    </h1>
    <p class="text-body-2 text-medium-emphasis mb-4">
      {{ t('instructions') }}
    </p>

    <v-card
      class="mb-4"
      style="height: 600px;"
    >
      <df-agent-chat-block
        :src="chatSrc"
        :system-prompt="devSystemPrompt"
      />
    </v-card>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  title: Test du bloc de chat
  instructions: Le chat est rendu à plat dans une carte de la page.
en:
  title: Chat block test
  instructions: The chat is rendered flat inside a card on the page.
</i18n>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { DfAgentChatBlock } from '@data-fair/lib-vuetify-agents'
import { useFrameServer } from '@data-fair/lib-vue-agents'
import personalMenu from '@data-fair/lib-vuetify/personal-menu.vue'

const { t } = useI18n()

const route = useRoute()
const devSystemPrompt = computed(() => route.query.systemPrompt as string | undefined)

const scrolled = ref(false)

function onScroll () {
  scrolled.value = window.scrollY > 0
}

onMounted(() => window.addEventListener('scroll', onScroll))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

const chatSrc = computed(() => {
  return `${window.location.origin}/agents/_dev/chat`
})

useFrameServer('parent')
</script>

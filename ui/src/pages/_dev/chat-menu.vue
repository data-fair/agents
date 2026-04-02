<template>
  <v-app-bar
    flat
    :elevation="scrolled ? 2 : 0"
    :style="scrolled ? '' : 'background: transparent;'"
  >
    <v-spacer />
    <v-btn
      variant="tonal"
      color="primary"
      class="mr-2"
      @click="dialogOpen = true"
    >
      Open dialog
    </v-btn>
    <personal-menu dark-mode-switch />
  </v-app-bar>

  <v-dialog
    v-model="dialogOpen"
    max-width="500"
  >
    <v-card>
      <v-card-title>Test dialog</v-card-title>
      <v-card-text>
        This dialog tests the integration of dialogs with the chat menu.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="primary"
          @click="dialogOpen = false"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <div style="position: fixed; bottom: 16px; right: 16px; z-index: 2500;">
    <df-agent-chat-menu
      :src="chatSrc"
      :menu-props="menuProps"
    />
  </div>

  <v-container>
    <h1 class="text-h5 mb-4">
      {{ t('title') }}
    </h1>
    <p class="text-body-2 text-medium-emphasis mb-4">
      {{ t('instructions') }}
    </p>
    <p class="text-body-1 mb-4">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
    </p>
    <p class="text-body-1 mb-4">
      Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.
    </p>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  title: Test du menu de chat
  instructions: Cliquez sur le bouton pour ouvrir le chat dans un menu.
en:
  title: Chat menu test
  instructions: Click the button to open the chat in a menu popup.
</i18n>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DfAgentChatMenu } from '@data-fair/lib-vuetify-agents'
import { useFrameServer } from '@data-fair/lib-vue-agents'
import personalMenu from '@data-fair/lib-vuetify/personal-menu.vue'

const { t } = useI18n()

const dialogOpen = ref(false)
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

const menuProps = {
  width: 450,
  height: 550,
  location: 'top end' as const
}
</script>

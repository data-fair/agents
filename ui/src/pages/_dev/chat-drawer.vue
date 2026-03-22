<template>
  <v-app-bar>
    <v-spacer />
    <personal-menu dark-mode-switch />
    <df-agent-chat
      :src="chatSrc"
      :drawer-props="drawerProps"
    />
  </v-app-bar>
  <v-container>
    <h1 class="text-h5 mb-4">
      {{ t('title') }}
    </h1>
    <p class="text-body-2 text-medium-emphasis mb-4">
      {{ t('instructions') }}
    </p>
    <p class="text-body-1 mb-4">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    </p>
    <p class="text-body-1 mb-4">
      Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula ut dictum pharetra, nisi nunc fringilla magna, in commodo elit erat nec turpis. Ut pharetra auctor leo.
    </p>
    <p class="text-body-1 mb-4">
      Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra. Vestibulum erat wisi, condimentum sed, commodo vitae, ornare sit amet, wisi.
    </p>
    <p class="text-body-1 mb-4">
      Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui. Donec non enim in turpis pulvinar facilisis. Ut felis. Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat. Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor, facilisis luctus, metus.
    </p>
    <p class="text-body-1 mb-4">
      Phasellus ultrices nulla quis nibh. Quisque a lectus. Donec consectetuer ligula vulputate sem tristique cursus. Nam nulla quam, gravida non, commodo a, sodales sit amet, nisi. Pellentesque fermentum dolor. Aliquam quam lectus, facilisis auctor, ultrices ut, elementum vulputate, nunc.
    </p>
    <p class="text-body-1 mb-4">
      Sed adipiscing ornare risus. Morbi est est, blandit sit amet, sagittis vel, euismod vel, velit. Pellentesque egestas sem. Suspendisse commodo ullamcorper magna. Ut nulla. Vivamus bibendum, nulla ut congue fringilla, lorem ipsum ultricies risus, ut rutrum velit tortor vel purus. In hac habitasse platea dictumst. Morbi vestibulum volutpat enim. Vivamus eu sem vitae dui convallis varius.
    </p>
    <p class="text-body-1 mb-4">
      Nunc auctor bibendum eros. Maecenas porta accumsan mauris. Etiam enim enim, elementum sed, bibendum quis, rhoncus non, metus. Fusce neque. Suspendisse faucibus, nunc et pellentesque egestas, lacus ante convallis tellus, vitae iaculis lacus elit id tortor. Vivamus aliquet elit ac nisl. Fusce fermentum odio nec arcu. Vivamus euismod mauris.
    </p>
    <p class="text-body-1 mb-4">
      In ut quam vitae odio lacinia tincidunt. Praesent ut ligula non mi varius sagittis. Cras sagittis. Praesent ac sem eget est egestas volutpat. Vivamus a tellus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Proin pharetra nonummy pede. Mauris et orci. Aenean nec lorem.
    </p>

    <df-navigation-right>
      <v-list-item>
        <v-btn
          width="100%"
          :color="pseudoToolRegistered ? 'success' : 'info'"
          variant="tonal"
          @click="togglePseudoTool"
        >
          {{ pseudoToolRegistered ? t('unregisterTool') : t('registerTool') }}
        </v-btn>
      </v-list-item>
    </df-navigation-right>
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
import personalMenu from '@data-fair/lib-vuetify/personal-menu.vue'
import DfNavigationRight from '@data-fair/lib-vuetify/navigation-right.vue'

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

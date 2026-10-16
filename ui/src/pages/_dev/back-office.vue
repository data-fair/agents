<template>
  <v-app-bar flat>
    <v-spacer />
    <df-agent-chat-toggle />
  </v-app-bar>
  <!-- The back office's chat panel: back-office mode, on the account the framed page is about. -->
  <df-agent-chat-drawer
    :account-type="accountType"
    :account-id="accountId"
    :agents="true"
  />
  <v-main>
    <!-- A page of this service, framed as the back office frames it: same origin, so same tab channel. -->
    <iframe
      :src="pageSrc"
      data-testid="back-office-page"
      style="width: 100%; height: 80vh; border: 0;"
    />
  </v-main>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { DfAgentChatToggle, DfAgentChatDrawer } from '@data-fair/lib-vuetify-agents'

/**
 * A stand-in for the data-fair back office: its chat panel beside one of this service's pages, so a
 * page can be tested opening the panel (OpenChatButton). `?page=` is the framed path under /agents,
 * and names the account the panel is on.
 */
const route = useRoute()
const page = computed(() => (route.query.page as string | undefined) ?? '/organization/test1')
const accountType = computed(() => page.value.split('/')[1])
const accountId = computed(() => page.value.split('/')[2])
const pageSrc = computed(() => `${window.location.origin}/agents${page.value}`)
</script>

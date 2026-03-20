<template>
  <AgentChat
    :account-type="session.account.value?.type ?? 'user'"
    :account-id="session.account.value?.id ?? ''"
    :debug="true"
  />
</template>

<script lang="ts" setup>
import AgentChat from '~/components/AgentChat.vue'
import { useSessionAuthenticated } from '@data-fair/lib-vue/session.js'

const session = useSessionAuthenticated()
</script>

<style scoped>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>

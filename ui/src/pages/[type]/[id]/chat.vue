<template>
  <div class="chat-page">
    <AgentChat
      :debug="debugEnabled"
      :title="chatTitle"
      :account-type="accountType"
      :account-id="accountId"
    />
  </div>
</template>

<i18n lang="yaml">
fr:
  defaultTitle: Assistant
en:
  defaultTitle: Assistant
</i18n>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useSession } from '@data-fair/lib-vue/session.js'
import AgentChat from '~/components/AgentChat.vue'

const { t } = useI18n()
const route = useRoute()
const session = useSession()

const accountType = computed(() => route.params.type as string)
const accountId = computed(() => route.params.id as string)

const chatTitle = computed(() => {
  return (route.query.title as string) || t('defaultTitle')
})

const debugEnabled = computed(() => {
  return session.state.user?.adminMode === 1
})
</script>

<style scoped>
.chat-page {
  height: 100vh;
  padding: 0;
  margin: 0;
}
</style>

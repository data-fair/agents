<template>
  <div class="chat-page">
    <AgentChat
      :is-admin="debugEnabled"
      :title="chatTitle"
      :agent-id="agentId"
      :narrow-viewport="narrowViewport"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { getAccountRole, useSession } from '@data-fair/lib-vue/session.js'
import AgentChat from '~/components/AgentChat.vue'

const { t } = useI18n()
const route = useRoute('/[type]/[id]/chat')
const session = useSession()

const accountType = computed(() => route.params.type as string)
const accountId = computed(() => route.params.id as string)

const chatTitle = useStringSearchParam('title', { default: t('defaultTitle') })
// Names an agent; it does NOT carry prose. The former `?systemPrompt=` on this route let anyone who
// could craft a link set the model's instructions — the sharpest form of the client-controlled
// instruction problem, since it needed no host application at all. An unknown id is refused by the
// server rather than resolved here.
const agentId = useStringSearchParam('agentId')

const narrowViewport = ref(window.innerWidth < 500)
onMounted(() => {
  const onResize = () => { narrowViewport.value = window.innerWidth < 500 }
  window.addEventListener('resize', onResize)
  onUnmounted(() => window.removeEventListener('resize', onResize))
})

const debugEnabled = computed(() => {
  return !!session.state.user?.isAdmin || (getAccountRole(session.state, { type: accountType.value as 'user' | 'organization', id: accountId.value }) === 'admin')
})
</script>

<style scoped>
.chat-page {
  height: 100vh;
  padding: 0;
  margin: 0;
}
</style>

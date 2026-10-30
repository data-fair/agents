<template>
  <div class="chat-page">
    <AgentChat
      :is-admin="debugEnabled"
      :title="chatTitle"
      :agent-id="agentId"
      :narrow-viewport="narrowViewport"
      :multi-agent="multiAgent"
      :account-type="accountType"
      :account-id="accountId"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { getAccountRole, useSession } from '@data-fair/lib-vue/session.js'
import AgentChat from '~/components/AgentChat.vue'

const route = useRoute('/[type]/[id]/chat')
const session = useSession()

const accountType = computed(() => route.params.type as string)
const accountId = computed(() => route.params.id as string)

// No default: a title the host did not choose must stay absent, so `AgentChat` can name an agent
// this page was pointed at (`?agentId=`) rather than always falling back to a generic "Assistant".
const chatTitle = useStringSearchParam('title')
// Names an agent; it does NOT carry prose. The former `?systemPrompt=` on this route let anyone who
// could craft a link set the model's instructions — the sharpest form of the client-controlled
// instruction problem, since it needed no host application at all. An unknown id is refused by the
// server rather than resolved here.
const agentId = useStringSearchParam('agentId')

// The back-office asks for the switcher; the front-office does not and keeps the mono-agent shape.
// A query parameter rather than a route of its own, because the two are the same chat: same socket,
// same transcript, same composer — only the window's chrome differs.
const agentsParam = useStringSearchParam('agents')
const multiAgent = computed(() => agentsParam.value === '1' || agentsParam.value === 'true')

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

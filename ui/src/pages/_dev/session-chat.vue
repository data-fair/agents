<template>
  <v-container
    class="session-chat-container"
    fluid
  >
    <v-row class="fill-height">
      <v-col
        cols="5"
        class="d-flex flex-column"
      >
        <h1 class="text-headline-small mb-2">
          Session chat (server-side loop)
        </h1>
        <p class="text-body-medium text-medium-emphasis mb-4">
          The loop runs on the API server. This page only registers its WebMCP tools and serves the
          calls the loop makes against them.
        </p>
        <v-textarea
          v-model="toolData"
          label="Data"
          placeholder="Data set by the agent will appear here..."
          rows="6"
          variant="outlined"
          readonly
          data-testid="tool-data"
        />
        <div
          class="text-body-small"
          data-testid="session-state"
          :data-connected="connected ? 'yes' : 'no'"
          :data-attached="attached ? 'yes' : 'no'"
          :data-first-token-ms="firstTokenMs ?? ''"
          :data-tool-calls="toolCalls"
          :data-tools="Object.keys(pageTools).length"
          :data-tool-chips="toolChips.join(',')"
          :data-saw-pending="sawPending ? 'yes' : 'no'"
        >
          connected: {{ connected }} · attached: {{ attached }} ·
          first token: {{ firstTokenMs === undefined ? '—' : firstTokenMs + ' ms' }} ·
          page tools: {{ Object.keys(pageTools).length }} · page tool calls: {{ toolCalls }} ·
          tools used: {{ toolChips.join(', ') || '—' }}
        </div>
      </v-col>

      <v-col
        cols="7"
        class="d-flex flex-column"
      >
        <v-card
          class="flex-grow-1 mb-2 pa-3"
          variant="outlined"
          style="overflow-y: auto; white-space: pre-wrap;"
          data-testid="transcript"
        >
          <div
            v-for="(turn, index) of turns"
            :key="index"
            class="mb-3"
          >
            <strong>{{ turn.role }}</strong>
            <div :data-testid="turn.role === 'assistant' ? 'assistant-text' : 'user-text'">
              {{ turn.text }}
            </div>
          </div>
        </v-card>
        <v-textarea
          v-model="draft"
          label="Message"
          rows="2"
          variant="outlined"
          hide-details
          data-testid="composer"
          @keydown.enter.exact.prevent="send"
        />
        <v-btn
          class="mt-2"
          :disabled="!attached || !draft.trim()"
          data-testid="send"
          @click="send"
        >
          Send
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
/**
 * A development page for the server-side loop.
 *
 * It exists to make the prototype observable in a real browser, and to measure first-token latency
 * against the gateway path. It uses `useAgentSession` DIRECTLY rather than going through
 * `use-agent-chat`: that composable still owns sub-agents, host events and tool exploration, which move
 * server-side in §4.6 and §4.7 of the design, so porting it now would leave it half-migrated.
 *
 * What this page proves is the whole browser half: the page registers WebMCP tools, the aggregator
 * discovers them exactly as today, their descriptors go up the socket, and the loop running on the
 * server calls them — operating this page from the other end of the connection.
 */
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAgentTool, useFrameServer, getTabChannelId } from '@data-fair/lib-vue-agents'
import { useSessionAuthenticated } from '@data-fair/lib-vue/session.js'
import { FrameClientAggregator } from '~/transports/frame-client-aggregator'
import { useAgentSession } from '~/composables/use-agent-session'
import { autonomousAgentMessageToChat } from '~/utils/autonomous-agent-chat-message'
import { $apiPath, $fetch } from '~/context'
import type { Tool } from 'ai'

const session = useSessionAuthenticated()

const toolData = ref('')
const toolCalls = ref(0)
const draft = ref('')
const turns = ref<Array<{ role: 'user' | 'assistant', text: string }>>([])
const firstTokenMs = ref<number | undefined>()
const toolChips = ref<string[]>([])
/**
 * Whether structure arrived WHILE the turn was running.
 *
 * Without it a transcript that only updated at the end would look identical in a test to a live one —
 * which is exactly how the first version of the e2e assertion passed with the in-turn frame removed.
 */
const sawPending = ref(false)

/** The page's own WebMCP tools, discovered by the aggregator exactly as the in-browser loop does. */
const pageTools = ref<Record<string, Tool>>({})
let aggregator: FrameClientAggregator | null = null

useFrameServer('self')

const agent = useAgentSession({
  url: `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}${$apiPath}/agent-session`,
  tools: pageTools,
  onDelta: (kind, text) => {
    if (kind !== 'text') return
    // The measurement §7 asks for: from pressing send to the first token arriving.
    if (firstTokenMs.value === undefined && sentAt !== undefined) firstTokenMs.value = Math.round(performance.now() - sentAt)
    const last = turns.value[turns.value.length - 1]
    if (last?.role === 'assistant') last.text += text
    else turns.value.push({ role: 'assistant', text })
  },
  // The STRUCTURE of the turn, rendered through the same mapper a reopened thread uses. Here it is
  // reduced to a list of tool chips, which is what a transcript needs beyond the text — the real chat
  // renders the full ChatMessage this produces.
  onMessage: message => {
    if (message.pending) sawPending.value = true
    const chat = autonomousAgentMessageToChat({ seq: message.seq, role: message.role, parts: message.parts as any, pending: message.pending })
    toolChips.value = (chat.toolInvocations ?? []).map(invocation => `${invocation.toolName}:${invocation.state}`)
  },
  onError: message => { turns.value.push({ role: 'assistant', text: `[error] ${message}` }) }
})

const connected = computed(() => agent.connected.value)
const attached = computed(() => agent.attached.value)

let sentAt: number | undefined

const send = () => {
  const content = draft.value.trim()
  if (!content) return
  turns.value.push({ role: 'user', text: content })
  draft.value = ''
  firstTokenMs.value = undefined
  sentAt = performance.now()
  agent.prompt(content)
}

onMounted(async () => {
  useAgentTool({
    name: 'set_data',
    title: 'Data',
    description: 'Set the data in the textarea on this page',
    inputSchema: {
      type: 'object',
      properties: { data: { type: 'string' } },
      required: ['data']
    } as any,
    execute: (args: { data: string }) => {
      toolData.value = args.data
      toolCalls.value++
      return { success: true, message: 'Data set successfully!' }
    }
  } as any)

  // The same aggregator the in-browser loop uses. Its output is the cut point: descriptors go up the
  // socket, implementations stay here.
  aggregator = new FrameClientAggregator({
    // The PER-TAB channel, not the default one. `useFrameServer` announces on the tab's channel so two
    // tabs of the same app do not aggregate each other's tools — an aggregator on the default channel
    // simply never hears the page it is in, which is how this page first reported zero tools.
    channelId: getTabChannelId(),
    onToolsChanged: tools => {
      pageTools.value = tools
      agent.toolsChanged()
    }
  })
  aggregator.start()

  // A conversation with the PERSONAL assistant, created over HTTP before the socket binds to it.
  const account = session.account.value
  const conversation = await $fetch(`${$apiPath}/conversations/${account?.type}/${account?.id}`, {
    method: 'POST',
    body: { agentId: 'personal', title: 'dev session chat' }
  })
  agent.connect(conversation.id)
})

onUnmounted(() => {
  agent.close()
  aggregator?.close().catch(() => {})
})
</script>

<style scoped>
.session-chat-container {
  height: calc(100vh - 100px);
}
</style>

/**
 * Holds one autonomous agent conversation for a page: the messages, the version cursor that keeps
 * them current, and the websocket subscription that says when to look again.
 *
 * The cursor is the only sync mechanism. A notification carries `{conversationId, version}` and
 * nothing else, so it is treated purely as "fetch now" — never as data. That is deliberate: the
 * server publishes no content, so a subscriber whose grant was revoked while its socket stayed
 * open learns only that something changed, and every fetch re-checks authorization.
 */

import { computed, onScopeDispose, ref, watch } from 'vue'
import { $apiPath, $fetch } from '~/context'
import { conversationChannel } from '@agents/shared/autonomous-agent-channel'
import { autonomousAgentMessagesToChat, mergeBySeq, type StoredAutonomousAgentMessage } from '~/utils/autonomous-agent-chat-message'
import useWS from '@data-fair/lib-vue/ws.js'

export interface AutonomousAgentConversationOptions {
  accountType: string
  accountId: string
  conversationId: string
}

export function useAutonomousAgentConversation (opts: AutonomousAgentConversationOptions) {
  const messages = ref<StoredAutonomousAgentMessage[]>([])
  const version = ref(0)
  const error = ref<string | null>(null)
  const posting = ref(false)

  const base = `${$apiPath}/autonomous-agent-conversations/${opts.accountType}/${opts.accountId}/${opts.conversationId}`

  let inFlight: Promise<void> | null = null
  let requestedAgain = false

  const refresh = async (): Promise<void> => {
    // Serialised: a burst of notifications during a streaming turn would otherwise start several
    // overlapping fetches whose responses could apply out of order.
    //
    // But a request arriving mid-fetch must NOT simply join the one in progress: that fetch already
    // read the server before the change it is being told about, so joining it would silently drop
    // the update — and after the LAST notification of a turn nothing else would ever arrive to
    // recover it, leaving the thread permanently stale. Mark it and run once more instead.
    if (inFlight) {
      requestedAgain = true
      return await inFlight
    }
    inFlight = (async () => {
      try {
        // Omit the parameter entirely on a cold start, so the first load gets the whole thread.
        const query = version.value ? `?sinceVersion=${version.value}` : ''
        const res = await $fetch<{ results: StoredAutonomousAgentMessage[], version: number }>(`${base}/messages${query}`, { credentials: 'include' })
        messages.value = mergeBySeq(messages.value, res.results ?? [])
        // The cursor comes from the RESPONSE, never from the messages received: when the last
        // change was a run transition no message comes back, and deriving it would stall the
        // cursor and make every later fetch re-deliver the same rows.
        if (typeof res.version === 'number') version.value = res.version
        error.value = null
      } catch (err: any) {
        error.value = err?.data?.message ?? err?.message ?? 'unknown error'
      } finally {
        inFlight = null
      }
    })()
    await inFlight
    if (requestedAgain) {
      requestedAgain = false
      await refresh()
    }
  }

  const post = async (content: string): Promise<void> => {
    posting.value = true
    try {
      await $fetch(`${base}/messages`, { method: 'POST', body: { content }, credentials: 'include' })
      await refresh()
    } catch (err: any) {
      error.value = err?.data?.message ?? err?.message ?? 'unknown error'
    } finally {
      posting.value = false
    }
  }

  // The ws server is attached to the api's http server, which nginx serves under /agents/api —
  // /agents alone reaches the UI dev server instead.
  const ws = useWS($apiPath)
  const channel = conversationChannel(opts.conversationId)
  // Fire-and-forget by design: refresh() swallows its own errors into `error`.
  const onNotification = () => { refresh().catch(() => {}) }
  ws?.subscribe(channel, onNotification)

  // reconnecting-websocket re-sends its subscribe frames on reconnect, but notifications published
  // while the socket was down are simply gone — so catch up from the stored cursor before trusting
  // it again. This is also what re-runs the server's authorization check with a fresh cookie.
  if (ws) {
    watch(ws.opened, (opened, wasOpened) => {
      if (opened && wasOpened === false) refresh().catch(() => {})
    })
  }

  /**
   * Fallback while NOT connected.
   *
   * useWS returns undefined without window.WebSocket, and reconnecting-websocket keeps failing when a
   * proxy refuses the Upgrade — a per-deployment hazard. In that state the page would do one fetch
   * and then nothing: the user posts, the answer never appears, and nothing says why. Polling only
   * while disconnected does not contradict the design (which rules out polling while connected).
   */
  const poll = setInterval(() => {
    if (ws?.opened.value) return
    refresh().catch(() => {})
  }, 5000)

  onScopeDispose(() => {
    clearInterval(poll)
    ws?.unsubscribe(channel, onNotification)
  })

  return {
    messages,
    chatMessages: computed(() => autonomousAgentMessagesToChat(messages.value)),
    // A pending assistant message carries the text produced so far, so this needs no second
    // request and cannot disagree with what is rendered.
    isStreaming: computed(() => messages.value.some(message => message.pending)),
    version,
    error,
    posting,
    connected: computed(() => ws?.opened.value ?? false),
    refresh,
    post
  }
}

/**
 * Pure helpers for the chat transcript's stick-to-bottom autoscroll and
 * sub-agent panel auto-open. Kept free of Vue/DOM (and of any `~` alias import)
 * so they can be unit-tested directly by the node test runner.
 *
 * `ScrollMessage` is a structural subset of `ChatMessage` (from
 * `~/composables/use-agent-chat`): the real type is assignable to it, so the
 * component can pass its `ChatMessage[]` straight in.
 */
export interface ScrollMessage {
  content: string
  toolInvocations?: { toolName: string }[]
  subAgentPanels?: Record<string, { messages: ScrollMessage[] }>
}

/**
 * Total length of everything that streams into the transcript tail: top-level
 * message text, tool-invocation chips, and nested sub-agent message text/chips.
 *
 * This is the growth signal for useAutoScrollBottom — it must change whenever
 * the rendered height grows. In particular it has to keep moving while a
 * sub-agent streams: during that phase the parent message's own `content` is
 * static and only `subAgentPanels` grows, so a signal based on the parent
 * content alone would freeze and autoscroll would stop following.
 */
export function streamedLength (messages: ScrollMessage[]): number {
  let total = messages.length
  for (const message of messages) {
    total += message.content.length
    total += message.toolInvocations?.length ?? 0
    for (const panel of Object.values(message.subAgentPanels ?? {})) {
      for (const sub of panel.messages) {
        total += sub.content.length
        total += sub.toolInvocations?.length ?? 0
      }
    }
  }
  return total
}

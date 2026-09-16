/**
 * Facts derived from a recorded run, handed to the judge as evidence.
 *
 * Nothing here scores anything. There is no threshold, no enum, no pass mark —
 * a metric that decided whether a run was good would narrow the judge's
 * attention to the things that happen to be countable, which is the opposite of
 * what the judge is for. These exist because a few quantities are tedious and
 * error-prone to count by reading a transcript, and two of them are outright
 * traps: `toolCalls` is cumulative, and a sub-agent's requests are interleaved
 * with the lead's.
 */
import type { Transcript } from './types.ts'
import type { GatewayExchange } from './gateway-capture.ts'

export type RunMetrics = {
  /** Messages the person actually sent. */
  userMessages: number
  assistantBubbles: number
  /** Bubbles that rendered no text — the assistant used tools and said nothing. */
  emptyAssistantBubbles: number
  avgVisibleReplyChars: number | null
  /** Requests to the gateway, every conversation included. */
  modelRequests: number
  mainRequests: number
  subAgentRequests: number
  /** `modelRequests / userMessages`, to one decimal; null when nobody spoke. */
  requestsPerUserMessage: number | null
  /** The biggest task prompt handed to a sub-agent; null when none ran. */
  largestSubAgentTaskChars: number | null
  /** Tool calls issued twice with identical arguments, across every conversation. */
  duplicateToolCalls: number
  /** Characters the host injected as `<host-state>` / `<host-events>` blocks;
   *  null for a run recorded before the capture measured them. */
  hostBlockChars: number | null
}

const signature = (e: GatewayExchange) => JSON.stringify([...e.toolNames].sort())

/**
 * Split the gateway record back into the conversations that produced it.
 *
 * One conversation's `messageCount` only ever grows; a sub-agent starts a fresh
 * one at 2 while the lead is already deep, and the lead then resumes. The tool
 * set is a hint rather than the rule, because page tools come and go with the
 * route — a recorded lead went 14 to 19 to 26 tools without ever restarting.
 */
function splitConversations (gateway: GatewayExchange[]): GatewayExchange[][] {
  // `streams` is kept in most-recently-used order, so `opened` is what restores
  // the order the conversations actually started in — which is what makes the
  // first one the lead's.
  const streams: Array<{ exchanges: GatewayExchange[], last: number, tools: string, opened: number }> = []

  for (const exchange of gateway) {
    // Most recently used first: when the tool set gives no answer, the lead is
    // the stream that spoke last.
    const open = streams.filter(s => s.last < exchange.messageCount).reverse()
    const target = open.find(s => s.tools === signature(exchange)) ?? open[0]
    if (target) {
      target.exchanges.push(exchange)
      target.last = exchange.messageCount
      target.tools = signature(exchange)
      // Move to the back, so "most recently used" stays true.
      streams.splice(streams.indexOf(target), 1)
      streams.push(target)
    } else {
      streams.push({ exchanges: [exchange], last: exchange.messageCount, tools: signature(exchange), opened: streams.length })
    }
  }
  return [...streams].sort((a, b) => a.opened - b.opened).map(s => s.exchanges)
}

/** Within one conversation the tool-call list is cumulative, so the longest is the whole of it. */
function finalToolCalls (stream: GatewayExchange[]): GatewayExchange['toolCalls'] {
  let longest: GatewayExchange['toolCalls'] = []
  for (const e of stream) if (e.toolCalls.length > longest.length) longest = e.toolCalls
  return longest
}

function countDuplicates (calls: GatewayExchange['toolCalls']): number {
  const seen = new Set(calls.map(c => JSON.stringify([c.name, c.arguments])))
  return calls.length - seen.size
}

export function computeMetrics (transcript: Transcript): RunMetrics {
  const userMessages = transcript.conversation.filter(m => m.role === 'user').length
  const assistant = transcript.conversation.filter(m => m.role === 'assistant')
  const visible = assistant.filter(m => m.text.trim().length > 0)

  const conversations = splitConversations(transcript.gateway)
  // The first request of a run answers the person's first message, so the
  // conversation it opened is the lead's; every other one is a sub-agent.
  const [main = [], ...subAgents] = conversations
  const subAgentExchanges = subAgents.flat()

  const measuredHostBlocks = transcript.gateway.some(e => typeof e.hostBlockChars === 'number')

  return {
    userMessages,
    assistantBubbles: assistant.length,
    emptyAssistantBubbles: assistant.length - visible.length,
    avgVisibleReplyChars: visible.length
      ? Math.round(visible.reduce((sum, m) => sum + m.text.trim().length, 0) / visible.length)
      : null,
    modelRequests: transcript.gateway.length,
    mainRequests: main.length,
    subAgentRequests: subAgentExchanges.length,
    requestsPerUserMessage: userMessages
      ? Math.round((transcript.gateway.length / userMessages) * 10) / 10
      : null,
    largestSubAgentTaskChars: subAgentExchanges.length
      ? Math.max(...subAgentExchanges.map(e => e.lastUserMessage.length))
      : null,
    duplicateToolCalls: conversations.reduce((sum, s) => sum + countDuplicates(finalToolCalls(s)), 0),
    hostBlockChars: measuredHostBlocks
      // Cumulative like the history, so a conversation's last request holds its total.
      ? conversations.reduce((sum, s) => sum + Math.max(0, ...s.map(e => e.hostBlockChars ?? 0)), 0)
      : null
  }
}

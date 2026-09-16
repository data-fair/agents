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
  /**
   * Bubbles that rendered no prose. Almost always a tool-call bubble, which DOES
   * render a chip naming the tool on screen — so this is not a count of silence,
   * and three judges in a row misread it as one. What it measures is how much of
   * a run the person watched as tool names rather than sentences.
   */
  textlessAssistantBubbles: number
  avgVisibleReplyChars: number | null
  /** Requests to the gateway, every conversation included. */
  modelRequests: number
  /** The role that served the person's own conversation (the first request's). */
  leadModel: string
  leadRequests: number
  nonLeadRequests: number
  /**
   * Requests per model role, when the record names one. This is the authority:
   * inferring roles from message counts reported three `summarizer` compaction
   * calls as sub-agent dispatches in a run that made no sub-agent call at all.
   * Null when no request carries a role, where the interleaving split is all
   * there is.
   */
  requestsByModel: Record<string, number> | null
  /** `modelRequests / userMessages`, to one decimal; null when nobody spoke. */
  requestsPerUserMessage: number | null
  /** The biggest prompt handed to a role other than the lead's, and which role
   *  took it; null when every request was the lead's. A summarizer legitimately
   *  carries the conversation, so read the role before reading the size. */
  largestNonLeadPromptChars: number | null
  largestNonLeadPromptModel: string | null
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

  // Prefer what the record says over what the shape implies.
  const roled = transcript.gateway.filter(e => e.model)
  const leadModel = transcript.gateway[0]?.model ?? ''
  const requestsByModel = roled.length
    ? roled.reduce<Record<string, number>>((acc, e) => { acc[e.model] = (acc[e.model] ?? 0) + 1; return acc }, {})
    : null

  const conversations = splitConversations(transcript.gateway)
  let lead: GatewayExchange[]
  let nonLead: GatewayExchange[]
  if (requestsByModel && leadModel) {
    lead = transcript.gateway.filter(e => e.model === leadModel)
    nonLead = transcript.gateway.filter(e => e.model !== leadModel)
  } else {
    // No role in the record: the first request answers the person's first
    // message, so the conversation it opened is the lead's.
    const [first = [], ...rest] = conversations
    lead = first
    nonLead = rest.flat()
  }
  const biggest = nonLead.reduce<GatewayExchange | null>(
    (best, e) => (!best || e.lastUserMessage.length > best.lastUserMessage.length ? e : best), null)

  const measuredHostBlocks = transcript.gateway.some(e => typeof e.hostBlockChars === 'number')

  return {
    userMessages,
    assistantBubbles: assistant.length,
    textlessAssistantBubbles: assistant.length - visible.length,
    avgVisibleReplyChars: visible.length
      ? Math.round(visible.reduce((sum, m) => sum + m.text.trim().length, 0) / visible.length)
      : null,
    modelRequests: transcript.gateway.length,
    leadModel,
    leadRequests: lead.length,
    nonLeadRequests: nonLead.length,
    requestsByModel,
    requestsPerUserMessage: userMessages
      ? Math.round((transcript.gateway.length / userMessages) * 10) / 10
      : null,
    largestNonLeadPromptChars: biggest ? biggest.lastUserMessage.length : null,
    largestNonLeadPromptModel: biggest ? (biggest.model || null) : null,
    duplicateToolCalls: conversations.reduce((sum, s) => sum + countDuplicates(finalToolCalls(s)), 0),
    hostBlockChars: measuredHostBlocks
      // Cumulative like the history, so a conversation's last request holds its total.
      ? conversations.reduce((sum, s) => sum + Math.max(0, ...s.map(e => e.hostBlockChars ?? 0)), 0)
      : null
  }
}

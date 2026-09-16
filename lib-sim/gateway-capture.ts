/**
 * The evidence a run is judged on.
 *
 * Requests to the gateway carry the full message array AND the tool definitions
 * the page registered, so they show what the assistant was actually offered and
 * what it did with it — including sub-agent turns and compaction. The rendered
 * DOM only shows what survived to the screen.
 */
import type { Page } from '@playwright/test'

export type GatewayExchange = {
  at: number
  model: string
  toolNames: string[]
  messageCount: number
  lastUserMessage: string
  /** Tool calls are cumulative over the conversation so far, because the chat-completions
   * protocol resends the entire message history on every request. Exchange N contains
   * every tool call from turns 1..N, not just that turn's calls. This ensures the evidence
   * shows the complete instruction context the assistant saw.
   */
  toolCalls: Array<{ name: string, arguments: string }>
  /** Characters the application injected as `<host-state>` / `<host-events>` /
   * `<hidden-context>` blocks, across every message of this request. They land in
   * tool results and hidden context, neither of which survives into this summary,
   * so the size of what the host reports can only be measured here. Cumulative
   * like the history, so the last request of a conversation carries its total.
   */
  hostBlockChars: number
  /** What each tool ANSWERED, paired with the call that asked. Cumulative like
   * `toolCalls`. Without these a judge sees only what the assistant asked a tool
   * and can never check a claim about the answer against it — "the form data is
   * valid and saved" was unfalsifiable in a recorded run for exactly this reason.
   * Each result is capped: one large payload must not swallow the evidence file.
   */
  toolResults: Array<{ id: string, name: string, result: string }>
  /** When true, this exchange was received but postData could not be parsed. Evidence of
   * a failed capture rather than an absent request.
   */
  unparsed?: true
}

export const TOOL_RESULT_MAX_CHARS = 2000

const HOST_BLOCKS = ['host-state', 'host-events', 'hidden-context']

/** Only closed blocks count: an unterminated open tag would otherwise swallow
 *  the whole rest of the message and report it as host overhead. */
export function countHostBlockChars (messages: unknown[]): number {
  let total = 0
  for (const message of messages) {
    const content = (message as { content?: unknown })?.content
    const text = typeof content === 'string' ? content : JSON.stringify(content ?? '')
    for (const name of HOST_BLOCKS) {
      const open = `<${name}>`
      const close = `</${name}>`
      let from = 0
      for (;;) {
        const start = text.indexOf(open, from)
        if (start === -1) break
        const end = text.indexOf(close, start)
        if (end === -1) break
        total += end + close.length - start
        from = end + close.length
      }
    }
  }
  return total
}

type Body = {
  model?: string
  messages?: Array<{
    role?: string
    content?: unknown
    tool_call_id?: string
    tool_calls?: Array<{ id?: string, function?: { name?: string, arguments?: string } }>
  }>
  tools?: Array<{ function?: { name?: string } }>
}

function renderToolResult (content: unknown): string {
  const text = typeof content === 'string' ? content : JSON.stringify(content ?? '')
  return text.length <= TOOL_RESULT_MAX_CHARS ? text : text.slice(0, TOOL_RESULT_MAX_CHARS) + '…[truncated]'
}

export function extractToolResults (messages: NonNullable<Body['messages']>) {
  // The call that asked may live in any earlier message, so the name is looked
  // up by id across the whole history rather than by adjacency.
  const names = new Map<string, string>()
  for (const m of messages) {
    for (const call of m.tool_calls ?? []) {
      if (call.id) names.set(call.id, call.function?.name ?? '')
    }
  }
  return messages
    .filter(m => m.role === 'tool')
    .map(m => ({
      id: m.tool_call_id ?? '',
      // An unpaired result is still evidence; recording it nameless beats dropping it.
      name: names.get(m.tool_call_id ?? '') ?? '',
      result: renderToolResult(m.content)
    }))
}

function extractUserMessageText (content: unknown): string {
  if (typeof content === 'string') return content
  if (content === null || content === undefined) return ''
  if (Array.isArray(content)) {
    const texts = content
      .filter((part: unknown) => typeof part === 'object' && part !== null && (part as Record<string, unknown>).type === 'text')
      .map((part: unknown) => (part as Record<string, unknown>).text)
      .filter((text: unknown) => typeof text === 'string')
    if (texts.length > 0) return (texts as string[]).join(' ')
    if (content.length > 0) return JSON.stringify(content)
  }
  return ''
}

export function summariseRequest (body: unknown): GatewayExchange | null {
  if (typeof body !== 'object' || body === null) return null
  const b = body as Body
  if (!Array.isArray(b.messages)) return null

  const users = b.messages.filter(m => m.role === 'user')
  const last = users[users.length - 1]
  return {
    at: Date.now(),
    model: b.model ?? '',
    toolNames: (b.tools ?? []).map(t => t.function?.name ?? '').filter(Boolean),
    messageCount: b.messages.length,
    lastUserMessage: extractUserMessageText(last?.content),
    hostBlockChars: countHostBlockChars(b.messages),
    toolResults: extractToolResults(b.messages),
    toolCalls: b.messages.flatMap(m => (m.tool_calls ?? []).map(c => ({
      name: c.function?.name ?? '',
      arguments: c.function?.arguments ?? ''
    })))
  }
}

export function captureGateway (page: Page): GatewayExchange[] {
  const exchanges: GatewayExchange[] = []
  page.on('request', req => {
    if (!req.url().includes('/v1/chat/completions')) return
    let parsed: unknown
    try { parsed = JSON.parse(req.postData() ?? '') } catch {
      exchanges.push({
        at: Date.now(),
        model: '',
        toolNames: [],
        messageCount: 0,
        lastUserMessage: '',
        toolCalls: [],
        hostBlockChars: 0,
        toolResults: [],
        unparsed: true
      })
      return
    }
    const summary = summariseRequest(parsed)
    if (summary) exchanges.push(summary)
  })
  return exchanges
}

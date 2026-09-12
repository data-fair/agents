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
  toolCalls: Array<{ name: string, arguments: string }>
}

type Body = {
  model?: string
  messages?: Array<{ role?: string, content?: unknown, tool_calls?: Array<{ function?: { name?: string, arguments?: string } }> }>
  tools?: Array<{ function?: { name?: string } }>
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
    lastUserMessage: typeof last?.content === 'string' ? last.content : '',
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
    try { parsed = JSON.parse(req.postData() ?? '') } catch { return }
    const summary = summariseRequest(parsed)
    if (summary) exchanges.push(summary)
  })
  return exchanges
}

/**
 * What the simulated user can perceive and do.
 *
 * Three tools, shaped like a person rather than like a test framework: look at
 * the screen, click something by its visible name, type into a named field.
 * There is deliberately no evaluate, no raw selector and no DOM access — a
 * persona that can run JavaScript verifies outcomes no human could, which would
 * make verdicts wrongly optimistic in exactly the way a blind persona makes them
 * wrongly pessimistic.
 *
 * The handlers run in-process against the runner's live Playwright roots, so
 * there is one browser and one page. Every call is recorded as an observation,
 * because a judge cannot otherwise tell a real complaint from an invented one.
 *
 * `click` and `type` also accept an `offLimits` list of names (e.g. the chat
 * composer's own input/send/stop): a request naming one is refused, structurally,
 * before the element is even looked up, instead of relying on an instruction the
 * persona is free to ignore. This is what keeps "look and act freely, but talk by
 * replying" (spec §3) an invariant rather than a suggestion.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'

export const MCP_SERVER_NAME = 'page'
export const SNAPSHOT_CAP = 4000

export type PerceptionRoot = { label: string, root: any }
export type Observation = { turn: number, tool: string, args: unknown, result: string }

export type PagePerception = {
  server: { type: 'sdk', name: string, instance: unknown, alwaysLoad: true }
  observations: Observation[]
  setTurn: (turn: number) => void
  toolNames: string[]
  call: (tool: string, args: Record<string, unknown>) => Promise<string>
}

export function truncate (text: string): string {
  return text.length <= SNAPSHOT_CAP ? text : text.slice(0, SNAPSHOT_CAP) + '…[truncated]'
}

const TOOLS = [
  {
    name: 'look',
    description: 'Look at the screen. Returns what is currently visible, as an accessibility outline of the page. Use this before saying anything about what you can or cannot see.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'click',
    description: 'Click something by the visible text or label on it, exactly as a person would point at it.',
    inputSchema: { type: 'object', properties: { name: { type: 'string', description: 'The visible text or accessible name of what to click' } }, required: ['name'] }
  },
  {
    name: 'type',
    description: 'Type into a field identified by its visible label.',
    inputSchema: { type: 'object', properties: { name: { type: 'string' }, text: { type: 'string' } }, required: ['name', 'text'] }
  }
]

export function createPagePerception (roots: PerceptionRoot[], opts: { offLimits?: string[] } = {}): PagePerception {
  const observations: Observation[] = []
  let turn = 0

  // Equality, not substring: the persona copies names verbatim out of the aria
  // snapshot it just looked at, so an exact (trimmed, case-insensitive) match is
  // enough to catch it — while substring matching on a short off-limits word
  // like "Send" would also block an unrelated "Send report" button.
  const offLimits = new Set((opts.offLimits ?? []).map(n => n.trim().toLowerCase()))
  const isOffLimits = (name: string) => offLimits.has(name.trim().toLowerCase())
  const OFF_LIMITS_RESULT = 'the composer is not yours to operate — reply with your message and the runner will send it for you'

  const look = async () => {
    const parts: string[] = []
    for (const { label, root } of roots) {
      let snap = ''
      try { snap = await root.locator('body').ariaSnapshot() } catch (err) {
        snap = `(could not read: ${err instanceof Error ? err.message : String(err)})`
      }
      parts.push(`## ${label}\n${snap}`)
    }
    return truncate(parts.join('\n\n'))
  }

  const firstMatch = async (finders: Array<() => any>) => {
    for (const find of finders) {
      try {
        const loc = find()
        if (await loc.count() > 0) return loc
      } catch { /* a finder that throws simply does not match */ }
    }
    return null
  }

  const click = async (name: string) => {
    if (isOffLimits(name)) return OFF_LIMITS_RESULT
    for (const { root } of roots) {
      const loc = await firstMatch([
        () => root.getByRole('button', { name }).first(),
        () => root.getByRole('link', { name }).first(),
        () => root.getByText(name).first()
      ])
      if (loc) {
        try {
          await loc.click()
          return `clicked "${name}"`
        } catch (err) {
          return `could not click "${name}": ${err instanceof Error ? err.message : String(err)}`
        }
      }
    }
    return `could not find anything called "${name}" to click`
  }

  const type = async (name: string, text: string) => {
    if (isOffLimits(name)) return OFF_LIMITS_RESULT
    for (const { root } of roots) {
      const loc = await firstMatch([
        () => root.getByRole('textbox', { name }).first(),
        () => root.getByLabel(name).first()
      ])
      if (loc) {
        try {
          await loc.fill(text)
          return `typed into "${name}"`
        } catch (err) {
          return `could not type into "${name}": ${err instanceof Error ? err.message : String(err)}`
        }
      }
    }
    return `could not find a field called "${name}"`
  }

  const call = async (tool: string, args: Record<string, unknown>): Promise<string> => {
    let result: string
    if (tool === 'look') result = await look()
    else if (tool === 'click') result = await click(String(args.name ?? ''))
    else if (tool === 'type') result = await type(String(args.name ?? ''), String(args.text ?? ''))
    else result = `unknown tool: ${tool}`
    observations.push({ turn, tool, args, result })
    return result
  }

  const instance = new Server({ name: MCP_SERVER_NAME, version: '1.0.0' }, { capabilities: { tools: {} } })
  instance.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))
  instance.setRequestHandler(CallToolRequestSchema, async (req) => ({
    content: [{ type: 'text', text: await call(req.params.name, (req.params.arguments ?? {}) as Record<string, unknown>) }]
  }))

  return {
    server: { type: 'sdk', name: MCP_SERVER_NAME, instance, alwaysLoad: true },
    observations,
    setTurn: (n: number) => { turn = n },
    toolNames: TOOLS.map(t => t.name),
    call
  }
}

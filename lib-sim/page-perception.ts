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
 * because a judge cannot otherwise tell a real complaint from an invented one —
 * including a failed one: `look`/`click`/`type` are all bounded by
 * `ACTION_TIMEOUT_MS`, so a stuck element is caught and recorded rather than
 * hanging the case with no evidence ever written.
 *
 * `click` and `type` also accept an `offLimits` list of names (e.g. the chat
 * composer's own input/send/stop): a request naming one is refused, structurally,
 * before the element is even looked up, instead of relying on an instruction the
 * persona is free to ignore. This is what keeps "look and act freely, but talk by
 * replying" (spec §3) an invariant rather than a suggestion.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import type { ChatRoot } from './chat-driver.ts'

export const MCP_SERVER_NAME = 'page'
export const SNAPSHOT_CAP = 4000

// Bounds every Playwright call the persona itself makes (look/click/type).
// Without this, an element Playwright calls visible/enabled/stable but stuck
// outside the viewport — the exact case a live run hit — waits with no ceiling
// of its own, wedging the case until the test runner's 15-minute timeout kills
// it with no diagnosis. 15s mirrors chat-driver.ts's SEND_TIMEOUT_MS: a person
// does not wait minutes for something to become clickable, and a timeout here
// must surface through the existing try/catch as a recorded observation
// instead of an unrecorded hang.
export const ACTION_TIMEOUT_MS = 15000

/** How long a look after an action waits, at most, for the page to stop changing. */
export const SETTLE_MAX_MS = 3000
export const SETTLE_INTERVAL_MS = 250

/**
 * Read until two consecutive reads agree, or the budget runs out. A look taken right
 * after clicking a chat link read the page before the route changed: the persona saw
 * the old page, said the link did nothing, and the assistant apologised for a link
 * the application had just reported as followed.
 */
export async function settledRead (read: () => Promise<string>, opts: { intervalMs?: number, maxMs?: number } = {}): Promise<string> {
  const interval = opts.intervalMs ?? SETTLE_INTERVAL_MS
  const deadline = Date.now() + (opts.maxMs ?? SETTLE_MAX_MS)
  let previous = await read()
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, interval))
    const current = await read()
    if (current === previous) return current
    previous = current
  }
  return previous
}

/** `cap` overrides SNAPSHOT_CAP for this root: a dense page can deserve more than a chat panel. */
export type PerceptionRoot = { label: string, root: ChatRoot, cap?: number }
export type Observation = { turn: number, tool: string, args: unknown, result: string }

export type PagePerception = {
  server: { type: 'sdk', name: string, instance: unknown, alwaysLoad: true }
  observations: Observation[]
  setTurn: (turn: number) => void
  toolNames: string[]
  call: (tool: string, args: Record<string, unknown>) => Promise<string>
  /**
   * The names passed as `opts.offLimits`, verbatim (empty when none were).
   * `persona.ts` reads this to decide whether the composer-refusal sentence in
   * its system prompt is a true statement — with no offLimits, nothing refuses
   * anything, so the prompt must not claim otherwise.
   */
  offLimits: string[]
}

/**
 * Head AND tail, because overlays live at the end.
 *
 * A dialog is teleported to the end of the DOM, so a head-only cut removes
 * precisely what a person is being asked to look at. A judged run turned on it:
 * the persona clicked "Ajouter une colonne", its snapshot was cut at the same
 * point before and after the click, and whether the dialog ever opened was not
 * decidable from the record — the judge had to say so instead of ruling.
 */
//
// On line boundaries, because a cut inside a line reads as the whole line. A judged
// run's cut fell inside the value of a filled textbox: the persona read
// `textbox "Termes de recherche associés": gymnase, salle de sport` as the field's
// entire content, told the assistant its 14 terms were missing, and never saved.
// A line is shown whole or not at all; only a single line longer than the whole
// budget is cut, and says so.
export function truncate (text: string, cap: number = SNAPSHOT_CAP): string {
  if (text.length <= cap) return text
  const lines = text.split('\n')
  const headBudget = Math.floor(cap * 0.6)
  const tailBudget = cap - headBudget
  let used = 0
  let head = 0
  while (head < lines.length && used + lines[head].length + 1 <= headBudget) used += lines[head++].length + 1
  used = 0
  let tail = 0
  while (tail < lines.length - head && used + lines[lines.length - 1 - tail].length + 1 <= tailBudget) used += lines[lines.length - 1 - (tail++)].length + 1
  const headPart = head ? lines.slice(0, head) : [lines[0].slice(0, headBudget) + ' …[line cut]']
  const tailPart = tail ? lines.slice(lines.length - tail) : [lines.length - head > 1 ? '[line cut]… ' + lines[lines.length - 1].slice(-tailBudget) : '']
  const hidden = lines.length - Math.max(head, 1) - Math.max(tail, 1)
  return [...headPart, `…[truncated: ${Math.max(hidden, 0)} lines not shown]`, ...tailPart].join('\n')
}

type SnapNode = { line: string, children: SnapNode[], raw?: boolean }

/** Rows a person takes in at a glance; the rest are counted, not listed. */
export const TABLE_ROWS_KEPT = 20

/**
 * Drop what repeats or says nothing, before the cap has to cut something that matters.
 *
 * The cap alone hid a whole form: on a dataset page the table's cells and a rich-text
 * toolbar filled the head budget, the fields below the Description editor landed in the
 * cut, and the persona told the assistant a field it had just filled did not exist.
 * - a row keeps its name, which already spells its cells, and loses the cells;
 * - a table lists TABLE_ROWS_KEPT rows and counts the others;
 * - a toolbar becomes one line of button names;
 * - unnamed images, link targets, separators and "|" dividers go.
 */
export function pruneSnapshot (snapshot: string): string {
  const root: SnapNode = { line: '', children: [] }
  const stack: { indent: number, node: SnapNode }[] = [{ indent: -1, node: root }]
  for (const raw of snapshot.split('\n')) {
    const m = raw.match(/^(\s*)- (.*)$/)
    if (!m) {
      // a continuation line of a multi-line value: keep it with the current node
      const last = stack[stack.length - 1].node
      if (last !== root) last.line += '\n' + raw
      else if (raw.trim()) root.children.push({ line: raw, children: [], raw: true })
      continue
    }
    const indent = m[1].length
    while (stack[stack.length - 1].indent >= indent) stack.pop()
    const node = { line: m[2], children: [] }
    stack[stack.length - 1].node.children.push(node)
    stack.push({ indent, node })
  }

  const isNoise = (line: string) => line === 'img' || line === 'separator' || line === 'text: "|"' || line.startsWith('/url:')
  const isCell = (line: string) => /^(cell|gridcell|columnheader|rowheader)\b/.test(line)
  const buttonName = (line: string) => line.match(/^button "(.*)"/)?.[1]

  const prune = (node: SnapNode): SnapNode | null => {
    if (node.raw) return node
    if (isNoise(node.line)) return null
    if (node.line.startsWith('toolbar')) {
      const names: string[] = []
      const collect = (n: SnapNode) => { const b = buttonName(n.line); if (b) names.push(b); n.children.forEach(collect) }
      node.children.forEach(collect)
      return { line: `toolbar: ${names.join(', ')}`, children: [] }
    }
    if (/^row "/.test(node.line) && node.children.every(c => isCell(c.line))) {
      return { line: node.line.replace(/:$/, ''), children: [] }
    }
    let children = node.children.map(prune).filter((c): c is SnapNode => !!c)
    if (/^(table|grid|treegrid)\b/.test(node.line)) children = capRows(children)
    const line = children.length ? node.line : node.line.replace(/:$/, '')
    return { line, children }
  }

  // Rows sit under rowgroups; count them across the whole table, header row included.
  const capRows = (groups: SnapNode[]): SnapNode[] => {
    let seen = 0
    let dropped = 0
    const walk = (nodes: SnapNode[]): SnapNode[] => nodes.flatMap(n => {
      if (/^row\b/.test(n.line)) {
        seen++
        if (seen > TABLE_ROWS_KEPT + 1) { dropped++; return [] }
        return [n]
      }
      const children = walk(n.children)
      return [{ line: children.length ? n.line : n.line.replace(/:$/, ''), children }]
    })
    const kept = walk(groups)
    return dropped ? [...kept, { line: `text: … ${dropped} more rows`, children: [] }] : kept
  }

  const out: string[] = []
  const write = (n: SnapNode, depth: number) => {
    out.push(n.raw ? n.line : `${'  '.repeat(depth)}- ${n.line}`)
    n.children.forEach(c => write(c, depth + 1))
  }
  root.children.map(prune).forEach(n => { if (n) write(n, 0) })
  return out.join('\n')
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

  // Set by click and type: the next look waits for what the action set off to settle.
  let actedSinceLook = false

  const look = async () => {
    const settle = actedSinceLook
    actedSinceLook = false
    const parts: string[] = []
    for (const { label, root, cap } of roots) {
      let snap = ''
      const read = () => root.locator('body').ariaSnapshot({ timeout: ACTION_TIMEOUT_MS })
      try { snap = settle ? await settledRead(read) : await read() } catch (err) {
        snap = `(could not read: ${err instanceof Error ? err.message : String(err)})`
      }
      // Capped per root, not on the joined result: otherwise a large first
      // root can consume the whole budget and a second root (e.g. an embedded
      // `## chat panel`) disappears from the log entirely, with no marker
      // hinting it was ever there.
      parts.push(truncate(`## ${label}\n${pruneSnapshot(snap)}`, cap))
    }
    return parts.join('\n\n')
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

  /** As above, but says WHICH finder matched — `click` reports it. */
  const firstMatchKind = async <K extends string>(finders: Array<[K, () => any]>) => {
    for (const [kind, find] of finders) {
      try {
        const loc = find()
        if (await loc.count() > 0) return { kind, loc }
      } catch { /* a finder that throws simply does not match */ }
    }
    return null
  }

  const click = async (name: string) => {
    if (isOffLimits(name)) return OFF_LIMITS_RESULT
    for (const { root } of roots) {
      const match = await firstMatchKind([
        ['control', () => root.getByRole('button', { name }).first()],
        ['control', () => root.getByRole('link', { name }).first()],
        ['text', () => root.getByText(name).first()]
      ])
      if (match) {
        try {
          await match.loc.click({ timeout: ACTION_TIMEOUT_MS })
          actedSinceLook = true
          // Playwright clicks whatever is visible, so the text fallback succeeds
          // on a paragraph as readily as on a button. Saying which one it was is
          // the difference between a person learning nothing happened and a
          // person concluding the product is broken — a recorded run did exactly
          // that, and the judge filed it as a product failure.
          return match.kind === 'control'
            ? `clicked "${name}"`
            : `clicked the text "${name}", which is not a button or a link — nothing may happen`
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
          await loc.fill(text, { timeout: ACTION_TIMEOUT_MS })
          actedSinceLook = true
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
    call,
    offLimits: opts.offLimits ?? []
  }
}

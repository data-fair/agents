/**
 * What the simulated user can perceive and do.
 *
 * Tools shaped like a person rather than like a test framework: look at the
 * screen, see it as an image, click something by its visible name, type into a
 * named field, press a key, go to another tab.
 * There is deliberately no evaluate, no raw selector and no DOM access — a
 * persona that can run JavaScript verifies outcomes no human could, which would
 * make verdicts wrongly optimistic in exactly the way a blind persona makes them
 * wrongly pessimistic.
 *
 * The handlers run in-process against the runner's live Playwright roots, so
 * there is one browser and one page. Every call is recorded as an observation,
 * because a judge cannot otherwise tell a real complaint from an invented one —
 * including a failed one: every action is bounded by
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
import type { Page } from '@playwright/test'
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

/**
 * `cap` overrides SNAPSHOT_CAP for this root: a dense page can deserve more than a chat panel.
 *
 * `frames` makes the root see and act inside its iframes, nested ones included, as a person
 * does: a plain outline stops at an iframe, so hosts had to add a root per frame, and each
 * absent one cost a timeout per look. Acting inside frames needs a Page root.
 */
export type PerceptionRoot = { label: string, root: ChatRoot, cap?: number, frames?: boolean }
export type Observation = { turn: number, tool: string, args: unknown, result: string }

export type PerceptionContent = { type: 'text', text: string } | { type: 'image', data: string, mimeType: string }

export type PagePerception = {
  server: { type: 'sdk', name: string, instance: unknown, alwaysLoad: true }
  observations: Observation[]
  setTurn: (turn: number) => void
  toolNames: string[]
  /** The text of a tool's result; `callContent` also returns the image of `screenshot`. */
  call: (tool: string, args: Record<string, unknown>) => Promise<string>
  callContent: (tool: string, args: Record<string, unknown>) => Promise<PerceptionContent[]>
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

function parseSnapshot (snapshot: string): SnapNode {
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
  return root
}

function writeSnapshot (nodes: SnapNode[]): string {
  const out: string[] = []
  const write = (n: SnapNode, depth: number) => {
    out.push(n.raw ? n.line : `${'  '.repeat(depth)}- ${n.line}`)
    n.children.forEach(c => { write(c, depth + 1) })
  }
  nodes.forEach(n => { write(n, 0) })
  return out.join('\n')
}

/**
 * The AI-mode snapshot (the one that descends into iframes), brought back to the plain
 * outline's shape: element references and cursor or focus marks go, and the unnamed
 * `generic` wrappers it lists — every div — give way to their content.
 */
export function normalizeAiSnapshot (snapshot: string): string {
  const clean = snapshot.replace(/ \[(?:ref|cursor)=[^\]]*\]| \[active\]/g, '')
  const flatten = (nodes: SnapNode[]): SnapNode[] => nodes.flatMap(n => {
    if (n.raw) return [n]
    const children = flatten(n.children)
    if (/^generic:?$/.test(n.line)) return children
    const inline = n.line.match(/^generic: (.*)$/s)
    if (inline) return [{ line: `text: ${inline[1]}`, children }]
    return [{ line: n.line, children }]
  })
  return writeSnapshot(flatten(parseSnapshot(clean).children))
}

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
  const root = parseSnapshot(snapshot)

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

  return writeSnapshot(root.children.map(prune).filter((n): n is SnapNode => !!n))
}

/**
 * Keys a person presses, alone or with modifiers: no free text — typing is `type`'s job,
 * and a key name is all `press` ever needs.
 */
const KEY_PATTERN = /^((Control|Shift|Alt|Meta)\+)*(Enter|Escape|Tab|Backspace|Delete|Space|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Home|End|PageUp|PageDown|[A-Za-z0-9])$/

/** How long a click checks that its target can take it, before clicking what covers it. */
export const INTERCEPT_PROBE_MS = 2000

/** How long a click is watched for the new tab it may open. */
export const NEW_TAB_WAIT_MS = 1000

const TOOLS = [
  {
    name: 'look',
    description: 'Look at the screen. Returns what is currently visible, as an accessibility outline of the page. Use this before saying anything about what you can or cannot see.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'screenshot',
    description: 'See the screen as an image: colours, layout, pictures — what the outline from look does not tell. Look first; use this when the appearance matters.',
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
  },
  {
    name: 'press',
    description: 'Press a key on the keyboard (Enter, Escape, Tab, ArrowDown, Control+a…), in the field or element named, or wherever the focus is when no name is given.',
    inputSchema: { type: 'object', properties: { key: { type: 'string' }, name: { type: 'string', description: 'The visible label of the field or element to press the key in' } }, required: ['key'] }
  },
  {
    name: 'switch_tab',
    description: 'Go to another open browser tab, by its number: tab 1 is the application you started on.',
    inputSchema: { type: 'object', properties: { tab: { type: 'number' } }, required: ['tab'] }
  }
]

const isPage = (root: unknown): root is Page => typeof (root as Page)?.frames === 'function' && typeof (root as Page)?.context === 'function'

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

  // Set by every action: the next look waits for what the action set off to settle.
  let actedSinceLook = false

  // Tabs. A link with target=_blank (« Voir sur le portail ») opened a tab the persona
  // could not see: it clicked, looked at the unchanged back-office and reported a dead
  // link. Tab 1 is the host's roots; every tab opened since is its own page, and the
  // person looks at one tab at a time.
  const mainPage = roots.map(r => r.root).find(isPage)
  const tabs: Page[] = []
  let current = 0 // 0: the host's roots; n: tabs[n - 1]
  mainPage?.context().on('page', (tab: Page) => {
    tabs.push(tab)
    current = tabs.length
    tab.on('close', () => {
      const index = tabs.indexOf(tab)
      if (index === -1) return
      tabs.splice(index, 1)
      if (current === index + 1) current = 0
      else if (current > index + 1) current--
    })
  })
  const currentPage = (): Page | undefined => current ? tabs[current - 1] : mainPage
  const viewRoots = (): PerceptionRoot[] => current
    ? [{ label: `tab ${current + 1}`, root: tabs[current - 1], frames: true }]
    : roots
  const tabsLine = () => {
    if (!tabs.length) return ''
    if (current) return `(You are on tab ${current + 1} of ${tabs.length + 1}. Tab 1 is the application you started on, with the chat: switch_tab to go back.)`
    return `(Other open tabs: ${tabs.map((t, i) => `tab ${i + 2}`).join(', ')}. switch_tab to look at one.)`
  }

  /** Where a root's elements are searched: its frames too, when it opted in and can list them. */
  const scopes = ({ root, frames }: PerceptionRoot): any[] => frames && isPage(root) ? root.frames() : [root]

  const look = async () => {
    const settle = actedSinceLook
    actedSinceLook = false
    const parts: string[] = []
    if (current) await tabs[current - 1].waitForLoadState('domcontentloaded', { timeout: ACTION_TIMEOUT_MS }).catch(() => {})
    for (const { label, root, cap, frames } of viewRoots()) {
      let snap = ''
      const read = async () => frames
        ? normalizeAiSnapshot(await root.locator('body').ariaSnapshot({ mode: 'ai', timeout: ACTION_TIMEOUT_MS }))
        : await root.locator('body').ariaSnapshot({ timeout: ACTION_TIMEOUT_MS })
      try { snap = settle ? await settledRead(read) : await read() } catch (err) {
        snap = `(could not read: ${err instanceof Error ? err.message : String(err)})`
      }
      let heading = label
      if (current && isPage(root)) heading = `${label}: "${await root.title().catch(() => '')}" — ${root.url()}`
      // Capped per root, not on the joined result: otherwise a large first
      // root can consume the whole budget and a second root (e.g. an embedded
      // `## chat panel`) disappears from the log entirely, with no marker
      // hinting it was ever there.
      parts.push(truncate(`## ${heading}\n${pruneSnapshot(snap)}`, cap))
    }
    const line = tabsLine()
    if (line) parts.push(line)
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

  // A component can cover its own control: Vuetify keeps a select's input under the field's
  // div, and a judged run's click on « Type de lien » waited out the timeout on « intercepts
  // pointer events ». A person clicks what is on top at that spot: so does this, once a
  // short check shows the control itself cannot take the click.
  const clickAsAPerson = async (loc: any) => {
    try {
      await loc.click({ trial: true, timeout: INTERCEPT_PROBE_MS })
    } catch (err) {
      // anything else (not yet visible, still animating) gets the normal, longer wait below
      const box = err instanceof Error && err.message.includes('intercepts pointer events') ? await loc.boundingBox() : null
      if (box) {
        await loc.page().mouse.click(box.x + box.width / 2, box.y + box.height / 2)
        return
      }
    }
    await loc.click({ timeout: ACTION_TIMEOUT_MS })
  }

  const newTabAfter = async (before: number) => {
    const deadline = Date.now() + NEW_TAB_WAIT_MS
    while (Date.now() < deadline && tabs.length === before) await new Promise(resolve => setTimeout(resolve, 100))
    return tabs.length > before
  }

  // Widgets a person clicks, not only buttons and links: an editor's tabs are role=tab, and
  // a judged run clicked « Barre de navigation » as text — the chat's words — instead. A
  // drop-down shares its name with its label: clicking « Type de lien » hit the label text.
  const CONTROL_ROLES = ['button', 'link', 'tab', 'menuitem', 'option', 'checkbox', 'radio', 'switch', 'combobox'] as const

  const click = async (name: string) => {
    if (isOffLimits(name)) return OFF_LIMITS_RESULT
    const scopeList = viewRoots().flatMap(scopes)
    // Every control in every frame before any text: the same words as plain text in an
    // earlier frame (a chat reply naming the tab) must not win over the control itself.
    let match: { kind: 'control' | 'text', loc: any } | null = null
    for (const scope of scopeList) {
      match = await firstMatchKind(CONTROL_ROLES.map(role => ['control' as const, () => scope.getByRole(role, { name }).first()]))
      if (match) break
    }
    if (!match) {
      for (const scope of scopeList) {
        match = await firstMatchKind([['text' as const, () => scope.getByText(name).first()]])
        if (match) break
      }
    }
    if (!match) return `could not find anything called "${name}" to click`
    try {
      const before = tabs.length
      await clickAsAPerson(match.loc)
      actedSinceLook = true
      if (await newTabAfter(before)) return `clicked "${name}" — it opened a new tab (tab ${current + 1}); you are now looking at it`
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

  const type = async (name: string, text: string) => {
    if (isOffLimits(name)) return OFF_LIMITS_RESULT
    for (const view of viewRoots()) {
      for (const scope of scopes(view)) {
        const loc = await firstMatch([
          () => scope.getByRole('textbox', { name }).first(),
          () => scope.getByLabel(name).first()
        ])
        if (!loc) continue
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

  // Judged runs had the persona told to press Enter or Escape, unable to, and reporting
  // the click errors it got instead as things it saw on the screen.
  const press = async (key: string, name?: string) => {
    if (!KEY_PATTERN.test(key)) return `"${key}" is not a key: press takes a key name such as Enter, Escape, Tab or ArrowDown — use type to write text`
    if (!name) {
      const page = currentPage()
      if (!page) return `there is no keyboard here to press ${key} on — name the field to press it in`
      try {
        await page.keyboard.press(key)
        actedSinceLook = true
        return `pressed ${key}`
      } catch (err) {
        return `could not press ${key}: ${err instanceof Error ? err.message : String(err)}`
      }
    }
    if (isOffLimits(name)) return OFF_LIMITS_RESULT
    for (const view of viewRoots()) {
      for (const scope of scopes(view)) {
        const loc = await firstMatch([
          () => scope.getByRole('textbox', { name }).first(),
          () => scope.getByRole('combobox', { name }).first(),
          () => scope.getByLabel(name).first(),
          () => scope.getByRole('button', { name }).first(),
          () => scope.getByRole('link', { name }).first()
        ])
        if (!loc) continue
        try {
          await loc.press(key, { timeout: ACTION_TIMEOUT_MS })
          actedSinceLook = true
          return `pressed ${key} in "${name}"`
        } catch (err) {
          return `could not press ${key} in "${name}": ${err instanceof Error ? err.message : String(err)}`
        }
      }
    }
    return `could not find anything called "${name}" to press ${key} in`
  }

  const switchTab = (tab: number) => {
    if (!Number.isInteger(tab) || tab < 1 || tab > tabs.length + 1) return `there is no tab ${tab} (${tabs.length + 1} open)`
    current = tab - 1
    actedSinceLook = true
    return tab === 1 ? 'now on tab 1, the application with the chat' : `now on tab ${tab}`
  }

  // The outline has no colours: judged runs asked the person to check a theme colour, and
  // the person could only say the outline did not show it. What the persona says after a
  // screenshot cannot be checked from the record, which keeps only that it took one.
  const screenshot = async (): Promise<PerceptionContent[]> => {
    const page = currentPage()
    if (!page) return [{ type: 'text', text: 'there is no screen to take an image of here' }]
    try {
      const image = await page.screenshot({ type: 'jpeg', quality: 70, timeout: ACTION_TIMEOUT_MS })
      return [
        { type: 'text', text: `screenshot of tab ${current + 1}` },
        { type: 'image', data: image.toString('base64'), mimeType: 'image/jpeg' }
      ]
    } catch (err) {
      return [{ type: 'text', text: `could not take a screenshot: ${err instanceof Error ? err.message : String(err)}` }]
    }
  }

  const callContent = async (tool: string, args: Record<string, unknown>): Promise<PerceptionContent[]> => {
    let content: PerceptionContent[]
    if (tool === 'screenshot') content = await screenshot()
    else {
      let text: string
      if (tool === 'look') text = await look()
      else if (tool === 'click') text = await click(String(args.name ?? ''))
      else if (tool === 'type') text = await type(String(args.name ?? ''), String(args.text ?? ''))
      else if (tool === 'press') text = await press(String(args.key ?? ''), args.name == null || args.name === '' ? undefined : String(args.name))
      else if (tool === 'switch_tab') text = switchTab(Number(args.tab))
      else text = `unknown tool: ${tool}`
      content = [{ type: 'text', text }]
    }
    const result = content.flatMap(c => c.type === 'text' ? [c.text] : []).join('\n')
    observations.push({ turn, tool, args, result })
    return content
  }

  const call = async (tool: string, args: Record<string, unknown>): Promise<string> =>
    (await callContent(tool, args)).flatMap(c => c.type === 'text' ? [c.text] : []).join('\n')

  const instance = new Server({ name: MCP_SERVER_NAME, version: '1.0.0' }, { capabilities: { tools: {} } })
  instance.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))
  instance.setRequestHandler(CallToolRequestSchema, async (req) => ({
    content: await callContent(req.params.name, (req.params.arguments ?? {}) as Record<string, unknown>)
  }))

  return {
    server: { type: 'sdk', name: MCP_SERVER_NAME, instance, alwaysLoad: true },
    observations,
    setTurn: (n: number) => { turn = n },
    toolNames: TOOLS.map(t => t.name),
    call,
    callContent,
    offLimits: opts.offLimits ?? []
  }
}

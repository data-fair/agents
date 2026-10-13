/**
 * A minimal in-process MCP server over streamable HTTP, used as the tool fixture.
 * It records the headers of the last request so tests can assert which credential the
 * client actually presented.
 */
import { createServer, type Server } from 'node:http'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { z as z4 } from 'zod/v4'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

const day = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10)
/** Dates are relative to TODAY (see list_road_closures): a fixed month goes stale. */
const closuresOf = (district: string): Array<{ street: string, from: string, reopens: string, reason: string }> => ({
  'city-center': [
    { street: 'Rue de la Paix', from: day(-3), reopens: day(11), reason: 'water main replacement' },
    { street: 'Avenue Foch', from: day(1), reopens: day(3), reason: 'resurfacing' },
    { street: 'Place du Marche', from: day(5), reopens: day(6), reason: 'weekly market' }
  ],
  riverside: [
    { street: 'Quai des Chartrons', from: day(-1), reopens: day(20), reason: 'bridge inspection' }
  ]
} as Record<string, Array<{ street: string, from: string, reopens: string, reason: string }>>)[district] ?? []
export const closuresCsv = (district: string) =>
  ['street,from,reopens,reason', ...closuresOf(district).map(c => [c.street, c.from, c.reopens, c.reason].join(','))].join('\n') + '\n'

// What a server says about itself (docs/architecture/mcp-tools.md, "Server instructions and skills"): its
// instructions, and two skills over the skills extension (SEP-2640) — one listed, one only reachable by URI.
export const FIXTURE_INSTRUCTIONS = 'Road closures: always give the district a closure belongs to.'
export const FIXTURE_SKILLS = {
  listed: { uri: 'skill://fixture/closures/SKILL.md', name: 'closures', description: 'How to answer questions about road closures. Read it before listing closures.', tools: 'list_road_closures', body: 'Call list_road_closures with the district, then quote the reopening date.' },
  unlisted: { uri: 'skill://fixture/hidden/SKILL.md', name: 'hidden', description: 'Reachable by URI only.', tools: undefined as string | undefined, body: 'Hidden procedure.' }
}

export interface McpFixture {
  port: number
  lastHeaders: () => Record<string, string | string[] | undefined>
  /** Tool names this server actually EXECUTED, in order. Listing does not appear here. */
  invokedTools: () => string[]
  resetInvokedTools: () => void
  /** The file URLs `import_table` was handed, in order: the model never sees one, so only this can. */
  fileUrls: () => string[]
  /**
   * How many times each JSON-RPC method reached this server — `initialize` is a connection,
   * `tools/list` a listing. What a test of the listing cache, or of lazy connections, counts.
   */
  methodCounts: () => Record<string, number>
  resetMethodCounts: () => void
  /** Plain HTTP requests the /exports/ routes received: what a download link or fetch_url points at. */
  exportRequests: () => Array<{ url: string, headers: Record<string, string | string[] | undefined> }>
  resetExportRequests: () => void
  /** Make `skills/list` fail, to check a broken skills listing never costs the server's tools. */
  failSkillsList: (fail: boolean) => void
  /** Make `skills/list` answer only after this many ms (0: at once), to check a slow one never costs the tools. */
  delaySkillsList: (ms: number) => void
  /** The capabilities the last `initialize` declared: what the agents client says it supports. */
  lastInitializeCapabilities: () => any
  close: () => Promise<void>
}

// Builds a fresh McpServer for each incoming HTTP request (see startMcpFixture below):
// the installed SDK (1.30.0) throws "Stateless transport cannot be reused across
// requests. Create a new transport per request." if a single StreamableHTTPServerTransport
// constructed with `sessionIdGenerator: undefined` is shared across requests — unlike what
// the brief's original one-transport-for-the-process-lifetime sketch assumed. See
// node_modules/@modelcontextprotocol/sdk/dist/esm/server/webStandardStreamableHttp.js.
const buildMcpServer = (record: (toolName: string) => void, headers: Record<string, string | string[] | undefined>, recordFileUrl: (url: string) => void, failSkillsList: () => boolean = () => false, skillsListDelay: () => number = () => 0): McpServer => {
  const mcp = new McpServer({ name: 'fixture', version: '1.0.0' }, {
    instructions: FIXTURE_INSTRUCTIONS,
    capabilities: { resources: {}, extensions: { 'io.modelcontextprotocol/skills': {} } } as any
  })
  for (const s of Object.values(FIXTURE_SKILLS)) {
    mcp.registerResource(s.name, s.uri, { mimeType: 'text/markdown' }, async () => ({
      contents: [{ uri: s.uri, mimeType: 'text/markdown', text: `---\nname: ${s.name}\ndescription: ${JSON.stringify(s.description)}\n---\n\n${s.body}\n` }]
    }))
  }
  const skillEntry = (s: { uri: string, name: string, description: string, tools?: string }) =>
    ({ uri: s.uri, frontmatter: { name: s.name, description: s.description, ...(s.tools ? { metadata: { tools: s.tools } } : {}) }, resources: [{ uri: s.uri }] })
  mcp.server.setRequestHandler(z.object({ method: z.literal('skills/list'), params: z.any().optional() }), async () => {
    if (failSkillsList()) throw new Error('skills/list is broken on purpose')
    if (skillsListDelay()) await new Promise(resolve => setTimeout(resolve, skillsListDelay()))
    return { skills: [skillEntry(FIXTURE_SKILLS.listed)] } as any
  })
  mcp.server.setRequestHandler(z.object({ method: z.literal('skills/get'), params: z.object({ uri: z.string() }) }), async (req) => {
    const s = Object.values(FIXTURE_SKILLS).find(x => x.uri === req.params.uri)
    if (!s) throw new Error(`No skill is served at ${req.params.uri}`)
    return { skill: skillEntry(s) } as any
  })
  // The installed SDK also requires a Zod schema/raw-shape for inputSchema, not a plain
  // JSON Schema object — registerTool() calls getZodSchemaObject() on it and throws
  // "inputSchema must be a Zod schema or raw shape" otherwise. See
  // node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.js.
  mcp.registerTool(
    'echo',
    { description: 'Echoes its input back', inputSchema: { value: z.string() } },
    async ({ value }) => { record('echo'); return { content: [{ type: 'text', text: `echo:${value}` }] } }
  )
  mcp.registerTool(
    'get_schema',
    // Exists so the mock model's `loop forever` seam, which emits this exact tool name,
    // has something to call in an autonomous agent's tool set. Without it the turn calls a
    // tool the agent does not have and ends as an unknown-tool error, which would still
    // satisfy a naive "the run stopped" assertion while testing the wrong thing.
    { description: 'Returns a fixed schema', inputSchema: {} },
    async () => { record('get_schema'); return { content: [{ type: 'text', text: '{"fields":[]}' }] } }
  )
  mcp.registerTool(
    'list_road_closures',
    // The only tool here that returns DATA. The other three are structural — a string reflector, a
    // fixed empty schema and a filter target — and with only those, a simulation asking the agent for
    // a usable result has no reachable answer: a well-behaved agent and a broken one both end at "I
    // can't do this", which is what the refusal case already covers. Both judges of the first run
    // reported exactly that, independently.
    //
    // Deterministic, and distinctive enough that a paraphrase is detectable: an agent that invents an
    // answer instead of calling this will not produce "Rue de la Paix" or the 2026-07 dates.
    {
      description: 'Lists current road closures for a city district, with reason and expected reopening date',
      inputSchema: { district: z.string().describe('District name, e.g. "city-center"') }
    },
    async ({ district }) => {
      record('list_road_closures')
      // Dates are relative to TODAY, not hardcoded. A fixed month goes stale: a simulated user asking
      // for "current" closures was correctly told by the agent that every row had expired, so the run
      // spent its turns on the staleness instead of on the reporting the case is about. The agent was
      // right and the fixture was wrong.
      // `reopens`, not `until`: with `until` the one-day market closure rendered as
      // "Closed From 2026-10-04 / Reopening 2026-10-04", which is self-contradictory. The ambiguity
      // (last closed day, or the day it reopens?) was the fixture's, and the agent had to guess.
      // The argument SELECTS the rows, and an unknown district returns none.
      //
      // Previously `district` was echoed into the payload and otherwise ignored, so every value
      // returned the same three rows: the case proved the agent called the tool but not that it asked
      // the right question, and an agent passing "Bellecour" or "" was indistinguishable from a correct
      // one. Worse, the agent volunteers "let me know if you need another district" — so the next run
      // would confidently report Rue de la Paix as closed somewhere it is not.
      const key = String(district ?? '').trim().toLowerCase()
      const closures = closuresOf(key)
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            district,
            known: closures.length > 0,
            closures
          })
        }]
      }
    }
  )
  mcp.registerTool(
    'bulk',
    /**
     * A big result from a tiny request — the shape tier 1 of the context policy exists for.
     *
     * Every other tool here returns roughly as much as it was asked for, so a conversation using them has
     * a history split evenly between instructions (unclearable) and results (clearable). That makes
     * "clearing alone brought it back under budget" impossible to demonstrate without tuning the budget
     * to a knife edge. With this one the payload dominates, which is what a real MCP conversation looks
     * like once a tool returns a page of rows.
     */
    { description: 'Returns a result of the requested size', inputSchema: { chars: z.number() } },
    async ({ chars }) => {
      record('bulk')
      return { content: [{ type: 'text', text: 'b'.repeat(Math.min(chars, 200_000)) }] }
    }
  )
  mcp.registerTool(
    'explode',
    /**
     * A tool that FAILS, which nothing here could do before.
     *
     * That gap is why a failed call was stored in the exact shape of a successful one for a whole
     * plan: every fixture tool succeeded, so no test could tell the two apart. It reports the failure
     * the way a real MCP tool does — `isError: true` with content — rather than by throwing, because
     * that is the case the client used to return as ordinary data.
     */
    { description: 'Always fails, to exercise the tool-failure path', inputSchema: {} },
    async () => {
      record('explode')
      return { isError: true, content: [{ type: 'text' as const, text: 'the tool refused: nothing to explode' }] }
    }
  )
  mcp.registerTool(
    'wipe_everything',
    // Declares MCP `annotations`, which the run records per call: they are what makes a write auditable
    // and are the input P1's approval gate reads. Nothing else here declares any, so without this tool
    // "annotations are carried through" is untestable.
    {
      description: 'Declares destructive annotations, and does nothing',
      inputSchema: {},
      annotations: { readOnlyHint: false, destructiveHint: true, title: 'Wipe everything' }
    },
    async () => { record('wipe_everything'); return { content: [{ type: 'text', text: 'wiped nothing' }] } }
  )
  mcp.registerTool(
    'snapshot',
    // The only tool here that returns an IMAGE, which is what an image-bearing result can only be tested
    // with: such a result is stored and replayed as an envelope, and reaches the model as image parts.
    { description: 'Returns a tiny PNG chart and a caption', inputSchema: {} },
    async () => {
      record('snapshot')
      return {
        content: [
          { type: 'text' as const, text: 'a chart of closures' },
          { type: 'image' as const, data: SNAPSHOT_PNG, mimeType: 'image/png' }
        ]
      }
    }
  )
  mcp.registerTool(
    'slow_lookup',
    // A read that takes its time. Beside a gated call in one step, it holds the step open after the SDK
    // has already emitted the approval request — the window in which the message asking is still being
    // written, and a decision must be refused (see decideApproval).
    {
      description: 'Reads slowly, and returns nothing of interest',
      inputSchema: {},
      annotations: { readOnlyHint: true }
    },
    async () => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      record('slow_lookup')
      return { content: [{ type: 'text', text: 'looked up slowly' }] }
    }
  )
  mcp.registerTool(
    'export_closures',
    // A tool returning a FILE LINK, as openapi-mcp does for `response: { file: true }`: no request made, a
    // resource_link and a text block naming the URL. Like data-fair's /raw link: on the server's own origin,
    // no extension in the URL, no mimeType (an octet-stream link carries none); the name comes back in the
    // response's Content-Disposition (the /exports routes below).
    { description: 'Exports the road closures of a district as a CSV file', inputSchema: { district: z.string() }, annotations: { readOnlyHint: true } },
    async ({ district }) => {
      record('export_closures')
      const uri = `http://${headers.host}/exports/closures?district=${encodeURIComponent(district)}`
      return { content: [{ type: 'resource_link' as const, uri, name: `closures-${district}` }, { type: 'text' as const, text: `The export of the road closures of ${district}: ${uri}` }] }
    }
  )
  mcp.registerTool(
    'export_my_profile',
    // A link on the SITE the call acts on (its x-forwarded-host): simple-directory's own "who am I", which
    // answers only to a session. What proves the credential rule end to end: fetched with the call's
    // session, it names the agent; fetched anonymously, it is a 404.
    { description: 'Exports your own profile as a JSON file', inputSchema: {}, annotations: { readOnlyHint: true } },
    async () => {
      record('export_my_profile')
      const host = headers['x-forwarded-host']
      if (!host) return { isError: true, content: [{ type: 'text' as const, text: 'this tool needs a site: call it through a site-bound entry' }] }
      const uri = `${headers['x-forwarded-proto'] ?? 'http'}://${host}/simple-directory/api/auth/me`
      return { content: [{ type: 'resource_link' as const, uri, name: 'me', mimeType: 'application/json' }, { type: 'text' as const, text: `Your profile: ${uri}` }] }
    }
  )
  mcp.registerTool(
    'whoami',
    // Which site this call acts on and as whom, as the server received it: the proof that a call landed
    // on the right site with the right identity. Decodes the session's claims without verifying them —
    // a fixture reporting what it was sent, not an authority.
    { description: 'Says which site the call acts on, and as whom', inputSchema: {} },
    async () => {
      record('whoami')
      const cookie = String(headers.cookie ?? '')
      const token = /(?:^|;\s*)id_token=([^;]+)/.exec(cookie)?.[1]
      let userId: string | null = null
      if (token) {
        try { userId = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')).id ?? null } catch {}
      }
      return { content: [{ type: 'text', text: JSON.stringify({ forwardedHost: headers['x-forwarded-host'] ?? null, userId }) }] }
    }
  )
  mcp.registerTool(
    'ignored',
    { description: 'Exists so toolFilter has something to exclude', inputSchema: {} },
    async () => { record('ignored'); return { content: [{ type: 'text', text: 'ignored' }] } }
  )
  mcp.registerTool(
    'import_table',
    // A tool that takes a FILE (x-mcp-file), as openapi-mcp describes a multipart file part: what an upload
    // to data-fair looks like to the agents service. It fetches the URL as openapi-mcp does — only the file
    // store's URLs, no redirect — and answers what it received, never the URL itself (the model must not
    // see one). The URL is recorded here, in-process, for the specs.
    {
      description: 'Imports a CSV file as a new table',
      inputSchema: {
        file: z4.string().meta({ format: 'uri', 'x-mcp-file': { accept: ['text/csv'], maxSize: 10_000_000 } }).describe('The CSV file to import'),
        title: z4.string().describe('The title of the new table')
      }
    },
    async ({ file, title }) => {
      record('import_table')
      const prefix = `http://localhost:${process.env.DEV_API_PORT}/api/files/`
      if (!String(file).startsWith(prefix)) return { isError: true, content: [{ type: 'text' as const, text: 'refused: this server only fetches files from the agents file store' }] }
      recordFileUrl(String(file))
      const res = await fetch(String(file), { redirect: 'error' })
      if (!res.ok) return { isError: true, content: [{ type: 'text' as const, text: `the file URL answered ${res.status}` }] }
      const bytes = Buffer.from(await res.arrayBuffer())
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            title,
            name: decodeURIComponent(new URL(String(file)).pathname.split('/').pop() ?? ''),
            size: bytes.length,
            contentLength: res.headers.get('content-length'),
            contentType: res.headers.get('content-type'),
            sha256: createHash('sha256').update(bytes).digest('hex')
          })
        }]
      }
    }
  )
  return mcp
}

/** A 1x1 PNG, what the `snapshot` tool returns as its image. */
export const SNAPSHOT_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

export const startMcpFixture = async (port: number): Promise<McpFixture> => {
  let lastHeaders: Record<string, string | string[] | undefined> = {}
  // Ground truth for "was this tool actually CALLED". Listing tools also reaches this server,
  // so headers alone cannot distinguish a listing from an invocation.
  let invoked: string[] = []
  let methods: Record<string, number> = {}
  let fileUrls: string[] = []
  let exports: Array<{ url: string, headers: Record<string, string | string[] | undefined> }> = []
  let failSkills = false
  let skillsDelay = 0
  let initializeCapabilities: any

  const server: Server = createServer((req, res) => {
    // Plain HTTP files beside the MCP endpoint: what a download link or fetch_url points at.
    if (req.url?.startsWith('/exports/')) {
      exports.push({ url: req.url, headers: req.headers })
      const url = new URL(req.url, 'http://fixture')
      if (url.pathname === '/exports/closures') {
        const district = url.searchParams.get('district') ?? 'city-center'
        // As data-fair's /raw: no extension in the URL, the name in Content-Disposition.
        res.writeHead(200, { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="closures-${district}.csv"` }).end(closuresCsv(district))
        return
      }
      if (url.pathname === '/exports/blob') {
        res.writeHead(200, { 'content-type': 'application/octet-stream', 'content-length': '70000' }).end(Buffer.alloc(70_000, 7))
        return
      }
      res.writeHead(404).end()
      return
    }
    lastHeaders = req.headers
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
    const mcp = buildMcpServer(name => invoked.push(name), req.headers, url => fileUrls.push(url), () => failSkills, () => skillsDelay)
    // The body is read here, to count methods, and handed to the transport already parsed.
    const chunks: Buffer[] = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => {
      let body: any
      try { body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : undefined } catch { body = undefined }
      for (const message of Array.isArray(body) ? body : body ? [body] : []) {
        if (typeof message?.method === 'string') methods[message.method] = (methods[message.method] ?? 0) + 1
        if (message?.method === 'initialize') initializeCapabilities = message.params?.capabilities
      }
      mcp.connect(transport)
        .then(() => transport.handleRequest(req, res, body))
        .catch(() => { if (!res.headersSent) res.statusCode = 500; res.end() })
        .finally(() => { res.on('close', () => { transport.close().catch(() => {}) }) })
    })
  })
  await new Promise<void>(resolve => server.listen(port, '127.0.0.1', resolve))

  return {
    port,
    lastHeaders: () => lastHeaders,
    invokedTools: () => [...invoked],
    resetInvokedTools: () => { invoked = []; fileUrls = [] },
    fileUrls: () => [...fileUrls],
    methodCounts: () => ({ ...methods }),
    resetMethodCounts: () => { methods = {} },
    exportRequests: () => [...exports],
    resetExportRequests: () => { exports = [] },
    failSkillsList: (fail: boolean) => { failSkills = fail },
    delaySkillsList: (ms: number) => { skillsDelay = ms },
    lastInitializeCapabilities: () => initializeCapabilities,
    close: async () => { await new Promise<void>(resolve => server.close(() => resolve())) }
  }
}

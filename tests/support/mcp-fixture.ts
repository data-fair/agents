/**
 * A minimal in-process MCP server over streamable HTTP, used as the tool fixture.
 * It records the headers of the last request so tests can assert which credential the
 * client actually presented.
 */
import { createServer, type Server } from 'node:http'
import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

export interface McpFixture {
  port: number
  lastHeaders: () => Record<string, string | string[] | undefined>
  /** Tool names this server actually EXECUTED, in order. Listing does not appear here. */
  invokedTools: () => string[]
  resetInvokedTools: () => void
  /**
   * How many times each JSON-RPC method reached this server — `initialize` is a connection,
   * `tools/list` a listing. What a test of the listing cache, or of lazy connections, counts.
   */
  methodCounts: () => Record<string, number>
  resetMethodCounts: () => void
  close: () => Promise<void>
}

// Builds a fresh McpServer for each incoming HTTP request (see startMcpFixture below):
// the installed SDK (1.30.0) throws "Stateless transport cannot be reused across
// requests. Create a new transport per request." if a single StreamableHTTPServerTransport
// constructed with `sessionIdGenerator: undefined` is shared across requests — unlike what
// the brief's original one-transport-for-the-process-lifetime sketch assumed. See
// node_modules/@modelcontextprotocol/sdk/dist/esm/server/webStandardStreamableHttp.js.
const buildMcpServer = (record: (toolName: string) => void): McpServer => {
  const mcp = new McpServer({ name: 'fixture', version: '1.0.0' })
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
      const day = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10)
      // `reopens`, not `until`: with `until` the one-day market closure rendered as
      // "Closed From 2026-10-04 / Reopening 2026-10-04", which is self-contradictory. The ambiguity
      // (last closed day, or the day it reopens?) was the fixture's, and the agent had to guess.
      const CLOSURES: Record<string, Array<{ street: string, from: string, reopens: string, reason: string }>> = {
        'city-center': [
          { street: 'Rue de la Paix', from: day(-3), reopens: day(11), reason: 'water main replacement' },
          { street: 'Avenue Foch', from: day(1), reopens: day(3), reason: 'resurfacing' },
          { street: 'Place du Marche', from: day(5), reopens: day(6), reason: 'weekly market' }
        ],
        riverside: [
          { street: 'Quai des Chartrons', from: day(-1), reopens: day(20), reason: 'bridge inspection' }
        ]
      }
      // The argument SELECTS the rows, and an unknown district returns none.
      //
      // Previously `district` was echoed into the payload and otherwise ignored, so every value
      // returned the same three rows: the case proved the agent called the tool but not that it asked
      // the right question, and an agent passing "Bellecour" or "" was indistinguishable from a correct
      // one. Worse, the agent volunteers "let me know if you need another district" — so the next run
      // would confidently report Rue de la Paix as closed somewhere it is not.
      const key = String(district ?? '').trim().toLowerCase()
      const closures = CLOSURES[key] ?? []
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            district,
            known: key in CLOSURES,
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
    'ignored',
    { description: 'Exists so toolFilter has something to exclude', inputSchema: {} },
    async () => { record('ignored'); return { content: [{ type: 'text', text: 'ignored' }] } }
  )
  return mcp
}

export const startMcpFixture = async (port: number): Promise<McpFixture> => {
  let lastHeaders: Record<string, string | string[] | undefined> = {}
  // Ground truth for "was this tool actually CALLED". Listing tools also reaches this server,
  // so headers alone cannot distinguish a listing from an invocation.
  let invoked: string[] = []
  let methods: Record<string, number> = {}

  const server: Server = createServer((req, res) => {
    lastHeaders = req.headers
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
    const mcp = buildMcpServer(name => invoked.push(name))
    // The body is read here, to count methods, and handed to the transport already parsed.
    const chunks: Buffer[] = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => {
      let body: any
      try { body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : undefined } catch { body = undefined }
      for (const message of Array.isArray(body) ? body : body ? [body] : []) {
        if (typeof message?.method === 'string') methods[message.method] = (methods[message.method] ?? 0) + 1
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
    resetInvokedTools: () => { invoked = [] },
    methodCounts: () => ({ ...methods }),
    resetMethodCounts: () => { methods = {} },
    close: async () => { await new Promise<void>(resolve => server.close(() => resolve())) }
  }
}

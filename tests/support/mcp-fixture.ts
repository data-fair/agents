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

  const server: Server = createServer((req, res) => {
    lastHeaders = req.headers
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
    const mcp = buildMcpServer(name => invoked.push(name))
    mcp.connect(transport)
      .then(() => transport.handleRequest(req, res))
      .catch(() => { if (!res.headersSent) res.statusCode = 500; res.end() })
      .finally(() => { res.on('close', () => { transport.close().catch(() => {}) }) })
  })
  await new Promise<void>(resolve => server.listen(port, '127.0.0.1', resolve))

  return {
    port,
    lastHeaders: () => lastHeaders,
    invokedTools: () => [...invoked],
    resetInvokedTools: () => { invoked = [] },
    close: async () => { await new Promise<void>(resolve => server.close(() => resolve())) }
  }
}

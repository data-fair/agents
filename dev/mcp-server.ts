/**
 * A standalone MCP server for the dev environment.
 *
 * The `dev-review-*-mcp` catalog entries in api/config/development.js point at this server. The
 * `dev-public-mcp` / `dev-session-mcp` entries point at a DIFFERENT port, which during
 * tests is served by tests/support/mcp-fixture.ts for the life of a spec. Nothing served it outside
 * tests — so a seeded autonomous agent wired to those entries could show its recorded tool calls but
 * would fail with a 502 the moment someone posted a new message while reviewing the UI.
 *
 * Run it alongside the rest of the dev stack:
 *   npm run dev-mcp
 *
 * It reuses the test fixture rather than defining a second server, so what a human exercises by hand
 * is exactly what the suite exercises.
 */
import { startMcpFixture } from '../tests/support/mcp-fixture.ts'

const port = Number(process.env.NGINX_PORT) + 31
const fixture = await startMcpFixture(port)
console.log(`dev MCP server listening on http://localhost:${port}/mcp`)
console.log('tools: echo, get_schema, ignored')

const stop = async (signal: string) => {
  console.log(`\n${signal} — closing the dev MCP server`)
  await fixture.close()
  process.exit(0)
}
process.on('SIGINT', () => { stop('SIGINT').catch(() => process.exit(1)) })
process.on('SIGTERM', () => { stop('SIGTERM').catch(() => process.exit(1)) })

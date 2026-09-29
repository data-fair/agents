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

// Guarded rather than trusted: `Number(undefined) + 31` is NaN, and listen(NaN) binds a RANDOM free
// port while this prints "listening on http://localhost:NaN/mcp" and exits 0. dev/status.sh would
// then report dev-mcp DOWN for a process that looks perfectly healthy, and an agent wired to one of
// these catalog entries 502s — the confusing discovery this file's docblock is about.
if (!process.env.NGINX_PORT) {
  console.error('NGINX_PORT is not set — run through `npm run dev-mcp` (it loads .env), or re-run dev/init-env.sh')
  process.exit(1)
}
const port = Number(process.env.NGINX_PORT) + 31
if (!Number.isInteger(port)) {
  console.error(`NGINX_PORT is not a number: ${process.env.NGINX_PORT}`)
  process.exit(1)
}
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

/**
 * A standalone MCP server for the dev environment.
 *
 * The `dev-review-*-mcp` catalog entries in api/config/development.js point at this server. The
 * `dev-public-mcp` / `dev-session-mcp` entries point at a DIFFERENT port, which during
 * tests is served by tests/support/mcp-fixture.ts for the life of a spec. Nothing served it outside
 * tests — so a seeded autonomous agent wired to those entries could show its recorded tool calls but
 * would fail with a 502 the moment someone posted a new message while reviewing the UI.
 *
 * It is the `mcp` pane of the zellij layout (.zellij.kdl), on DEV_MCP_PORT.
 *
 * It reuses the test fixture rather than defining a second server, so what a human exercises by hand
 * is exactly what the suite exercises.
 */
import { startMcpFixture } from '../tests/support/mcp-fixture.ts'

// Guarded rather than trusted: `Number(undefined)` is NaN, and listen(NaN) binds a RANDOM free
// port while this prints "listening on http://localhost:NaN/mcp". `df-dev status` would then report
// the pane running for a server nobody can reach, and an agent wired to these catalog entries 502s —
// the confusing discovery this file's docblock is about.
const port = Number(process.env.DEV_MCP_PORT)
if (!Number.isInteger(port) || port <= 0) {
  console.error(`DEV_MCP_PORT is not set or not a number (${process.env.DEV_MCP_PORT}): run in the zellij session (it exports .env), or regenerate .env with "npx --no df-dev init-env --force"`)
  process.exit(1)
}
const fixture = await startMcpFixture(port)
console.log(`dev MCP server listening on http://localhost:${port}/mcp`)
console.log(`data-fair's stand-in (privateMcpUrl) on http://localhost:${port}/platform/mcp: list_road_closures, closure_stats and the exports, prefixed platform_`)
console.log('tools: echo, get_schema, ignored, list_road_closures, closure_stats (structuredContent: an object for a code_mode script, text for the model), import_table (takes a file), export_closures and export_my_profile (return a file link); files at /exports/')

const stop = async (signal: string) => {
  console.log(`\n${signal} — closing the dev MCP server`)
  await fixture.close()
  process.exit(0)
}
process.on('SIGINT', () => { stop('SIGINT').catch(() => process.exit(1)) })
process.on('SIGTERM', () => { stop('SIGTERM').catch(() => process.exit(1)) })

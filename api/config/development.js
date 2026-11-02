import { resolve } from 'node:path'
import dotenv from 'dotenv'
dotenv.config({ path: import.meta.resolve('../../.env').replace('file://', '') })

if (!process.env.DEV_API_PORT) throw new Error('missing DEV_API_PORT env variable, run "npx --no df-dev setup" to create the .env file')

export default {
  port: process.env.DEV_API_PORT,
  privateDirectoryUrl: `http://localhost:${process.env.SD_PORT}`,
  privateEventsUrl: `http://localhost:${process.env.EVENTS_PORT}`,
  // the mcp pane's stand-in for data-fair (dev/mcp-server.ts, tests/support/mcp-fixture.ts): its data tools only,
  // prefixed `platform_` so the built-in server never shadows a tool of the per-spec fixture (MCP_FIXTURE_PORT).
  privateMcpUrl: `http://localhost:${process.env.DEV_MCP_PORT}/platform/mcp`,
  mongoUrl: `mongodb://localhost:${process.env.MONGO_PORT}/data-fair-agents-development`,
  tmpDir: './tmp',
  observer: {
    active: false,
    port: process.env.DEV_OBSERVER_PORT
  },
  secretKeys: {
    events: 'secret-events',
    limits: 'secretlimits'
  },
  cipherPassword: 'test',
  upgradeRoot: '../',
  providers: [{ type: 'mock', id: 'global-mock', name: 'Global Mock', enabled: true }],
  models: [{ id: 'mock-model', name: 'Global Mock Model', provider: 'global-mock', usage: ['assistant', 'tools', 'summarizer', 'moderator'], inputPricePerMillion: 0, outputPricePerMillion: 0 }],
  defaultModels: { assistant: { provider: 'global-mock', id: 'mock-model' } },
  // Two MCP servers on two ports drawn in .env (dev/dev.json "ports"), so no literal port can be taken
  // on another checkout or in CI.
  mcpServers: (() => {
    // MCP_FIXTURE_PORT belongs to the TEST fixture, which each spec starts and stops itself. DEV_MCP_PORT
    // belongs to the long-running mcp pane, used for manual review and by the dev fixtures. They are
    // deliberately separate: they would otherwise fight over one port, and since the mcp pane is part of
    // the zellij layout that would make the api suite unrunnable in a normal dev session.
    const fixtureUrl = `http://localhost:${process.env.MCP_FIXTURE_PORT}/mcp`
    const reviewUrl = `http://localhost:${process.env.DEV_MCP_PORT}/mcp`
    return [
      // Served by the mcp pane, so a seeded autonomous agent keeps working while a human
      // reviews the UI and posts new messages.
      { id: 'dev-review-mcp', name: 'Dev Review MCP', url: reviewUrl, auth: 'none' },
      { id: 'dev-review-session-mcp', name: 'Dev Review MCP (as the agent)', url: reviewUrl, auth: 'nhi-session' },
      { id: 'dev-public-mcp', name: 'Dev Public MCP', url: fixtureUrl, auth: 'none' },
      { id: 'dev-session-mcp', name: 'Dev Session MCP', url: fixtureUrl, auth: 'nhi-session' },
      // Only entry that carries a credential — needed so the "no credentials in the
      // catalog" api test actually exercises the apiKey-stripping path instead of
      // trivially passing because no configured entry ever had a key to leak.
      { id: 'dev-apikey-mcp', name: 'Dev API-key MCP', url: fixtureUrl, auth: 'apiKey', apiKeyHeader: 'x-api-key', apiKey: 'dev-secret-value' }
    ]
  })(),
  // Both assistants get both MCP servers, session and anonymous. ORDER MATTERS: both servers list the
  // same tool names, and of two tools sharing a name the later reference's wins. The test fixture's
  // entries come last, so a spec reaches the fixture it started; in a manual session that fixture is
  // down, its entries are skipped, and the mcp pane serves the calls.
  personalAssistants: (() => {
    const mcpServers = ['dev-review-mcp', 'dev-review-session-mcp', 'dev-public-mcp', 'dev-session-mcp'].map(serverId => ({ serverId }))
    return { portal: { mcpServers }, backOffice: { mcpServers } }
  })(),
  // uncapped in dev/test: the production default of 0 would block every
  // account that has not been pushed a limit, which most specs never do
  defaultLimits: { credits: -1 },
  // The file store of autonomous agents, on a local directory (gitignored). publicUrl is the API itself on
  // its dev port: the dev MCP fixture fetches signed file URLs there directly, as an internal request.
  files: {
    storage: 'fs',
    dataDir: resolve(import.meta.dirname, '../../dev/data/files'),
    secret: 'dev-files-secret-not-for-production-0123456789',
    publicUrl: `http://localhost:${process.env.DEV_API_PORT}`
  }
}

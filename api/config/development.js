import dotenv from 'dotenv'
dotenv.config({ path: import.meta.resolve('../../.env').replace('file://', '') })

if (!process.env.DEV_API_PORT) throw new Error('missing DEV_API_PORT env variable, use "source dev/init-env.sh" to init .env file')

export default {
  port: process.env.DEV_API_PORT,
  privateDirectoryUrl: `http://localhost:${process.env.SD_PORT}`,
  privateEventsUrl: `http://localhost:${process.env.EVENTS_PORT}`,
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
  evaluatorAccount: { type: 'organization', id: 'test1' },
  providers: [{ type: 'mock', id: 'global-mock', name: 'Global Mock', enabled: true }],
  models: [{ id: 'mock-model', name: 'Global Mock Model', provider: 'global-mock', usage: ['assistant', 'tools', 'summarizer', 'evaluator', 'moderator'], inputPricePerMillion: 0, outputPricePerMillion: 0 }],
  defaultModels: { assistant: { provider: 'global-mock', id: 'mock-model' } },
  // The api-test MCP fixture (tests/support/mcp-fixture.ts) listens on this port. It is
  // DERIVED, not hardcoded: dev/init-env.sh assigns a RANDOM base port and allocates
  // base..base+22, so any literal port is free on one checkout and taken on another (and in
  // CI). +30 sits clear of that range. The test computes the same expression.
  mcpServers: (() => {
    // +30 belongs to the TEST fixture, which each spec starts and stops itself. +31 belongs to the
    // long-running `npm run dev-mcp`, used for manual review and by the dev fixtures. They are
    // deliberately separate: they would otherwise fight over one port, and since dev-mcp is part of
    // the zellij layout that would make the api suite unrunnable in a normal dev session.
    const fixtureUrl = `http://localhost:${Number(process.env.NGINX_PORT) + 30}/mcp`
    const reviewUrl = `http://localhost:${Number(process.env.NGINX_PORT) + 31}/mcp`
    return [
      { id: 'dev-public-mcp', name: 'Dev Public MCP', url: fixtureUrl, auth: 'none' },
      { id: 'dev-session-mcp', name: 'Dev Session MCP', url: fixtureUrl, auth: 'nhi-session' },
      // Served by `npm run dev-mcp`, so a seeded autonomous agent keeps working while a human
      // reviews the UI and posts new messages.
      { id: 'dev-review-mcp', name: 'Dev Review MCP', url: reviewUrl, auth: 'none' },
      { id: 'dev-review-session-mcp', name: 'Dev Review MCP (as the agent)', url: reviewUrl, auth: 'nhi-session' },
      // Only entry that carries a credential — needed so the "no credentials in the
      // catalog" api test actually exercises the apiKey-stripping path instead of
      // trivially passing because no configured entry ever had a key to leak.
      { id: 'dev-apikey-mcp', name: 'Dev API-key MCP', url: fixtureUrl, auth: 'apiKey', apiKeyHeader: 'x-api-key', apiKey: 'dev-secret-value' }
    ]
  })(),
  // Dev-only keypair, generated for this plan and round-trip verified. NEVER reuse a
  // committed key in a real deployment.
  nhiSigningKey: { kty: 'EC', crv: 'P-256', x: 'iuGRxiUsSj4YmAvrp3XpXGnvttc6ruQIYakEVp-B4Ig', y: 'nF0kPlKpzNztlqKozkb9T4sHl_sCD1M6ngrpwEnTL-M', d: 'Hv71PS5oK6z6bqiRT-nq62cmgauiaCreaO-zmS30-6Q', kid: 'dev-1', alg: 'ES256' },
  // uncapped in dev/test: the production default of 0 would block every
  // account that has not been pushed a limit, which most specs never do
  defaultLimits: { credits: -1 }
}

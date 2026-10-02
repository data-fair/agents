export default {
  privateDirectoryUrl: 'http://simple-directory:8080',
  privateEventsUrl: undefined,
  mongoUrl: 'mongodb://localhost:27017/data-fair-agents',
  port: 8080,
  tmpDir: '/tmp',
  observer: {
    active: true,
    port: 9090
  },
  secretKeys: {
    events: undefined,
    limits: undefined
  },
  cipherPassword: undefined,
  upgradeRoot: '/app/',
  requireAnonymousActionToken: true,
  providers: [],
  models: [],
  mcpServers: [],
  // Progressive exposure: while true, configuring an autonomous agent additionally
  // requires admin mode. This is a rollout control, not an ownership boundary —
  // nothing in the document is durably superadmin-owned, and flipping this to false
  // opens configuration to org admins with no schema change and no migration.
  autonomousAgentsRequireAdminMode: true,
  // ES256 private JWK used to sign NHI assertions. Absent = the autonomous agent NHI
  // feature is off: the issuer routes 404 and no assertion can be minted. The issuer
  // identifier is captured per-request from the proxied request that enrols an
  // autonomous agent (reqSiteUrl) rather than configured here.
  nhiSigningKey: undefined,
  defaultModels: {},
  // Euros of inference cost per credit. 0.008 EUR lets a credit resell for about a
  // euro cent with an implicit 20% margin. It MUST match the credit cost in
  // customers/docs/ai-credits-pricing.md — if the two drift, every margin in that
  // document moves and nothing in either codebase says so.
  eurosPerCredit: 0.008,
  // 0 = accounts start capped until the customers service (or an ops admin)
  // pushes them a real limit. Set DEFAULT_CREDITS to -1 for an uncapped
  // deployment, e.g. a self-hosted instance using its own provider keys.
  defaultLimits: { credits: 0 },
  // Share of the assistant model's context window above which the chat client
  // compacts conversation history. Global rather than per-account: it is a
  // safety/efficiency tuning knob, not something an org should have to reason
  // about. See docs/architecture/compaction.md.
  compactionPercent: 70,
  // Bounds one autonomous agent turn. Global rather than per-agent: nothing has asked for
  // per-agent tuning, and the account credit cap still applies on top of this.
  //
  // Scale matters: with eurosPerCredit 0.008 this is ~€4 of model spend per turn. The
  // first value here was 5 credits — €0.04 — which a single step against a €2.50/M model
  // with a 30k-token context blows immediately, so every multi-tool turn would have ended
  // at 'budget' on step one. This is a ceiling for a runaway, not a per-turn allowance.
  autonomousAgentRunCredits: 500,
  // Wall-clock ceiling for one turn. A model or MCP server that hangs must not hold a
  // conversation's lock until the lock's own TTL expires.
  autonomousAgentRunTimeoutSeconds: 300
}

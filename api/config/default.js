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
  evaluatorAccount: null,
  github: { token: undefined },
  providers: [],
  models: [],
  defaultModels: {},
  // Euros of inference cost per credit. The peg is the reference model's input price
  // (deepseek-v4-flash-0731 on Scaleway, 0.40 EUR/M), and it MUST match the reference
  // price in customers/docs/ai-credits-pricing.md — if the two drift, every margin in
  // that document moves and nothing in either codebase says so.
  eurosPerCredit: 0.4,
  // 0 = accounts start capped until the customers service (or an ops admin)
  // pushes them a real limit. Set DEFAULT_CREDITS to -1 for an uncapped
  // deployment, e.g. a self-hosted instance using its own provider keys.
  defaultLimits: { credits: 0 },
  // Share of the assistant model's context window above which the chat client
  // compacts conversation history. Global rather than per-account: it is a
  // safety/efficiency tuning knob, not something an org should have to reason
  // about. See docs/architecture/compaction.md.
  compactionPercent: 70
}

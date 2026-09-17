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
    events: undefined
  },
  cipherPassword: undefined,
  upgradeRoot: '/app/',
  currency: 'EUR',
  requireAnonymousActionToken: true,
  evaluatorAccount: null,
  github: { token: undefined },
  // Share of the assistant model's context window above which the chat client
  // compacts conversation history. Global rather than per-account: it is a
  // safety/efficiency tuning knob, not something an org should have to reason
  // about. See docs/architecture/compaction.md.
  compactionPercent: 70
}

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
  outputTokenWeight: 4,
  // 0 = accounts start capped until the customers service (or an ops admin)
  // pushes them a real limit. Set DEFAULT_CREDITS to -1 for an uncapped
  // deployment, e.g. a self-hosted instance using its own provider keys.
  defaultLimits: { credits: 0 }
}

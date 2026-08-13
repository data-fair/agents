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
  defaultLimits: { credits: -1 }
}

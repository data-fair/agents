export default {
  mongoUrl: 'MONGO_URL',
  port: 'PORT',
  privateDirectoryUrl: 'PRIVATE_DIRECTORY_URL',
  privateEventsUrl: 'PRIVATE_EVENTS_URL',
  secretKeys: {
    events: 'SECRET_EVENTS',
    limits: 'SECRET_LIMITS'
  },
  observer: {
    active: 'OBSERVER_ACTIVE',
    port: 'OBSERVER_PORT'
  },
  upgradeRoot: 'UPGRADE_ROOT',
  cipherPassword: 'CIPHER_PASSWORD',
  currency: 'CURRENCY',
  requireAnonymousActionToken: 'REQUIRE_ANONYMOUS_ACTION_TOKEN',
  evaluatorAccount: {
    type: 'EVALUATOR_ACCOUNT_TYPE',
    id: 'EVALUATOR_ACCOUNT_ID'
  },
  github: { token: 'GITHUB_TOKEN' },
  providers: { __name: 'PROVIDERS', __format: 'json' },
  models: { __name: 'MODELS', __format: 'json' },
  defaultModels: { __name: 'DEFAULT_MODELS', __format: 'json' },
  outputTokenWeight: 'OUTPUT_TOKEN_WEIGHT',
  defaultLimits: { credits: 'DEFAULT_CREDITS' }
}

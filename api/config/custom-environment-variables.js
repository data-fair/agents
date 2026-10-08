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
  requireAnonymousActionToken: 'REQUIRE_ANONYMOUS_ACTION_TOKEN',
  providers: { __name: 'PROVIDERS', __format: 'json' },
  models: { __name: 'MODELS', __format: 'json' },
  mcpServers: { __name: 'MCP_SERVERS', __format: 'json' },
  autonomousAgentsRequireAdminMode: { __name: 'AUTONOMOUS_AGENTS_REQUIRE_ADMIN_MODE', __format: 'json' },
  tasks: {
    minIntervalSeconds: { __name: 'TASKS_MIN_INTERVAL_SECONDS', __format: 'json' },
    maxPerAgent: { __name: 'TASKS_MAX_PER_AGENT', __format: 'json' },
    pollSeconds: { __name: 'TASKS_POLL_SECONDS', __format: 'json' },
    maxConsecutiveFailures: { __name: 'TASKS_MAX_CONSECUTIVE_FAILURES', __format: 'json' }
  },
  nhiSigningKey: { __name: 'NHI_SIGNING_KEY', __format: 'json' },
  defaultModels: { __name: 'DEFAULT_MODELS', __format: 'json' },
  eurosPerCredit: 'EUROS_PER_CREDIT',
  defaultLimits: { credits: 'DEFAULT_CREDITS' },
  compactionPercent: {
    __name: 'COMPACTION_PERCENT',
    __format: 'json'
  },
  turnCredits: {
    __name: 'TURN_CREDITS',
    __format: 'json'
  },
  turnTimeoutSeconds: {
    __name: 'TURN_TIMEOUT_SECONDS',
    __format: 'json'
  }
}

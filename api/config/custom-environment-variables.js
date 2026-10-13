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
  },
  shutdownGraceSeconds: {
    __name: 'SHUTDOWN_GRACE_SECONDS',
    __format: 'json'
  },
  taskTimeoutSeconds: {
    __name: 'TASK_TIMEOUT_SECONDS',
    __format: 'json'
  },
  codeModeMaxWorkers: {
    __name: 'CODE_MODE_MAX_WORKERS',
    __format: 'json'
  },
  files: {
    storage: 'FILES_STORAGE',
    dataDir: 'FILES_DATA_DIR',
    secret: 'FILES_SECRET',
    publicUrl: 'FILES_PUBLIC_URL',
    s3: {
      region: 'FILES_S3_REGION',
      endpoint: 'FILES_S3_ENDPOINT',
      bucket: 'FILES_S3_BUCKET',
      credentials: {
        accessKeyId: 'FILES_S3_ACCESS_KEY_ID',
        secretAccessKey: 'FILES_S3_SECRET_ACCESS_KEY'
      },
      forcePathStyle: { __name: 'FILES_S3_FORCE_PATH_STYLE', __format: 'json' }
    }
  }
}

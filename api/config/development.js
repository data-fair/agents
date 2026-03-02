import 'dotenv/config'

export default {
  port: process.env.DEV_API_PORT ? parseInt(process.env.DEV_API_PORT) : 8080,
  privateDirectoryUrl: process.env.SD_PORT ? `http://localhost:${process.env.SD_PORT}` : 'http://simple-directory:8080',
  privateEventsUrl: process.env.EVENTS_PORT ? `http://localhost:${process.env.EVENTS_PORT}` : undefined,
  mongoUrl: process.env.MONGO_PORT ? `mongodb://localhost:${process.env.MONGO_PORT}/data-fair-agents-development` : 'mongodb://localhost:27017/data-fair-agents-development',
  tmpDir: './tmp',
  observer: {
    active: false,
    port: process.env.DEV_OBSERVER_PORT ? parseInt(process.env.DEV_OBSERVER_PORT) : 9090
  },
  secretKeys: {
    admin: 'secret-admin-key'
  },
  cipherPassword: 'test',
  upgradeRoot: '../'
}

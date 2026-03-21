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
    events: 'secret-events'
  },
  cipherPassword: 'test',
  upgradeRoot: '../'
}

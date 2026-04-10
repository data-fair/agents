import { createServer } from 'node:http'
import { session } from '@data-fair/lib-express/index.js'
import { startObserver, stopObserver, internalError } from '@data-fair/lib-node/observer.js'
import eventPromise from '@data-fair/lib-utils/event-promise.js'
import eventsQueue from '@data-fair/lib-node/events-queue.js'
import locks from '@data-fair/lib-node/locks.js'
// import upgradeScripts from '@data-fair/lib-node/upgrade-scripts.js'
import { createHttpTerminator } from 'http-terminator'
import { app } from './app.ts'
import config from '#config'
import mongo from '#mongo'
import { cleanupOldUsage } from './usage/cleanup.ts'

const server = createServer(app)
const httpTerminator = createHttpTerminator({ server })
let cleanupInterval: ReturnType<typeof setInterval> | undefined

server.keepAliveTimeout = (60 * 1000) + 1000
server.headersTimeout = (60 * 1000) + 2000

export const start = async () => {
  if (config.observer?.active) await startObserver(config.observer.port)
  session.init(config.privateDirectoryUrl)
  await mongo.init()
  await locks.start(mongo.db)
  // await upgradeScripts(mongo.db, locks, config.upgradeRoot)

  if (config.privateEventsUrl) {
    if (!config.secretKeys?.events) {
      internalError('agents', 'Missing secretKeys.events in config')
    } else {
      await eventsQueue.start({ eventsUrl: config.privateEventsUrl, eventsSecret: config.secretKeys.events })
    }
  }

  cleanupOldUsage().catch(err => console.error('initial usage cleanup failed', err))
  cleanupInterval = setInterval(() => {
    cleanupOldUsage().catch(err => console.error('usage cleanup failed', err))
  }, 24 * 60 * 60 * 1000)

  server.listen(config.port)
  await eventPromise(server, 'listening')

  console.log(`API server listening on port ${config.port}`)
}

export const stop = async () => {
  if (cleanupInterval) clearInterval(cleanupInterval)
  await httpTerminator.terminate()
  if (config.observer?.active) await stopObserver()
  await locks.stop()
  await mongo.client.close()
}

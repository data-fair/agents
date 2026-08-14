import { createServer } from 'node:http'
import { session } from '@data-fair/lib-express/index.js'
import { startObserver, stopObserver, internalError } from '@data-fair/lib-node/observer.js'
import eventPromise from '@data-fair/lib-utils/event-promise.js'
import eventsQueue from '@data-fair/lib-node/events-queue.js'
import locks from '@data-fair/lib-node/locks.js'
import upgradeScripts from '@data-fair/lib-node/upgrade-scripts.js'
import { createHttpTerminator } from 'http-terminator'
import { app } from './app.ts'
import config from '#config'
import mongo from '#mongo'
import { cleanupOldUsage } from './usage/cleanup.ts'

/**
 * Run pending upgrade/<version>/*.js migrations (see @data-fair/lib-node/upgrade-scripts.js).
 *
 * IMPORTANT quirk of the vendored lib: when no service version has ever been
 * recorded (the `services` collection has no doc for this service — true of
 * every deployment right now, since upgradeScripts was disabled until this
 * release) it filters the runnable scripts down to folders literally named
 * `init` BEFORE it even looks at an `isFresh` callback. That filtering
 * happens unconditionally, so passing `isFresh` cannot make a version-named
 * folder (like `upgrade/0.10.0`) run on that first invocation — confirmed
 * empirically: calling upgradeScripts(db, locks, base, async () => false)
 * against a version-named folder never executes it. It also cannot rely on a
 * folder named `init`: any folder name that isn't valid semver makes
 * semver.gte() throw the moment the version becomes truthy, and once this
 * script's run records a version in `services`, every later restart would
 * hit that path with `previousPersion` truthy and crash on startup trying to
 * parse "init" as a version.
 *
 * So the fresh-vs-legacy distinction is handled here instead of via
 * `isFresh`: if this service has never recorded a version AND the `settings`
 * collection is non-empty (i.e. this is an existing deployment adopting the
 * mechanism for the first time, not a brand-new install), we pre-seed the
 * `services` doc with version '0.0.0'. That makes the lib take its normal
 * "previousPersion is set" path, which does run every folder whose semver is
 * >= that recorded version — including upgrade/0.10.0 — while a genuinely
 * fresh install (no settings yet) is left alone and records its version with
 * nothing to migrate, exactly as intended.
 */
const runUpgradeScripts = async () => {
  const services = mongo.db.collection<{ id: string, version: string }>('services')
  const alreadyRecorded = await services.findOne({ id: 'agents' })
  if (!alreadyRecorded) {
    const hasLegacyData = await mongo.settings.countDocuments({}) > 0
    if (hasLegacyData) {
      await services.updateOne({ id: 'agents' }, { $set: { id: 'agents', version: '0.0.0' } }, { upsert: true })
    }
  }
  await upgradeScripts(mongo.db, locks, config.upgradeRoot)
}

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
  await runUpgradeScripts()

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
  if (!config.secretKeys?.limits) {
    console.log('[limits] No SECRET_LIMITS configured: the /api/v1/limits routes will reject every ?key= push/read and fall back to session auth only (fail-closed). Set SECRET_LIMITS if this instance is meant to receive credit allowances from the customers service.')
  }
  if (config.defaultLimits?.credits === -1 && ((config.providers?.length ?? 0) > 0 || (config.models?.length ?? 0) > 0)) {
    console.log('[credits] DEFAULT_CREDITS is left at its default of -1 (unlimited) while global PROVIDERS/MODELS are configured: EVERY account on this deployment — including every user\'s personal account, and any account no superadmin has ever configured — can consume the deployment\'s own provider API keys with no credit cap. Set DEFAULT_CREDITS to a finite number of credits if accounts should be capped until the customers service pushes them a real limit.')
  }
  if (!config.github?.token) {
    console.log('[github] No GITHUB_TOKEN configured: the trace evaluator\'s source exploration (explore_github) will use unauthenticated GitHub (60 requests/hour/IP). To raise the limit to 5000/hour, create a fine-grained personal access token with public read-only access at https://github.com/settings/tokens and set the GITHUB_TOKEN environment variable on the container.')
  }
}

export const stop = async () => {
  if (cleanupInterval) clearInterval(cleanupInterval)
  await httpTerminator.terminate()
  if (config.observer?.active) await stopObserver()
  await locks.stop()
  await mongo.client.close()
}

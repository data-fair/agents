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
import { recoverOwnerlessRuns } from './conversations/executor.ts'
import { recoverOwnerlessTaskRuns } from './tasks/execution.ts'
import { purgeExpiredArchives, purgeAbandonedAnonymous } from './conversations/service.ts'
import { startAgentSessions } from './agent-session/service.ts'
import { sessionFor } from './agent-session/registry.ts'
import { liveRuns } from './conversations/live-runs.ts'
import { stopAcceptingTurns, drainLiveRuns } from './conversations/shutdown.ts'
import { sweepConsolidations } from './memory/consolidation.ts'
import { fileStore, sweepFilesOnce } from './files/service.ts'
import { runSchedulerPass } from './tasks/scheduler.ts'
import { configureCodeMode } from './code-mode/tool.ts'

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
const intervals: ReturnType<typeof setInterval>[] = []
let agentSessions: ReturnType<typeof startAgentSessions> | undefined

server.keepAliveTimeout = (60 * 1000) + 1000
server.headersTimeout = (60 * 1000) + 2000

/** A background job: every `ms`, and once at start when `now`. A failed pass is logged, never thrown. */
const every = (ms: number, name: string, job: () => Promise<unknown>, opts: { now?: boolean } = {}) => {
  const run = () => { job().catch(err => console.error(`${name} failed`, err)) }
  if (opts.now) run()
  intervals.push(setInterval(run, ms))
}

/**
 * In development, the real-clock jobs leave `test*` owners alone: the api specs drive those owners'
 * scheduler and consolidation passes through the test-env seams, with an injected clock, and a real
 * pass would claim their slots first.
 */
const realClockScope = process.env.NODE_ENV === 'development' ? { 'owner.id': { $not: /^test/ } } : {}

export const start = async () => {
  if (config.observer?.active) await startObserver(config.observer.port)
  session.init(config.privateDirectoryUrl)
  // code_mode's worker pool is per process and refuses when full (api/src/code-mode/tool.ts).
  configureCodeMode(config.codeModeMaxWorkers)
  await mongo.init()
  await locks.start(mongo.db)
  await runUpgradeScripts()

  // BEFORE the recovery pass: a task run it interrupts is notified (tasks/follow-up.ts, afterTaskRun),
  // and pushing to a queue not yet started throws.
  if (config.privateEventsUrl) {
    if (!config.secretKeys?.events) {
      internalError('agents', 'Missing secretKeys.events in config')
    } else {
      await eventsQueue.start({ eventsUrl: config.privateEventsUrl, eventsSecret: config.secretKeys.events })
    }
  }

  // A restart cannot resume a run (the executor is in-process and non-resumable), so any
  // run still marked running belongs to a dead process. Mark it interrupted so a reader
  // sees an honest terminal state instead of a turn that appears to be thinking forever.
  await recoverOwnerlessRuns()
  await recoverOwnerlessTaskRuns()

  // A queued run whose holder died is only picked up when someone posts to that conversation
  // again, which may be never. This reaper makes "running with nobody running it" recoverable
  // without a restart. The interval is well inside the 60s lock TTL, so it does not fight a
  // live holder.
  // realClockScope: a spec inserts unlocked `running` runs on purpose and drives recovery through test-env; this
  // pass closing one between two of its requests made the spec flaky.
  every(30 * 1000, 'autonomous agent recovery', () => Promise.all([recoverOwnerlessRuns(realClockScope), recoverOwnerlessTaskRuns(realClockScope)]))

  every(24 * 60 * 60 * 1000, 'usage cleanup', cleanupOldUsage, { now: true })

  // Archived conversations past the review window. A sweep rather than a mongo TTL index because a
  // TTL deletes only the document it indexes: this thread's messages and runs live in their own
  // collections and would be left orphaned, still readable by id, which for data that was supposed
  // to have expired is the whole failure. Daily is ample for a 30-day window.
  every(24 * 60 * 60 * 1000, 'archive purge', () => purgeExpiredArchives(), { now: true })

  // Anonymous threads whose socket never ran its close handler. Hourly, so one outlives its
  // abandonment cutoff by an hour at most.
  every(60 * 60 * 1000, 'anonymous purge', purgeAbandonedAnonymous, { now: true })

  // Memory consolidation, at most daily per agent and only after activity (api/src/memory/consolidation.ts).
  // Checked every 15 minutes; per-agent locks make concurrent instances harmless.
  every(15 * 60 * 1000, 'memory consolidation sweep', () => sweepConsolidations(new Date(), realClockScope))

  // AGENT FILES (api/src/files): a store that cannot be reached fails the boot, as data-fair's does; then
  // the one cleanup, hourly — a file outlives its 7 days by an hour at most.
  const files = fileStore()
  if (files) {
    await files.checkAccess()
    every(60 * 60 * 1000, 'file sweep', sweepFilesOnce, { now: true })
  }

  // PLANNED TASKS: every pollSeconds, claim and fire the tasks that are due (api/src/tasks/scheduler.ts).
  // Every instance polls; the claim is an atomic advance of nextRunAt, so exactly one fires a slot.
  every(config.tasks.pollSeconds * 1000, 'task scheduler pass', () => runSchedulerPass(new Date(), realClockScope))

  // Before server.listen, so the socket endpoint exists when the http server starts accepting connections.
  agentSessions = startAgentSessions(server)

  server.listen(config.port)
  await eventPromise(server, 'listening')

  console.log(`API server listening on port ${config.port}`)
  if (!config.secretKeys?.limits) {
    console.log('[limits] No SECRET_LIMITS configured: the /api/v1/limits routes will reject every ?key= push/read and fall back to session auth only (fail-closed). Set SECRET_LIMITS if this instance is meant to receive credit allowances from the customers service.')
  }
  const globalAiConfigured = (config.providers?.length ?? 0) > 0 || (config.models?.length ?? 0) > 0
  if ((config.defaultLimits?.credits ?? 0) < 0 && globalAiConfigured) {
    console.log('[credits] DEFAULT_CREDITS is negative (unlimited) while global PROVIDERS/MODELS are configured: EVERY account on this deployment — including every user\'s personal account, and any account no superadmin has ever configured — can consume the deployment\'s own provider API keys with no credit cap. Leave it at the default of 0 if accounts should stay capped until the customers service pushes them a real limit.')
  }
  if (config.defaultLimits?.credits === 0 && globalAiConfigured && !config.secretKeys?.limits) {
    console.log('[credits] DEFAULT_CREDITS is 0 (accounts start capped) but no SECRET_LIMITS is configured, so the customers service cannot push allowances: every account will be refused until an allowance is set manually via POST /api/v1/limits/:type/:id in admin mode. Set DEFAULT_CREDITS to -1 for an uncapped deployment, or configure SECRET_LIMITS.')
  }
  if (!config.nhiSigningKey) {
    console.log('[nhi] No NHI_SIGNING_KEY configured: the autonomous agent non-human-identity feature is off. The issuer routes return 404 and no autonomous agent can obtain a session or reach an MCP server. Set NHI_SIGNING_KEY (an ES256 private JWK) to enable it.')
  }
}

export const stop = async () => {
  for (const interval of intervals.splice(0)) clearInterval(interval)
  // Let the running turns finish instead of dying with the process (live-runs.ts, SHUTDOWN): no new turn
  // begins here, sessions with nothing running are closed so their next message reaches a healthy
  // instance, and the rest get the grace period before being stopped as "the server restarted".
  stopAcceptingTurns()
  // At each poll, so a person whose turn has just finished is moved on at once rather than refused until
  // the others are done.
  const closeIdleSessions = () => {
    const watching = new Set([...liveRuns.values()].flatMap(live => {
      const watcher = live.conversationId ? sessionFor(live.conversationId) : undefined
      return watcher ? [watcher] : []
    }))
    agentSessions?.closeAllBut(watching)
  }
  const drained = await drainLiveRuns(liveRuns, config.shutdownGraceSeconds * 1000, { onTick: closeIdleSessions })
  if (drained.finished || drained.stopped) console.log(`shutdown: ${drained.finished} turn(s) finished, ${drained.stopped} stopped at the end of the grace period`)
  // After the drain: a task run closing in it notifies through the queue.
  await eventsQueue.stop?.()
  // Before the HTTP server goes: a connected browser holding a turn open must be told rather than
  // left with a socket that stops answering, and every pending browser tool call has to fail so the
  // turn waiting on it can finish.
  if (agentSessions) await agentSessions.close()
  await httpTerminator.terminate()
  if (config.observer?.active) await stopObserver()
  await locks.stop()
  await mongo.client.close()
}

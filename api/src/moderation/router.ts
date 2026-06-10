/**
 * router.ts contains the HTTP layer logic and stateful logic
 * it should not be imported anywhere else than app.ts
 * Admin-only observability endpoints — unlike its v1 ancestor, every route here
 * requires the account admin role; only the probe touches an LLM.
 */
import mongo from '#mongo'
import { Router } from 'express'
import { type AccountKeys, assertAccountRole, reqSessionAuthenticated } from '@data-fair/lib-express'
import { getRawSettings } from '../settings/service.ts'
import { runProbe } from './service.ts'

const router = Router()
export default router

const DAY_MS = 24 * 60 * 60 * 1000

router.get('/:type/:id/stats', async (req, res) => {
  const session = reqSessionAuthenticated(req)
  const owner = req.params as unknown as AccountKeys
  assertAccountRole(session, owner, 'admin')
  const ownerFilter = { 'owner.type': owner.type, 'owner.id': owner.id }
  const days = Math.min(Math.max(parseInt(String(req.query.days ?? '30'), 10) || 30, 1), 30)
  const since = new Date(Date.now() - days * DAY_MS)
  const last24h = new Date(Date.now() - DAY_MS)

  const [actionCounts, latency, recent] = await Promise.all([
    mongo.moderationEvents.aggregate([
      { $match: { ...ownerFilter, createdAt: { $gte: since } } },
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]).toArray(),
    // verdict latency over real checks (cached lookups and refusals excluded)
    mongo.moderationEvents.aggregate([
      { $match: { ...ownerFilter, createdAt: { $gte: since }, cached: { $ne: true }, action: { $ne: 'strike-refusal' } } },
      { $group: { _id: null, avg: { $avg: '$latencyMs' }, p95: { $percentile: { input: '$latencyMs', p: [0.95], method: 'approximate' } } } }
    ] as any[]).toArray(),
    // the silent-breakage alarm sample: last 24h fail-open rate
    mongo.moderationEvents.aggregate([
      { $match: { ...ownerFilter, createdAt: { $gte: last24h }, action: { $ne: 'strike-refusal' } } },
      { $group: { _id: null, checks: { $sum: 1 }, failOpen: { $sum: { $cond: [{ $in: ['$action', ['fail-open-timeout', 'fail-open-error']] }, 1, 0] } } } }
    ]).toArray()
  ])

  const totals: Record<string, number> = {}
  for (const row of actionCounts) totals[String(row._id)] = row.count
  res.json({
    totals,
    latency: { avg: latency[0]?.avg ?? null, p95: (latency[0] as any)?.p95?.[0] ?? null },
    last24h: { checks: recent[0]?.checks ?? 0, failOpen: recent[0]?.failOpen ?? 0 }
  })
})

router.get('/:type/:id/events', async (req, res) => {
  const session = reqSessionAuthenticated(req)
  const owner = req.params as unknown as AccountKeys
  assertAccountRole(session, owner, 'admin')
  const size = Math.min(Math.max(parseInt(String(req.query.size ?? '20'), 10) || 20, 1), 200)
  const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1)
  const filter: Record<string, any> = {
    'owner.type': owner.type,
    'owner.id': owner.id,
    ...(req.query.action ? { action: String(req.query.action) } : {})
  }
  const [results, count] = await Promise.all([
    mongo.moderationEvents.find(filter, { projection: { _id: 0 } })
      .sort({ createdAt: -1 }).skip((page - 1) * size).limit(size).toArray(),
    mongo.moderationEvents.countDocuments(filter)
  ])
  res.json({ count, results })
})

router.post('/:type/:id/probe', async (req, res) => {
  const session = reqSessionAuthenticated(req)
  const owner = req.params as unknown as AccountKeys
  assertAccountRole(session, owner, 'admin')
  const settings = await getRawSettings(owner)
  if (!settings?.models?.assistant?.model) {
    res.status(404).json({ error: { message: 'Agent not configured', type: 'invalid_request_error' } })
    return
  }
  res.json({ results: await runProbe(settings, owner) })
})

/**
 * router.ts contains the HTTP layer logic and stateful logic
 * it should not be imported anywhere else than app.ts
 */
import mongo from '#mongo'
import { Router } from 'express'
import { type AccountKeys, assertAccountRole, reqSessionAuthenticated } from '@data-fair/lib-express'

const router = Router()
export default router

// Fetch a stored conversation by its (globally unique) id, resolving the owning
// account from the stored documents and authorizing against it. Registered before
// the `/:type/:id` param route so the literal `conversation` segment wins.
router.get('/conversation/:conversationId', async (req, res) => {
  const session = reqSessionAuthenticated(req)
  const results = await mongo.traceRequests
    .find({ 'conversation.id': req.params.conversationId }, { projection: { _id: 0 } })
    .sort({ createdAt: 1 })
    .toArray()
  if (!results.length) { res.status(404).send(); return }
  const owner = results[0].owner as AccountKeys
  assertAccountRole(session, owner, 'admin')
  res.json({ owner: { type: owner.type, id: owner.id }, results })
})

router.get('/:type/:id', async (req, res) => {
  const session = reqSessionAuthenticated(req)
  const owner = req.params as unknown as AccountKeys
  assertAccountRole(session, owner, 'admin')

  const ownerFilter = { 'owner.type': owner.type, 'owner.id': owner.id }
  const size = Math.min(Math.max(parseInt(String(req.query.size ?? '20'), 10) || 20, 1), 200)
  const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1)

  const grouped = await mongo.traceRequests.aggregate([
    { $match: ownerFilter },
    { $sort: { createdAt: 1 } },
    {
      $group: {
        _id: '$conversation.id',
        startedAt: { $first: '$createdAt' },
        userName: { $first: '$userName' },
        userId: { $first: '$userId' },
        firstBody: { $first: '$request.body' },
        requestCount: { $sum: 1 }
      }
    },
    // $facet sub-pipelines don't inherit a guaranteed order from the parent pipeline,
    // so the results branch sorts newest-first itself.
    { $facet: { results: [{ $sort: { startedAt: -1 } }, { $skip: (page - 1) * size }, { $limit: size }], total: [{ $count: 'count' }] } }
  ]).toArray()

  const facet = grouped[0] ?? { results: [], total: [] }
  res.json({
    count: facet.total[0]?.count ?? 0,
    results: facet.results.map((r: any) => ({
      conversationId: r._id,
      startedAt: r.startedAt,
      userName: r.userName,
      userId: r.userId,
      requestCount: r.requestCount,
      preview: firstUserMessage(r.firstBody)
    }))
  })
})

router.get('/:type/:id/:conversationId', async (req, res) => {
  const session = reqSessionAuthenticated(req)
  const owner = req.params as unknown as AccountKeys
  assertAccountRole(session, owner, 'admin')
  const results = await mongo.traceRequests
    .find({ 'owner.type': owner.type, 'owner.id': owner.id, 'conversation.id': req.params.conversationId }, { projection: { _id: 0 } })
    .sort({ createdAt: 1 })
    .toArray()
  res.json({ results })
})

router.delete('/:type/:id/:conversationId', async (req, res) => {
  const session = reqSessionAuthenticated(req)
  const owner = req.params as unknown as AccountKeys
  assertAccountRole(session, owner, 'admin')
  await mongo.traceRequests.deleteMany({ 'owner.type': owner.type, 'owner.id': owner.id, 'conversation.id': req.params.conversationId })
  res.status(204).send()
})

router.delete('/:type/:id', async (req, res) => {
  const session = reqSessionAuthenticated(req)
  const owner = req.params as unknown as AccountKeys
  assertAccountRole(session, owner, 'admin')
  const userId = req.query.userId
  if (typeof userId !== 'string') { res.status(400).json({ error: { message: 'userId query parameter is required' } }); return }
  await mongo.traceRequests.deleteMany({ 'owner.type': owner.type, 'owner.id': owner.id, userId })
  res.status(204).send()
})

function firstUserMessage (body: any): string {
  const messages = Array.isArray(body?.messages) ? body.messages : []
  const firstUser = messages.find((m: any) => m.role === 'user')
  const content = firstUser?.content
  if (typeof content === 'string') return content.slice(0, 150)
  if (Array.isArray(content)) {
    const text = content.find((c: any) => c.type === 'text')
    return (text?.text ?? '').slice(0, 150)
  }
  return ''
}

/**
 * router.ts contains the HTTP layer logic and stateful logic
 * it should not be imported anywhere else than app.ts
 */
import mongo from '#mongo'
import { Router } from 'express'
import { type AccountKeys, assertAccountRole, reqSessionAuthenticated } from '@data-fair/lib-express'

const router = Router()
export default router

router.get('/:type/:id', async (req, res) => {
  const session = reqSessionAuthenticated(req)
  const owner = req.params as unknown as AccountKeys
  assertAccountRole(session, owner, 'admin')

  const ownerFilter = { 'owner.type': owner.type, 'owner.id': owner.id }
  const results = await mongo.traceRequests.aggregate([
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
    { $sort: { startedAt: -1 } },
    { $limit: 200 }
  ]).toArray()

  res.json({
    results: results.map((r: any) => ({
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

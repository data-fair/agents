/**
 * router.ts contains the HTTP layer logic and stateful logic
 * it should not be imported anywhere else than app.ts
 * it is tested by api integration tests
 */

import { Router } from 'express'
import { nanoid } from 'nanoid'
import mongo from '#mongo'
import { type AccountKeys, assertAccountRole, httpError, reqSessionAuthenticated } from '@data-fair/lib-express'
import eventsLog from '@data-fair/lib-express/events-log.js'
import * as writeReqBody from '#doc/autonomous-agents/autonomous-agent-write-req/index.ts'
import { getAutonomousAgent, getMcpServerCatalog, reqWriteSession, assertKnownMcpServers } from './service.ts'

const router = Router()
export default router

// The literal `mcp-servers` segment MUST stay registered before the `/:agentId`
// param route below, or Express matches it as an autonomous agent id.
// api/src/traces/router.ts has the same constraint for its /conversation route.
router.get('/:type/:id/mcp-servers', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertAccountRole(session, owner, 'admin')
    const results = getMcpServerCatalog()
    res.json({ results, count: results.length })
  } catch (err) { next(err) }
})

router.get('/:type/:id', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertAccountRole(session, owner, 'admin')
    const results = await mongo.autonomousAgents
      .find({ 'owner.type': owner.type, 'owner.id': owner.id }, { projection: { _id: 0 } })
      .sort({ updatedAt: -1 })
      .toArray()
    res.json({ results, count: results.length })
  } catch (err) { next(err) }
})

router.post('/:type/:id', async (req, res, next) => {
  try {
    const session = reqWriteSession(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertAccountRole(session, owner, 'admin')
    const body = writeReqBody.returnValid(req.body, { name: 'body' })
    assertKnownMcpServers(body.mcpServers)

    const now = new Date().toISOString()
    const autonomousAgent = {
      ...body,
      id: nanoid(),
      owner,
      createdAt: now,
      updatedAt: now,
      createdBy: { id: session.user.id, name: session.user.name }
    }
    await mongo.autonomousAgents.insertOne({ ...autonomousAgent })

    eventsLog.info('agents.autonomous-agent.create', `autonomous agent ${autonomousAgent.id} created for owner ${owner.type}/${owner.id}`, { req })
    res.json(autonomousAgent)
  } catch (err) { next(err) }
})

router.get('/:type/:id/:agentId', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertAccountRole(session, owner, 'admin')
    const autonomousAgent = await getAutonomousAgent(owner, req.params.agentId)
    if (!autonomousAgent) throw httpError(404, 'unknown autonomous agent')
    res.json(autonomousAgent)
  } catch (err) { next(err) }
})

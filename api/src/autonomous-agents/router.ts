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
import { getAutonomousAgent, getMcpServerCatalog, reqWriteSession, assertKnownMcpServers, assertOrganizationOwner } from './service.ts'

const router = Router()
export default router

// The literal `mcp-servers` segment MUST stay registered before the `/:agentId`
// param route below, or Express matches it as an autonomous agent id.
// api/src/traces/router.ts has the same constraint for its /conversation route.
router.get('/:type/:id/mcp-servers', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertOrganizationOwner(owner)
    assertAccountRole(session, owner, 'admin')
    const results = getMcpServerCatalog()
    res.json({ results, count: results.length })
  } catch (err) { next(err) }
})

router.get('/:type/:id', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertOrganizationOwner(owner)
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
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertOrganizationOwner(owner)
    assertAccountRole(session, owner, 'admin')
    reqWriteSession(req) // progressive-rollout gate, last: see reqWriteSession's doc comment
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
    assertOrganizationOwner(owner)
    assertAccountRole(session, owner, 'admin')
    const autonomousAgent = await getAutonomousAgent(owner, req.params.agentId)
    if (!autonomousAgent) throw httpError(404, 'unknown autonomous agent')
    res.json(autonomousAgent)
  } catch (err) { next(err) }
})

router.put('/:type/:id/:agentId', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertOrganizationOwner(owner)
    assertAccountRole(session, owner, 'admin')
    reqWriteSession(req) // progressive-rollout gate, last: see reqWriteSession's doc comment
    const body = writeReqBody.returnValid(req.body, { name: 'body' })
    assertKnownMcpServers(body.mcpServers)

    const existing = await getAutonomousAgent(owner, req.params.agentId)
    if (!existing) throw httpError(404, 'unknown autonomous agent')

    // Whole-document replace of the client-writable subset: one owner, one write
    // route, so there is no disjoint half to preserve the way settings has. The
    // server-owned fields are carried over explicitly, and any writable field absent
    // from the body is genuinely dropped.
    const updated = {
      ...body,
      id: existing.id,
      owner: existing.owner,
      createdAt: existing.createdAt,
      ...(existing.createdBy ? { createdBy: existing.createdBy } : {}),
      updatedAt: new Date().toISOString()
    }
    await mongo.autonomousAgents.replaceOne({ id: existing.id, 'owner.type': owner.type, 'owner.id': owner.id }, { ...updated })

    eventsLog.info('agents.autonomous-agent.update', `autonomous agent ${existing.id} updated for owner ${owner.type}/${owner.id}`, { req })
    res.json(updated)
  } catch (err) { next(err) }
})

router.delete('/:type/:id/:agentId', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertOrganizationOwner(owner)
    assertAccountRole(session, owner, 'admin')
    reqWriteSession(req) // progressive-rollout gate, last: see reqWriteSession's doc comment

    const result = await mongo.autonomousAgents.deleteOne({ id: req.params.agentId, 'owner.type': owner.type, 'owner.id': owner.id })
    if (!result.deletedCount) throw httpError(404, 'unknown autonomous agent')

    eventsLog.info('agents.autonomous-agent.delete', `autonomous agent ${req.params.agentId} deleted for owner ${owner.type}/${owner.id}`, { req })
    res.status(204).send()
  } catch (err) { next(err) }
})

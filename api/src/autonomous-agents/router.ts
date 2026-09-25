/**
 * router.ts contains the HTTP layer logic and stateful logic
 * it should not be imported anywhere else than app.ts
 * it is tested by api integration tests
 */

import { Router } from 'express'
import { nanoid } from 'nanoid'
import mongo from '#mongo'
import { type AccountKeys, assertAccountRole, httpError, reqSessionAuthenticated, reqSiteUrl } from '@data-fair/lib-express'
import eventsLog from '@data-fair/lib-express/events-log.js'
import * as writeReqBody from '#doc/autonomous-agents/autonomous-agent-write-req/index.ts'
import { getAutonomousAgent, getMcpServerCatalog, reqWriteSession, assertKnownMcpServers, assertOrganizationOwner, describeAutonomousAgentSession, assertEnrolmentWorks, describeAutonomousAgentTools, clearAutonomousAgentSession } from './service.ts'
import { nhiIssuerUrl } from '../nhi/operations.ts'

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

    // Captured, not configured: this request came through the proxy from an admin who was
    // browsing this service, so reqSiteUrl(req) is a site url that demonstrably resolves
    // here. Everything the exchange needs — the signed audience, the declared
    // x-forwarded-*, and the path it posts to — derives from this one value, so they cannot
    // drift apart. See api/src/nhi/operations.ts.
    //
    // `nhi` is NEVER taken from the body. `readOnly` is not enforced by ajv, and
    // siteUrl/issuer are KNOWN keys so `additionalProperties: false` does not reject them
    // either — so the ONLY protection is that we strip the client's object and rebuild it.
    // Stripping unconditionally matters: a present-but-falsy clientId (e.g. '') used to skip
    // the rebuild and let the whole client-supplied nhi through the spread below.
    const { nhi: clientNhi, ...writable } = body
    const nhi = clientNhi?.clientId
      ? { clientId: clientNhi.clientId, siteUrl: reqSiteUrl(req).replace(/\/+$/, ''), issuer: nhiIssuerUrl(reqSiteUrl(req)) }
      : undefined

    const now = new Date().toISOString()
    const autonomousAgent = {
      ...writable,
      ...(nhi ? { nhi } : {}),
      id: nanoid(),
      owner,
      createdAt: now,
      updatedAt: now,
      createdBy: { id: session.user.id, name: session.user.name }
    }
    if (autonomousAgent.nhi?.clientId) await assertEnrolmentWorks(autonomousAgent)
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

router.get('/:type/:id/:agentId/session', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertOrganizationOwner(owner)
    assertAccountRole(session, owner, 'admin')
    const autonomousAgent = await getAutonomousAgent(owner, req.params.agentId)
    if (!autonomousAgent) throw httpError(404, 'unknown autonomous agent')
    res.json(await describeAutonomousAgentSession(autonomousAgent))
  } catch (err) { next(err) }
})

router.get('/:type/:id/:agentId/tools', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = { type: req.params.type, id: req.params.id } as AccountKeys
    assertOrganizationOwner(owner)
    assertAccountRole(session, owner, 'admin')
    const autonomousAgent = await getAutonomousAgent(owner, req.params.agentId)
    if (!autonomousAgent) throw httpError(404, 'unknown autonomous agent')

    const results = await describeAutonomousAgentTools(autonomousAgent)
    res.json({ results, count: results.length })
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

    // Captured, not configured — same as POST. Note this RE-CAPTURES rather than
    // preserving the existing siteUrl/issuer: an admin re-saving from a different host
    // is telling us the site url changed, and the enrolment check (Task 5) will
    // immediately verify whether the new one actually works.
    //
    // `nhi` is NEVER taken from the body. `readOnly` is not enforced by ajv, and
    // siteUrl/issuer are KNOWN keys so `additionalProperties: false` does not reject them
    // either — so the ONLY protection is that we strip the client's object and rebuild it.
    // Stripping unconditionally matters: a present-but-falsy clientId (e.g. '') used to skip
    // the rebuild and let the whole client-supplied nhi through the spread below.
    const { nhi: clientNhi, ...writable } = body
    const nhi = clientNhi?.clientId
      ? { clientId: clientNhi.clientId, siteUrl: reqSiteUrl(req).replace(/\/+$/, ''), issuer: nhiIssuerUrl(reqSiteUrl(req)) }
      : undefined

    // Whole-document replace of the client-writable subset: one owner, one write
    // route, so there is no disjoint half to preserve the way settings has. The
    // server-owned fields are carried over explicitly, and any writable field absent
    // from the body is genuinely dropped.
    const updated = {
      ...writable,
      ...(nhi ? { nhi } : {}),
      id: existing.id,
      owner: existing.owner,
      createdAt: existing.createdAt,
      ...(existing.createdBy ? { createdBy: existing.createdBy } : {}),
      updatedAt: new Date().toISOString()
    }
    // Re-verify whenever any part of the enrolment changed, not just the clientId: a
    // re-save from a different host changes siteUrl/issuer, and those feed the signed
    // audience and the exchange path, so an unverified change breaks the agent at its
    // first tool call. An unchanged enrolment is deliberately NOT re-verified — the
    // exchange is rate-limited per client_id and consumes a point even on success.
    const enrolmentChanged = !!updated.nhi?.clientId && (
      updated.nhi.clientId !== existing.nhi?.clientId ||
      updated.nhi.siteUrl !== existing.nhi?.siteUrl ||
      updated.nhi.issuer !== existing.nhi?.issuer
    )
    if (enrolmentChanged) await assertEnrolmentWorks(updated)
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
    clearAutonomousAgentSession(req.params.agentId)

    eventsLog.info('agents.autonomous-agent.delete', `autonomous agent ${req.params.agentId} deleted for owner ${owner.type}/${owner.id}`, { req })
    res.status(204).send()
  } catch (err) { next(err) }
})

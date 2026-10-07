/**
 * router.ts contains the HTTP layer logic and stateful logic
 * it should not be imported anywhere else than app.ts
 *
 * An agent's memory, for the administrators of the organization that owns it. NOT for instructors who
 * are not admins: an agent-wide memory can hold what OTHER instructors said.
 */
import mongo from '#mongo'
import { Router } from 'express'
import { type AccountKeys, assertAccountRole, httpError, reqSessionAuthenticated } from '@data-fair/lib-express'
import eventsLog from '@data-fair/lib-express/events-log.js'
import { assertOrganizationOwner, getAutonomousAgent, reqWriteSession } from '../autonomous-agents/service.ts'
import { agentStoreId, MEMORY_LIMITS, normalizeMemoryPath, MemoryCommandError, MemoryConflictError } from './operations.ts'
import { loadMemory, writeMemoryAsUser, deleteMemoryAsUser, listMemoryVersions, restoreMemoryVersion, redactMemoryVersion } from './service.ts'

const router = Router()
export default router

/**
 * Resolve the agent for an admin of its owner; returns its store id. An admin write racing the agent's
 * deletion by another admin can leave an orphan store: accepted (a re-created agent has a new id).
 */
const requireAgentAdmin = async (req: any, write: boolean) => {
  const session = reqSessionAuthenticated(req)
  const owner = { type: req.params.type, id: req.params.id } as AccountKeys
  assertOrganizationOwner(owner)
  assertAccountRole(session, owner, 'admin')
  if (write) reqWriteSession(req)
  const agent = await getAutonomousAgent(owner, req.params.agentId)
  if (!agent) throw httpError(404, 'unknown autonomous agent')
  return { owner, agent, storeId: agentStoreId(agent.id), user: { id: session.user.id, name: session.user.name } }
}

/** Domain errors to HTTP: a refusal is a 400 with its reason, a lost precondition a 409. */
const mapError = (err: unknown) => {
  if (err instanceof MemoryConflictError) return httpError(409, err.message)
  if (err instanceof MemoryCommandError) return httpError(400, err.message)
  return err
}

const queryPath = (req: any) => {
  if (typeof req.query.path !== 'string' || !req.query.path) throw httpError(400, 'path is required')
  return req.query.path
}

router.get('/:type/:id/:agentId', async (req, res, next) => {
  try {
    const { agent, storeId } = await requireAgentAdmin(req, false)
    const documents = await loadMemory(storeId)
    res.json({
      enabled: agent.memory?.enabled === true,
      limits: MEMORY_LIMITS,
      usage: { documents: documents.length, totalChars: documents.reduce((sum, d) => sum + d.content.length, 0) },
      documents: documents.map(({ path, description, content, version, updatedAt, updatedBy }) => ({ path, description, chars: content.length, version, updatedAt, updatedBy }))
    })
  } catch (err) { next(mapError(err)) }
})

router.get('/:type/:id/:agentId/document', async (req, res, next) => {
  try {
    const { storeId } = await requireAgentAdmin(req, false)
    const path = queryPath(req)
    const document = await mongo.agentMemories.findOne({ storeId, path: normalizeMemoryPath(path) }, { projection: { _id: 0 } })
    if (!document) throw httpError(404, 'unknown memory document')
    res.json(document)
  } catch (err) { next(mapError(err)) }
})

router.put('/:type/:id/:agentId/document', async (req, res, next) => {
  try {
    const { owner, storeId, user } = await requireAgentAdmin(req, true)
    const written = await writeMemoryAsUser(storeId, owner, queryPath(req), req.body ?? {}, user)
    eventsLog.info('agents.memory.write', `memory document ${written.path} of agent ${req.params.agentId} written`, { req })
    res.json(written)
  } catch (err) { next(mapError(err)) }
})

router.delete('/:type/:id/:agentId/document', async (req, res, next) => {
  try {
    const { owner, storeId, user } = await requireAgentAdmin(req, true)
    const version = Number(req.query.version)
    if (!Number.isInteger(version)) throw httpError(400, 'version is required')
    const path = normalizeMemoryPath(queryPath(req))
    await deleteMemoryAsUser(storeId, owner, path, version, user)
    eventsLog.info('agents.memory.delete', `memory document ${path} of agent ${req.params.agentId} deleted`, { req })
    res.status(204).send()
  } catch (err) { next(mapError(err)) }
})

router.get('/:type/:id/:agentId/versions', async (req, res, next) => {
  try {
    const { storeId } = await requireAgentAdmin(req, false)
    const size = Math.min(Math.max(parseInt(String(req.query.size ?? '20'), 10) || 20, 1), 100)
    const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1)
    res.json(await listMemoryVersions(storeId, { path: typeof req.query.path === 'string' && req.query.path ? req.query.path : undefined, skip: (page - 1) * size, limit: size }))
  } catch (err) { next(mapError(err)) }
})

router.post('/:type/:id/:agentId/versions/:versionId/restore', async (req, res, next) => {
  try {
    const { owner, storeId, user } = await requireAgentAdmin(req, true)
    const written = await restoreMemoryVersion(storeId, owner, req.params.versionId, user)
    eventsLog.info('agents.memory.restore', `memory version ${req.params.versionId} of agent ${req.params.agentId} restored`, { req })
    res.json(written)
  } catch (err) { next(mapError(err)) }
})

router.post('/:type/:id/:agentId/versions/:versionId/redact', async (req, res, next) => {
  try {
    const { storeId, user } = await requireAgentAdmin(req, true)
    await redactMemoryVersion(storeId, req.params.versionId, user)
    eventsLog.info('agents.memory.redact', `memory version ${req.params.versionId} of agent ${req.params.agentId} redacted`, { req })
    res.status(204).send()
  } catch (err) { next(mapError(err)) }
})

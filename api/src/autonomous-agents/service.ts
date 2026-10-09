/**
 * service.ts contains stateful logic (mongo, config) built on top of operations.ts
 */

import mongo from '#mongo'
import config from '#config'
import { type AccountKeys, httpError, reqAdminMode, reqSessionAuthenticated } from '@data-fair/lib-express'
import type { Request } from 'express'
import { listMcpServerCatalog, unknownMcpServerIds, type SiteCredentials } from '../mcp-servers/operations.ts'
import { getAutonomousAgentSession, agentSiteCredentials, clearAutonomousAgentSession, listAccountSites, type EnrolledAutonomousAgent } from '../nhi/service.ts'
import { decodeSessionClaims, autonomousAgentSubject } from '../nhi/operations.ts'
import { listAutonomousAgentToolDescriptors, type AutonomousAgentForTools } from '../mcp-servers/client.ts'
import { agentStoreId } from '../memory/operations.ts'
import { deleteMemoryStore } from '../memory/service.ts'
import { PERSONAL_AGENT_ID } from '../agent-session/personal-agent.ts'

// Re-exported so the router (HTTP layer only) never imports ../nhi/service.ts directly —
// it drops a deleted autonomous agent's cached session the same way assertEnrolmentWorks
// below does for a changed one.
export { clearAutonomousAgentSession }

export const getMcpServerCatalog = () => listMcpServerCatalog(config.mcpServers ?? [])

/**
 * Autonomous agents are only ever owned by an organization: their identity model
 * rests on NHIs, which simple-directory binds to exactly one organization, so a
 * personal-account (owner.type: 'user') autonomous agent is meaningless. It is also
 * unsafe: a user is always 'admin' of their own personal account (see
 * getAccountRole in @data-fair/lib-common-types/session), so assertAccountRole alone
 * never rejects owner.type: 'user' — every route must call this first.
 */
export function assertOrganizationOwner (owner: AccountKeys): asserts owner is AccountKeys & { type: 'organization' } {
  if (owner.type !== 'organization') throw httpError(400, 'autonomous agents can only be owned by an organization')
}

/**
 * The same invariant, applied where the agent's id is known — which is what lets the PERSONAL assistant run
 * on a personal account.
 *
 * The rule above is about the identity model: a CONFIGURED agent's rests on an NHI, and
 * simple-directory binds an NHI to exactly one organization, so a user-owned one is meaningless. The
 * personal assistant has no NHI at all; it acts as the person through their forwarded session, and
 * running on someone's own account is the normal case for it, not an edge one, so applying
 * the org-only rule to it refuses the thing it exists to do.
 *
 * What the original guard also protected against still holds and is still handled: a user is always
 * 'admin' of their own personal account, so `assertAccountRole` cannot reject a user owner. For the
 * personal assistant that is exactly right — the agent's ceiling is the person's own permissions. For a
 * configured one it would be a privilege escalation, which is why that case still goes through the
 * assertion above.
 */
export function assertCanOwnAgent (owner: AccountKeys, agentId: string): void {
  if (agentId === PERSONAL_AGENT_ID) return
  assertOrganizationOwner(owner)
}

export const getAutonomousAgent = async (owner: AccountKeys, id: string) => {
  return await mongo.autonomousAgents.findOne(
    { id, 'owner.type': owner.type, 'owner.id': owner.id },
    { projection: { _id: 0 } }
  )
}

/**
 * Write-side session gate. Account-role authorization is applied by the caller with
 * assertAccountRole; this only adds the progressive-rollout requirement, so that
 * turning the flag off is the single change that opens writes to org admins.
 */
export const reqWriteSession = (req: Request) => {
  return config.autonomousAgentsRequireAdminMode ? reqAdminMode(req) : reqSessionAuthenticated(req)
}

/** 400 naming every unknown server id, rather than storing a reference that can never resolve. */
export const assertKnownMcpServers = (mcpServers?: { serverId: string }[]) => {
  const unknown = unknownMcpServerIds(config.mcpServers ?? [], mcpServers ?? [])
  if (unknown.length) throw httpError(400, `unknown MCP server(s): ${unknown.join(', ')}`)
}

/**
 * Obtain a session for this autonomous agent and report WHICH identity it got, without
 * ever returning the cookie. Diagnostic surface for admins, and the end-to-end proof
 * that issuer/jwks/claims/audience agree — and where it has its account (the sites it acts on
 * with its own session).
 */
export const describeAutonomousAgentSession = async (autonomousAgent: EnrolledAutonomousAgent & { owner: AccountKeys }) => {
  const cookieHeader = await getAutonomousAgentSession(autonomousAgent)
  const claims = decodeSessionClaims(cookieHeader)
  return {
    userId: claims.id,
    userName: claims.name,
    // From `organizations`, NOT a singular `organization` claim — there is no such claim in the
    // id_token (simple-directory's getTokenPayload builds `organizations`, and the ACTIVE org travels
    // in the separate id_token_org cookie, which decodeSessionClaims does not read). Reading
    // `claims.organization?.id` left this permanently undefined, i.e. the one field telling an admin
    // which organization the agent acts in was always blank. Taking [0] is exact rather than a guess:
    // the NHI token route refuses any identity whose `organizations.length !== 1`.
    organization: claims.organizations?.[0]?.id,
    nhi: claims.nhi === 1 || claims.nhi === true,
    expiresIn: typeof claims.exp === 'number' ? Math.max(0, claims.exp - Math.floor(Date.now() / 1000)) : undefined,
    accountSites: await listAccountSites(autonomousAgent)
  }
}

/**
 * Perform a real exchange so a misconfigured enrolment fails at configuration time
 * rather than inside the first run — the lesson nhi-proxy's `enroll` encodes.
 *
 * Called only when clientId/siteUrl/issuer CHANGED: the exchange is rate-limited per
 * client_id and consumes a point on success too, so re-verifying an unchanged enrolment
 * on every edit would spend that budget for nothing.
 */
export const assertEnrolmentWorks = async (autonomousAgent: EnrolledAutonomousAgent) => {
  clearAutonomousAgentSession(autonomousAgent.id)
  try {
    await getAutonomousAgentSession(autonomousAgent)
  } catch (err: any) {
    throw httpError(400, `the non-human identity "${autonomousAgent.nhi?.clientId}" could not be verified against simple-directory: ${err.message}. Check that the NHI exists, that its issuer is ${autonomousAgent.nhi?.issuer} and that its subject is ${autonomousAgentSubject(autonomousAgent.id)}.`)
  }
}

/**
 * The tool list an autonomous agent would actually receive, fetched live as its own
 * identity. Descriptions and annotations only — never a credential.
 */
export const describeAutonomousAgentTools = async (autonomousAgent: AutonomousAgentForTools & EnrolledAutonomousAgent & { owner: AccountKeys }) => {
  // With no home site `cookieFor` is never called, so the enrolment check getAutonomousAgentSession makes
  // would be lost: refuse here rather than list a session server's tools anonymously.
  const catalog = config.mcpServers ?? []
  if (!autonomousAgent.nhi?.clientId && (autonomousAgent.mcpServers ?? []).some(ref => catalog.find(s => s.id === ref.serverId)?.auth === 'nhi-session')) {
    throw httpError(400, `autonomous agent ${autonomousAgent.id} has no enrolled non-human identity`)
  }
  // An agent with an nhi goes through requireEnrolment: a half-enrolled one is a 400, never anonymous.
  const sites: SiteCredentials = autonomousAgent.nhi
    ? await agentSiteCredentials(autonomousAgent)
    : { portals: [], anonymousHome: false, cookieFor: async () => undefined }
  return await listAutonomousAgentToolDescriptors(autonomousAgent, sites)
}

/**
 * Saves an extended web allowlist, once an administrator approved the agent's `request_web_access`
 * call. Only that field: the rest of the configuration is the admin form's, and a concurrent save of
 * the form must not be undone by this write. Who approved is recorded on the call itself.
 */
export const saveWebAllowedUrls = async (agent: { id: string, owner: AccountKeys }, allowedUrls: string[]) => {
  const result = await mongo.autonomousAgents.updateOne(
    { id: agent.id, 'owner.type': agent.owner.type, 'owner.id': agent.owner.id, 'web.enabled': true },
    { $set: { 'web.allowedUrls': allowedUrls, updatedAt: new Date().toISOString() } }
  )
  if (!result.matchedCount) throw new Error('web access was disabled for this agent in the meantime')
}

/**
 * Erase everything one autonomous agent accumulated: its memory, its conversations, their messages, their runs.
 *
 * A CASCADE rather than a TTL, deliberately. The stored conversation is the conversation of record —
 * that is the whole point of the storage model, and the reason it holds complete tool results — so a
 * timer that silently destroyed it would take the audit trail with it. What it needs instead is an
 * owner who can erase it, which is exactly what deleting the agent now means.
 *
 * Ordered children-first, so an interruption leaves conversations whose messages are already gone
 * rather than messages no conversation can reach: the conversation is what every read path resolves
 * through, so it is the safe thing to have survive a half-completed delete.
 */
export const deleteAutonomousAgentData = async (agentId: string) => {
  // Memory first: it is derived from the conversations, and must not outlive them.
  const memory = await deleteMemoryStore(agentStoreId(agentId))
  const conversations = await mongo.conversations
    .find({ agentId }, { projection: { _id: 0, id: 1 } })
    .toArray()
  const conversationIds = conversations.map(conversation => conversation.id)
  // Every TASK run of the agent: it has no conversation to reach it through, and an agent that only ever ran
  // tasks takes the early return below. Conversation runs are deleted by conversation, further down, in the
  // documented order.
  const agentRuns = await mongo.runs.deleteMany({ agentId, kind: 'task' })
  // The agent's planned tasks go with it, so nothing is left for the scheduler to run as a deleted agent.
  await mongo.autonomousAgentTasks.deleteMany({ agentId })
  if (!conversationIds.length) {
    const late = await deleteMemoryStore(agentStoreId(agentId))
    return { conversations: 0, messages: 0, runs: agentRuns.deletedCount, memories: memory.documents + late.documents, memoryVersions: memory.versions + late.versions }
  }

  const messages = await mongo.messages.deleteMany({ conversationId: { $in: conversationIds } })
  const runs = await mongo.runs.deleteMany({ conversationId: { $in: conversationIds } })
  const removed = await mongo.conversations.deleteMany({ agentId })
  // Again: a turn on another instance, or one mid-call here, can write memory after the first pass,
  // and nothing could reach that store once the agent is gone.
  const late = await deleteMemoryStore(agentStoreId(agentId))
  return { conversations: removed.deletedCount, messages: messages.deletedCount, runs: agentRuns.deletedCount + runs.deletedCount, memories: memory.documents + late.documents, memoryVersions: memory.versions + late.versions }
}

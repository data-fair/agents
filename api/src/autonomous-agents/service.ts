/**
 * service.ts contains stateful logic (mongo, config) built on top of operations.ts
 */

import mongo from '#mongo'
import config from '#config'
import { type AccountKeys, httpError, reqAdminMode, reqSessionAuthenticated, assertAccountRole } from '@data-fair/lib-express'
import type { Request } from 'express'
import { listMcpServerCatalog, personSiteCredentials, type SiteCredentials } from '../mcp-servers/operations.ts'
import { getAutonomousAgentSession, agentSiteCredentials, forgetAgentSessions, listAccountSites, type EnrolledAutonomousAgent } from '../nhi/service.ts'
import { decodeSessionClaims, autonomousAgentSubject } from '../nhi/operations.ts'
import { listAutonomousAgentToolDescriptors, type AutonomousAgentForTools, type SkippedServer } from '../mcp-servers/client.ts'
import { listExternalToolDescriptors } from '../mcp-servers/external.ts'
import { envPublicIps } from '../web/public-lookup.ts'
import { agentStoreId } from '../memory/operations.ts'
import { deleteMemoryStore } from '../memory/service.ts'
import { deleteConversationFiles } from '../files/service.ts'
import { isPersonalAgentId } from '../agent-session/personal-agent.ts'
import { canInstruct } from './operations.ts'
import { fetchProfiles } from '../mcp-servers/profiles.ts'
import { offeredRoots, type McpProfile } from '@agents/shared/mcp-profiles'

// Re-exported so the router (HTTP layer only) never imports ../nhi/service.ts directly —
// it drops a deleted autonomous agent's cached session the same way assertEnrolmentWorks
// below does for a changed one.
export { forgetAgentSessions }

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
  if (isPersonalAgentId(agentId)) return
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

/**
 * The opening of every route under an organization's agents: the owner from the path, which must be an
 * organization (assertOrganizationOwner), then the caller — `admin` of that account, or `write`: admin
 * and, last, the progressive-rollout gate (reqWriteSession).
 */
export const reqAgentOwner = (req: Request, access: 'admin' | 'write') => {
  const session = reqSessionAuthenticated(req)
  const owner = { type: req.params.type, id: req.params.id } as AccountKeys
  assertOrganizationOwner(owner)
  assertAccountRole(session, owner, 'admin')
  if (access === 'write') reqWriteSession(req)
  return { session, owner }
}

/**
 * The same for a route naming one agent (`:agentId`), which it loads: 404 when unknown. `instruct` lets in
 * whoever may instruct the agent (canInstruct, a property of the agent, so checked once it is loaded) —
 * an instructor of another account included.
 */
export const reqAgent = async (req: Request, access: 'instruct' | 'admin' | 'write') => {
  const { session, owner } = access === 'instruct'
    ? { session: reqSessionAuthenticated(req), owner: { type: req.params.type, id: req.params.id } as AccountKeys }
    : reqAgentOwner(req, access)
  assertOrganizationOwner(owner)
  const agent = await getAutonomousAgent(owner, String(req.params.agentId))
  if (!agent) throw httpError(404, 'unknown autonomous agent')
  if (access === 'instruct' && !canInstruct(agent, session)) throw httpError(403, 'you are not allowed to instruct this autonomous agent')
  return { session, owner, agent }
}

/** 400 naming every unknown server id, rather than storing a reference that can never resolve. */
/**
 * Obtain a session for this autonomous agent and report WHICH identity it got, without
 * ever returning the cookie. Diagnostic surface for admins, and the end-to-end proof
 * that issuer/jwks/claims/audience agree — and where it has its account (the sites it acts on
 * with its own session).
 */
export const describeAutonomousAgentSession = async (autonomousAgent: EnrolledAutonomousAgent & { owner: AccountKeys }) => {
  const cookieHeader = await getAutonomousAgentSession(autonomousAgent)
  const claims = decodeSessionClaims(cookieHeader)
  // The listing is a diagnostic of its own: its failure must not hide the session this endpoint exists to show.
  let accountSites: string[] | undefined
  let accountSitesError: string | undefined
  try {
    accountSites = await listAccountSites(autonomousAgent)
  } catch (err: any) {
    accountSitesError = err.message
  }
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
    accountSites,
    ...(accountSitesError ? { accountSitesError } : {})
  }
}

/**
 * Perform a real exchange so a misconfigured enrolment fails at configuration time
 * rather than inside the first run — the lesson nhi-proxy's `enroll` encodes.
 *
 * Called only when clientId/siteUrl/issuer CHANGED: exchanges spend a rate-limit budget every
 * agent of the service shares (nhi/session-broker.ts), so re-verifying an unchanged enrolment
 * on every edit would spend it for nothing. Forgets the agent's sessions first, so the check is
 * a real exchange, not a reused session nor a remembered rejection.
 */
export const assertEnrolmentWorks = async (autonomousAgent: EnrolledAutonomousAgent) => {
  forgetAgentSessions(autonomousAgent.id)
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
export const describeAutonomousAgentTools = async (autonomousAgent: AutonomousAgentForTools & EnrolledAutonomousAgent & { owner: AccountKeys, externalMcpServers?: { url: string }[] }) => {
  // With no home site `cookieFor` is never called, so the enrolment check getAutonomousAgentSession makes
  // would be lost: refuse here rather than list a session server's tools anonymously.
  const catalog = config.mcpServers ?? []
  if (!autonomousAgent.nhi?.clientId && (autonomousAgent.mcpServers ?? []).some(ref => catalog.find(s => s.id === ref.serverId)?.auth === 'nhi-session')) {
    throw httpError(400, `autonomous agent ${autonomousAgent.id} has no enrolled non-human identity`)
  }
  // An agent with an nhi goes through requireEnrolment: a half-enrolled one is a 400, never anonymous.
  const sites: SiteCredentials = autonomousAgent.nhi
    ? await agentSiteCredentials(autonomousAgent)
    : personSiteCredentials(undefined, undefined)
  // `kind` as a turn records it (shared/tool-source.ts), so the chat's inspection dialog groups both alike.
  const { descriptors, profiled: profiles } = await listAutonomousAgentToolDescriptors(autonomousAgent, sites)
  const results = descriptors.map(descriptor => ({ ...descriptor, kind: 'catalog' as const }))
  if (!autonomousAgent.externalMcpServers?.length) return { results, skipped: [] as SkippedServer[], profiles }
  const external = await listExternalToolDescriptors(autonomousAgent.externalMcpServers, { publicIps: envPublicIps() })
  return { results: [...results, ...external.descriptors.map(descriptor => ({ ...descriptor, kind: 'external' as const }))], skipped: external.skipped, profiles }
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
 * Saves an extended list of external MCP servers, once an administrator approved the agent's
 * `request_mcp_access` call. Only that field, for the reason saveWebAllowedUrls gives.
 */
export const saveExternalMcpServers = async (agent: { id: string, owner: AccountKeys }, servers: { url: string }[]) => {
  const result = await mongo.autonomousAgents.updateOne(
    { id: agent.id, 'owner.type': agent.owner.type, 'owner.id': agent.owner.id },
    { $set: { externalMcpServers: servers, updatedAt: new Date().toISOString() } }
  )
  if (!result.matchedCount) throw new Error('the agent no longer exists')
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
    .find({ agentId }, { projection: { _id: 0, id: 1, owner: 1 } })
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
  // Their files go at once, as with any conversation delete (logged, never thrown). A task run's files are
  // left to the sweep: a task run has no deletion path of its own.
  for (const conversation of conversations) await deleteConversationFiles(conversation.owner, conversation.id)
  // Again: a turn on another instance, or one mid-call here, can write memory after the first pass,
  // and nothing could reach that store once the agent is gone.
  const late = await deleteMemoryStore(agentStoreId(agentId))
  return { conversations: removed.deletedCount, messages: messages.deletedCount, runs: agentRuns.deletedCount + runs.deletedCount, memories: memory.documents + late.documents, memoryVersions: memory.versions + late.versions }
}

/**
 * What the form's profile tree needs for one profiled server: the vocabulary, the role of the agent's identity
 * in the owner organization, and the roots that role is offered (docs/superpowers/specs/2026-10-14-mcp-profile-selection-design.md §3).
 * No agent, or one not enrolled yet: no role, every root offered.
 */
export const describeServerProfiles = async (serverId: string, autonomousAgent?: EnrolledAutonomousAgent & { owner: AccountKeys }) => {
  const server = (config.mcpServers ?? []).find(s => s.id === serverId)
  if (!server) throw httpError(400, `unknown MCP server "${serverId}"`)
  if (!server.profilesUrl) throw httpError(400, `MCP server "${serverId}" declares no profiles`)
  let profiles: McpProfile[]
  try {
    profiles = await fetchProfiles(server)
  } catch (err: any) {
    throw httpError(502, err.message)
  }
  let role: string | undefined
  let roleError: string | undefined
  if (autonomousAgent?.nhi?.clientId) {
    // From the session a turn would use: the NHI token route guarantees exactly one organization. A failed
    // exchange does not fail the route: the form showing this tree is also where that identity is repaired,
    // so the offer stays unfiltered and the reason is returned beside it.
    try {
      const claims = decodeSessionClaims(await getAutonomousAgentSession(autonomousAgent))
      role = claims.organizations?.[0]?.role
    } catch (err: any) {
      roleError = err.message
    }
  }
  return { profiles, ...(role ? { role } : {}), ...(roleError ? { roleError } : {}), offered: offeredRoots(profiles, role) }
}

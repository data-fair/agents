/**
 * service.ts contains stateful logic (mongo, config) built on top of operations.ts
 */

import mongo from '#mongo'
import config from '#config'
import { type AccountKeys, httpError, reqAdminMode, reqSessionAuthenticated } from '@data-fair/lib-express'
import type { Request } from 'express'
import { listMcpServerCatalog, unknownMcpServerIds } from '../mcp-servers/operations.ts'
import { getAutonomousAgentSession, clearAutonomousAgentSession, type EnrolledAutonomousAgent } from '../nhi/service.ts'
import { decodeSessionClaims, autonomousAgentSubject } from '../nhi/operations.ts'

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
 * that issuer/jwks/claims/audience agree.
 */
export const describeAutonomousAgentSession = async (autonomousAgent: EnrolledAutonomousAgent) => {
  const cookieHeader = await getAutonomousAgentSession(autonomousAgent)
  const claims = decodeSessionClaims(cookieHeader)
  return {
    userId: claims.id,
    userName: claims.name,
    organization: claims.organization?.id,
    nhi: claims.nhi === 1 || claims.nhi === true,
    expiresIn: typeof claims.exp === 'number' ? Math.max(0, claims.exp - Math.floor(Date.now() / 1000)) : undefined
  }
}

/**
 * Perform a real exchange so a misconfigured enrolment fails at configuration time
 * rather than inside the first run — the lesson nhi-proxy's `enroll` encodes.
 *
 * Called only when the clientId CHANGED: the exchange is rate-limited per client_id and
 * consumes a point on success too, so re-verifying an unchanged enrolment on every edit
 * would spend that budget for nothing.
 */
export const assertEnrolmentWorks = async (autonomousAgent: EnrolledAutonomousAgent) => {
  clearAutonomousAgentSession(autonomousAgent.id)
  try {
    await getAutonomousAgentSession(autonomousAgent)
  } catch (err: any) {
    throw httpError(400, `the non-human identity "${autonomousAgent.nhi?.clientId}" could not be verified against simple-directory: ${err.message}. Check that the NHI exists, that its issuer is ${autonomousAgent.nhi?.issuer} and that its subject is ${autonomousAgentSubject(autonomousAgent.id)}.`)
  }
}

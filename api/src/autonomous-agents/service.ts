/**
 * service.ts contains stateful logic (mongo, config) built on top of operations.ts
 */

import mongo from '#mongo'
import config from '#config'
import { type AccountKeys, httpError, reqAdminMode, reqSessionAuthenticated } from '@data-fair/lib-express'
import type { Request } from 'express'
import { listMcpServerCatalog, unknownMcpServerIds } from '../mcp-servers/operations.ts'

export const getMcpServerCatalog = () => listMcpServerCatalog(config.mcpServers ?? [])

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

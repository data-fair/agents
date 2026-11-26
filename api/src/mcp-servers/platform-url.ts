/**
 * The address of data-fair's built-in server for an autonomous agent: the deployment's `privateMcpUrl`, unless
 * a development seam chose another for this agent (api/src/test-env/router.ts, reachable in development only).
 *
 * An agent a seam enrols gets no built-in server unless the caller names one (the dev MCP stand-in,
 * dev/mcp-server.ts, or the deployment's), so what a spec gathers does not depend on which server the
 * deployment wires; a placeholder identity is accepted by no MCP server anyway. Each choice keeps the agent's
 * owner, so the reset of a test sub-space forgets the choices of its agents, even of one deleted before it.
 * Empty in production: every agent gets `privateMcpUrl`.
 */
import config from '#config'
import type { AccountKeys } from '@data-fair/lib-express'

const chosen = new Map<string, { ownerId: string, url: string | null }>()

/** A seam's choice for one agent: a URL, null for none, undefined to go back to the deployment's. */
export const choosePlatformMcpUrl = (agent: { id: string, owner: Pick<AccountKeys, 'id'> }, url: string | null | undefined) => {
  if (url === undefined) chosen.delete(agent.id)
  else chosen.set(agent.id, { ownerId: agent.owner.id, url })
}

/** Forget the choices of every agent whose owner's id starts with a test prefix (the reset of the test seams). */
export const forgetPlatformMcpUrlsOf = (idPrefix: string) => {
  for (const [agentId, { ownerId }] of [...chosen]) {
    if (ownerId.startsWith(idPrefix)) chosen.delete(agentId)
  }
}

export const platformMcpUrlOf = (agentId: string): string | undefined => {
  const choice = chosen.get(agentId)
  return choice ? (choice.url ?? undefined) : (config.privateMcpUrl ?? undefined)
}

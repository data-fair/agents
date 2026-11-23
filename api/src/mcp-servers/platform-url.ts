/**
 * The address of data-fair's built-in server for an autonomous agent: the deployment's `privateMcpUrl`, unless
 * a development seam chose another for this agent (api/src/test-env/router.ts, reachable in development only).
 *
 * An agent a seam enrols gets no built-in server unless the caller names one (the dev MCP stand-in,
 * dev/mcp-server.ts, or the deployment's), so what a spec gathers does not depend on which server the
 * deployment wires; a placeholder identity is accepted by no MCP server anyway. Empty in production: every
 * agent gets `privateMcpUrl`.
 */
import config from '#config'

const chosen = new Map<string, string | null>()

/** A seam's choice for one agent: a URL, null for none, undefined to go back to the deployment's. */
export const choosePlatformMcpUrl = (agentId: string, url: string | null | undefined) => {
  if (url === undefined) chosen.delete(agentId)
  else chosen.set(agentId, url)
}

export const platformMcpUrlOf = (agentId: string): string | undefined =>
  chosen.has(agentId) ? (chosen.get(agentId) ?? undefined) : (config.privateMcpUrl ?? undefined)

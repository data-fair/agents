/**
 * The body the configuration form sends when EDITING an autonomous agent.
 *
 * Built from the write-req schema's own properties: the PUT route treats its body as the whole writable
 * document and resets anything absent, so a property missing here would be silently wiped on the next
 * edit. For `nhi` that un-enrols the agent and every later turn refuses.
 */

import writeReqSchema from '../../../api/doc/autonomous-agents/autonomous-agent-write-req/schema.js'

/** Every property the write-req schema accepts. */
export const AUTONOMOUS_AGENT_WRITABLE_KEYS = Object.keys(writeReqSchema.properties)

export function autonomousAgentEditDraft (autonomousAgent: Record<string, any>): Record<string, any> {
  const draft: Record<string, any> = {}
  for (const key of AUTONOMOUS_AGENT_WRITABLE_KEYS) {
    if (autonomousAgent[key] !== undefined) draft[key] = autonomousAgent[key]
  }
  // Arrays the form edits in place must exist, or vjsf has nothing to add an item to.
  draft.mcpServers = autonomousAgent.mcpServers ?? []
  // Only the client id is writable; siteUrl/issuer are derived by the server from the request that
  // enrolled the agent, and sending them back would be sending back values it ignores.
  if (autonomousAgent.nhi?.clientId) draft.nhi = { clientId: autonomousAgent.nhi.clientId }
  else delete draft.nhi
  return draft
}

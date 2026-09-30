/**
 * The body the configuration form sends when EDITING an autonomous agent.
 *
 * A function rather than an inline object literal, so it can be tested against the write-req schema:
 * the PUT route treats its body as the whole writable document and resets anything absent, so a
 * property added to that schema and forgotten here would be silently wiped on the next edit. For
 * `nhi` that un-enrols the agent and every later turn refuses.
 */

/** Every property the write-req schema accepts. Kept in sync by a unit test, not by memory. */
export const AUTONOMOUS_AGENT_WRITABLE_KEYS = [
  'title', 'persona', 'instructions', 'mcpServers', 'nhi', 'instructors', 'enabled'
] as const

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

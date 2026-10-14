/**
 * The body the configuration form sends when EDITING an autonomous agent.
 *
 * Built from the write-req schema's own properties: the PUT route treats its body as the whole writable
 * document and resets anything absent, so a property missing here would be silently wiped on the next
 * edit. For `nhi` that un-enrols the agent and every later turn refuses.
 */

import writeReqSchema from '../../../api/doc/autonomous-agents/autonomous-agent-write-req/schema.js'
import { DEFAULT_APPROVALS } from '@agents/shared/approval-policy'

/** Every property the write-req schema accepts. */
export const AUTONOMOUS_AGENT_WRITABLE_KEYS = Object.keys(writeReqSchema.properties)

export function autonomousAgentEditDraft (autonomousAgent: Record<string, any>): Record<string, any> {
  const draft: Record<string, any> = {}
  for (const key of AUTONOMOUS_AGENT_WRITABLE_KEYS) {
    if (autonomousAgent[key] !== undefined) draft[key] = autonomousAgent[key]
  }
  // Arrays the form edits in place must exist, or vjsf has nothing to add an item to.
  draft.mcpServers = autonomousAgent.mcpServers ?? []
  // The defaults the form materializes on load, listed rather than walked from the schema: the agent
  // page diffs the form against this draft, and an agent created through the API is stored without
  // them, so a page merely opened reported an unsaved change. A schema walk would also add
  // web.allowedUrls, which vjsf leaves out while web access is off.
  draft.instructors = autonomousAgent.instructors ?? []
  draft.approvals = { ...DEFAULT_APPROVALS, ...autonomousAgent.approvals }
  draft.memory = autonomousAgent.memory ?? { enabled: false }
  draft.web = autonomousAgent.web ?? { enabled: false }
  draft.externalMcpServers = autonomousAgent.externalMcpServers ?? []
  // Only the client id is writable; siteUrl/issuer are derived by the server from the request that
  // enrolled the agent, and sending them back would be sending back values it ignores.
  if (autonomousAgent.nhi?.clientId) draft.nhi = { clientId: autonomousAgent.nhi.clientId }
  else delete draft.nhi
  return draft
}

type McpServerRef = { serverId: string, profiles?: string[], toolFilter?: string[] }

/**
 * Each reference keeps only the selection its server takes: profiles on a profiled server, a toolFilter on
 * another. The form hides the other field, so a value left there after switching servers could neither be
 * seen nor fixed, and the save would refuse it. The same array comes back when nothing changes, so a
 * watcher applying it does not loop.
 */
export function pruneHiddenSelections<R extends McpServerRef> (refs: R[], profiledServers: string[]): R[] {
  let changed = false
  const pruned = refs.map(ref => {
    const hidden = profiledServers.includes(ref.serverId) ? 'toolFilter' : 'profiles'
    if (!(hidden in ref)) return ref
    changed = true
    const { [hidden]: _, ...kept } = ref
    return kept as R
  })
  return changed ? pruned : refs
}

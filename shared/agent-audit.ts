/**
 * Which conversations are AUDITED: readable by the account's admins and usable as the agent's memory,
 * without any consent of the person who wrote them.
 *
 * A conversation with a CONFIGURED autonomous agent is never private. Such an agent is an
 * organization's service with its own identity, its memory is agent-wide (what one instructor says
 * can shape every later run), and the organization answers for what it does — so the organization
 * must always be able to read what it was told. The consent model (`storeTraces` + the person's
 * cookie, see trace-consent.ts) is the personal assistant's: that one acts AS the person, and what
 * they say to it is theirs.
 *
 * Only the ids are shared. The standard agents' personas stay server-side
 * (api/src/agent-session/standard-agents.ts); a unit test keeps the two lists equal.
 */
export const STANDARD_AGENT_IDS = ['personal'] as const

export const isAuditedAgentId = (agentId: string | undefined): boolean =>
  !!agentId && !(STANDARD_AGENT_IDS as readonly string[]).includes(agentId)

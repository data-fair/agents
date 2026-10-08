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
 * Only the id is shared. The personal assistant's persona stays server-side
 * (api/src/agent-session/personal-agent.ts).
 */
export const PERSONAL_AGENT_ID = 'personal'

export const isAuditedAgentId = (agentId: string | undefined): boolean =>
  !!agentId && agentId !== PERSONAL_AGENT_ID

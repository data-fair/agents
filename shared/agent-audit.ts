/**
 * Which conversations are AUDITED: readable by the account's admins and usable as the agent's memory,
 * without any consent of the person who wrote them.
 *
 * A conversation with a CONFIGURED autonomous agent is never private. Such an agent is an
 * organization's service with its own identity, its memory is agent-wide (what one instructor says
 * can shape every later run), and the organization answers for what it does — so the organization
 * must always be able to read what it was told. The consent model (`reviewPersonalAssistant` + the person's
 * cookie, see review-consent.ts) is the personal assistant's: that one acts AS the person, and what
 * they say to it is theirs.
 *
 * Only the ids are shared. The personal assistants' persona stays server-side
 * (api/src/agent-session/personal-agent.ts).
 */
/** The front office's assistant: the one an embed without `agents` talks to, and the server's default. */
export const PORTAL_ASSISTANT_ID = 'portal-assistant'
/** The back office's assistant: the one a back-office embed (`agents`) talks to. */
export const BACK_OFFICE_ASSISTANT_ID = 'back-office-assistant'
export const PERSONAL_AGENT_IDS = [PORTAL_ASSISTANT_ID, BACK_OFFICE_ASSISTANT_ID]

export const isPersonalAgentId = (agentId: string | undefined): boolean =>
  !!agentId && PERSONAL_AGENT_IDS.includes(agentId)

export const isAuditedAgentId = (agentId: string | undefined): boolean =>
  !!agentId && !isPersonalAgentId(agentId)

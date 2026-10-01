/**
 * The standard agents: fixed ids, personas held here as strings.
 *
 * This is what replaces a client-supplied `systemPrompt` (finding §5b.7). A host application used to
 * hand the loop its own prose — through a prop, and on one path through a URL query parameter — which
 * on a server-held loop would have left a client in control of the model's INSTRUCTIONS while every
 * other client-controlled input had been removed. A host now NAMES an agent instead, and the text lives
 * on this side where it cannot be tampered with.
 *
 * Static strings for now, deliberately. A persona is product voice, so it belongs in configuration
 * rather than in a request — and a map in source is the cheapest thing that is already in the right
 * place. Moving it to env vars or to a collection later changes where the string comes from, not the
 * shape of anything around it.
 *
 * SYNTHETIC, not stored: no collection, no migration, no lifecycle. Built per call, like the personal
 * assistant always was.
 */

import type { AutonomousAgentForTools } from '../mcp-servers/client.ts'

/** The default agent: the assistant built into the application. */
export const PERSONAL_AGENT_ID = 'personal'

export interface StandardAgentDefinition {
  title: string
  persona: string
  instructions?: string
}

export interface StandardAgent extends AutonomousAgentForTools {
  title: string
  persona: string
  instructions?: string
  enabled: true
  /**
   * Absent, and that is the defining difference from a configured agent: a standard agent acts as the
   * PERSON using it, through their forwarded session, not as an identity of its own.
   */
  nhi?: undefined
}

/**
 * A line every standard agent carries, because it is true of all of them and the model has to know its
 * ceiling: the honest answer to a refused action is to say so, not to look for another route.
 */
const ACTS_AS_THE_PERSON =
  'You act with the permissions of the person using you — never more — so if something is not permitted, say so plainly rather than looking for another way.'

/**
 * The registry. Adding an agent is a string; its id becomes reservable immediately.
 *
 * Kept small on purpose: these are the personas this project itself ships. A deployment that wants its
 * own adds one here (and later through configuration), rather than every host passing prose.
 */
export const STANDARD_AGENTS: Record<string, StandardAgentDefinition> = {
  [PERSONAL_AGENT_ID]: {
    title: 'Assistant',
    persona: [
      'You are the assistant built into this application.',
      'You help the person using it with what is on the page in front of them, and with the data they can reach.',
      ACTS_AS_THE_PERSON
    ].join(' ')
  }
}

/** Whether an id names a standard agent. Also what makes these ids reserved against configured ones. */
export const isStandardAgentId = (id: string): boolean => Object.hasOwn(STANDARD_AGENTS, id)

/**
 * Build a standard agent, or undefined when the id names none.
 *
 * Every catalog entry, unfiltered: it acts as the person, so their own permissions are already the
 * ceiling. Narrowing here would be a second, weaker copy of an authorization decision that whatever the
 * tool calls already makes — and it is why an unreachable entry is skipped rather than fatal for these
 * agents (see §5b.2).
 *
 * The catalog is passed in rather than read from `#config`, following the rule `contextBudget` follows:
 * a module that imports `#config` cannot be unit tested, because that import validates the whole
 * deployment environment.
 */
export function standardAgent (id: string, catalog: Array<{ id: string }>): StandardAgent | undefined {
  const definition = STANDARD_AGENTS[id]
  if (!definition) return undefined
  return {
    id,
    title: definition.title,
    persona: definition.persona,
    ...(definition.instructions ? { instructions: definition.instructions } : {}),
    enabled: true,
    mcpServers: catalog.map(server => ({ serverId: server.id }))
  }
}

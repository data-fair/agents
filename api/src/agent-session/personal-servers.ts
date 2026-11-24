/**
 * The servers of the personal assistants for one account: the deployment's `personalAssistants`, unless a
 * development seam chose others for this account (api/src/test-env/router.ts, reachable in development only).
 *
 * A spec that needs catalog servers on an assistant names them through the seam, so what it gathers does not
 * depend on which servers the deployment gives the assistants (the development config gives them the dev
 * fixtures, a deployment like production none). Keyed by account, so a choice never reaches another account's
 * conversations. Empty in production: every account gets `personalAssistants`.
 */
import config from '#config'
import type { AccountKeys } from '@data-fair/lib-express'
import type { PersonalAssistantsConfig } from './personal-agent.ts'

const chosen = new Map<string, PersonalAssistantsConfig>()
const keyOf = (owner: Pick<AccountKeys, 'type' | 'id'>) => `${owner.type}:${owner.id}`

/** A seam's choice for one account: the assistants' servers, or undefined to go back to the deployment's. */
export const choosePersonalAssistants = (owner: Pick<AccountKeys, 'type' | 'id'>, assistants: PersonalAssistantsConfig | undefined) => {
  if (assistants === undefined) chosen.delete(keyOf(owner))
  else chosen.set(keyOf(owner), assistants)
}

/** Forget the choices of every account whose id starts with a test prefix (the reset of the test seams). */
export const forgetPersonalAssistantsOf = (idPrefix: string) => {
  for (const key of [...chosen.keys()]) {
    if (key.slice(key.indexOf(':') + 1).startsWith(idPrefix)) chosen.delete(key)
  }
}

export const personalAssistantsOf = (owner: Pick<AccountKeys, 'type' | 'id'>): PersonalAssistantsConfig =>
  chosen.get(keyOf(owner)) ?? config.personalAssistants ?? {}

/**
 * Enrolling an autonomous agent's non-human identity, from the browser.
 *
 * The two services are federated CLIENT-side: this calls simple-directory's own NHI API with the
 * admin's existing session (same origin through nginx, so the cookie applies), then stores the
 * resulting client id on the autonomous agent through our API. Our server never calls
 * simple-directory to manage an identity — it only ever verifies one, by performing a real token
 * exchange when the enrolment changes.
 *
 * The admin therefore never leaves this UI, and the two definitions cannot drift: the subject and the
 * issuer both come from one place each — `autonomousAgentNhiBody` for the subject, and this service's
 * own discovery document for the issuer.
 */

import { ref } from 'vue'
import { ofetch } from 'ofetch'
import { autonomousAgentNhiBody } from '@agents/shared/autonomous-agent-identity'
import { $apiPath, $fetch, $sdUrl } from '~/context'
import { autonomousAgentEditDraft } from '~/utils/autonomous-agent-draft'
import { enrolmentErrorMessage } from '~/utils/autonomous-agent-enrolment-error'

/**
 * Cross-service calls must NOT go through `$fetch`, which carries `baseURL: $apiPath`. ofetch applies
 * ufo's `withBase` to every string request, and that only leaves a path alone when it already starts
 * with the base — so `/simple-directory/api/...` became `/agents/api/simple-directory/api/...` and hit
 * our own `/api` 404 catch-all. simple-directory was never contacted at all, while the error surfaced
 * looked plausibly like a refusal from it. Same origin through nginx, so the session cookie applies
 * either way; only the prefixing has to go.
 */
const $crossServiceFetch = ofetch.create({})

export interface OrgNhi {
  id: string
  name?: string
  nhi?: { subject?: string, provider?: { issuer?: string } }
}

export function useAutonomousAgentEnrolment (accountType: string, accountId: string) {
  const enrolling = ref(false)
  const error = ref<string | null>(null)

  const nhisUrl = `${$sdUrl}/api/organizations/${accountId}/nhis`

  /**
   * The issuer this service will actually declare when it signs, read from its own discovery
   * document rather than rebuilt from window.location — which would be a second source of truth.
   */
  const readIssuer = async (): Promise<string> => {
    const discovery = await $fetch<{ issuer: string }>(`${$apiPath}/nhi/.well-known/openid-configuration`)
    if (!discovery?.issuer) throw new Error('this deployment serves no NHI issuer — is NHI_SIGNING_KEY configured?')
    return discovery.issuer
  }

  /** Identities already registered for this organization, so an admin can reuse one. */
  const listNhis = async (): Promise<OrgNhi[]> => {
    const res = await $crossServiceFetch<OrgNhi[] | { results?: OrgNhi[] }>(nhisUrl, { credentials: 'include' })
    return Array.isArray(res) ? res : (res.results ?? [])
  }

  /**
   * Register a new identity for this agent and attach it.
   *
   * Two phases, because the subject is derived from the agent's id: the agent must exist before its
   * identity can be created. That is why this is an action on a saved agent rather than a field in
   * the creation form.
   */
  const enrol = async (autonomousAgent: { id: string, title: string }, role?: string): Promise<void> => {
    enrolling.value = true
    error.value = null
    try {
      const issuer = await readIssuer()
      const created = await $crossServiceFetch<{ id: string }>(nhisUrl, {
        method: 'POST',
        body: autonomousAgentNhiBody({ agentId: autonomousAgent.id, title: autonomousAgent.title, issuer, role }),
        credentials: 'include'
      })
      await attach(autonomousAgent, created.id)
    } catch (err: any) {
      // simple-directory's NHI management is mongo-only: on a file-storage deployment createUser
      // throws and this fails. Say so rather than leaving the button apparently inert.
      //
      // Built so the result can never be EMPTY, which is the same thing as inert to a reader: the
      // status is always known, while `err.data` can legitimately be '' (a body-less 401/500), and
      // `?? ` passes an empty string straight through — the dialog then rendered nothing at all.
      error.value = enrolmentErrorMessage(err)
      throw err
    } finally {
      enrolling.value = false
    }
  }

  /**
   * Attach an existing identity. Our PUT verifies it by performing a real exchange and refuses if it
   * does not work, so a wrong client id fails here rather than at the agent's first turn.
   */
  const attach = async (autonomousAgent: { id: string }, clientId: string): Promise<void> => {
    const current = await $fetch<any>(`${$apiPath}/autonomous-agents/${accountType}/${accountId}/${autonomousAgent.id}`, { credentials: 'include' })
    await $fetch(`${$apiPath}/autonomous-agents/${accountType}/${accountId}/${autonomousAgent.id}`, {
      method: 'PUT',
      // The write route treats its body as the whole writable document, so the rest must travel with
      // the change or it would be reset.
      // Built from the same drift-tested projection the edit form uses, then overridden: listing the
      // writable fields again here would put a second copy outside that test, and a field added to the
      // schema would be silently wiped by every attach.
      body: { ...autonomousAgentEditDraft(current), nhi: { clientId } },
      credentials: 'include'
    })
  }

  return { enrolling, error, listNhis, enrol, attach, readIssuer }
}

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
import { autonomousAgentNhiBody } from '@agents/shared/autonomous-agent-identity'
import { $apiPath, $fetch, $sdUrl } from '~/context'

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
    const res = await $fetch<OrgNhi[] | { results?: OrgNhi[] }>(nhisUrl, { credentials: 'include' })
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
      const created = await $fetch<{ id: string }>(nhisUrl, {
        method: 'POST',
        body: autonomousAgentNhiBody({ autonomousAgentId: autonomousAgent.id, title: autonomousAgent.title, issuer, role }),
        credentials: 'include'
      })
      await attach(autonomousAgent, created.id)
    } catch (err: any) {
      // simple-directory's NHI management is mongo-only: on a file-storage deployment createUser
      // throws and this fails. Say so rather than leaving the button apparently inert.
      error.value = err?.data?.message ?? err?.data ?? err?.message ?? 'unknown error'
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
      body: {
        title: current.title,
        persona: current.persona,
        instructions: current.instructions,
        mcpServers: current.mcpServers ?? [],
        toolDisclosure: current.toolDisclosure,
        enabled: current.enabled,
        instructors: current.instructors,
        nhi: { clientId }
      },
      credentials: 'include'
    })
  }

  return { enrolling, error, listNhis, enrol, attach, readIssuer }
}

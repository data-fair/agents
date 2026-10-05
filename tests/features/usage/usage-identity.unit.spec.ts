/**
 * stateless unit tests for who a turn is BILLED as.
 *
 * This is the rule that decides whether a per-role quota applies at all, so it is worth pinning
 * directly rather than inferring from an end-to-end quota test.
 *
 * It exists because of a defect the swap introduced and nothing caught: one `usageIdentityFor` served
 * every agent, so a person chatting with the standard assistant was billed as
 * `autonomous-agent:personal` at role 'admin'. Role 'admin' means "no per-profile quota applies", so
 * the `user`/`external` quotas were silently unenforced for the chat — bounded only by the account
 * credit cap — and every person's spend landed on one histogram row, which is the figure an org admin
 * reads to see who spent what.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { usageIdentityFor } from '../../../api/src/conversations/operations.ts'
import { UNTRUSTED_POOL_ID } from '../../../api/src/usage/operations.ts'

const standard = { id: 'personal', title: 'Assistant' }
const configured = { id: 'support-triage', title: 'Support triage' }
const org = { type: 'organization' as const, id: 'test1' }
const personal = { type: 'user' as const, id: 'dmeadus0' }

test.describe('usageIdentityFor — a standard agent bills the PERSON', () => {
  test("carries the person's own role, so their quota applies", () => {
    const identity = usageIdentityFor(standard, {
      owner: org,
      triggeredBy: { userId: 'u1', userName: 'Una' },
      triggeredByRole: 'user'
    })
    assert.equal(identity.role, 'user')
    // The whole point: 'admin' here would mean no per-profile quota applies.
    assert.notEqual(identity.role, 'admin')
  })

  test('attributes spend to the person, not to the agent', () => {
    const identity = usageIdentityFor(standard, {
      owner: org,
      triggeredBy: { userId: 'u1', userName: 'Una' },
      triggeredByRole: 'contrib'
    })
    assert.equal(identity.trackPerUser, true)
    assert.equal(identity.usageUserId, 'u1')
    assert.equal(identity.usageUserName, 'Una')
    // The regression, stated as the assertion that would have caught it.
    assert.notEqual(identity.usageUserId, 'autonomous-agent:personal')
  })

  test('an untrusted role joins the shared pool', () => {
    // Otherwise external traffic could consume the whole account budget, which is exactly what the
    // pool cap exists to prevent.
    const identity = usageIdentityFor(standard, { owner: org, triggeredBy: { userId: 'u2' }, triggeredByRole: 'external' })
    assert.equal(identity.isUntrusted, true)
    assert.equal(identity.poolId, UNTRUSTED_POOL_ID)
  })

  test('a trusted role joins no pool', () => {
    const identity = usageIdentityFor(standard, { owner: org, triggeredBy: { userId: 'u1' }, triggeredByRole: 'admin' })
    assert.equal(identity.isUntrusted, false)
    assert.equal(identity.poolId, undefined)
  })

  test("a personal account's owner is not tracked per user", () => {
    // The account's own totals already say what they spent.
    const identity = usageIdentityFor(standard, { owner: personal, triggeredBy: { userId: 'dmeadus0' }, triggeredByRole: 'admin' })
    assert.equal(identity.trackPerUser, false)
    assert.equal(identity.usageUserId, undefined)
  })

  test('anyone else on a personal account is tracked per user, so their own quota applies', () => {
    // As on a request (authenticatedUsageIdentity). Untracked, an external person's quota was checked
    // against the ACCOUNT's spend, and nothing they spent was attributed to them.
    const identity = usageIdentityFor(standard, { owner: personal, triggeredBy: { userId: 'someone-else', userName: 'Someone' }, triggeredByRole: 'external' })
    assert.equal(identity.trackPerUser, true)
    assert.equal(identity.usageUserId, 'someone-else')
    assert.equal(identity.usageUserName, 'Someone')
  })

  test('a missing role falls back to the LEAST privileged of the normal roles, not to admin', () => {
    // A run created before this field existed, or by a path that forgot it, must not thereby escape
    // its quota. Defaulting to 'admin' would turn an omission into unlimited spend.
    const identity = usageIdentityFor(standard, { owner: org, triggeredBy: { userId: 'u1' } })
    assert.notEqual(identity.role, 'admin')
    assert.equal(identity.role, 'user')
  })
})

test.describe('usageIdentityFor — a configured agent bills the AGENT', () => {
  test('is keyed per agent at role admin, which is deliberate', () => {
    // Unchanged, and the reason is different in kind: a configured agent is an org-owned service
    // identity with its own NHI, not a person. Its bounds are the account credit cap and the per-run
    // budget, and keying per agent is what makes the histogram read as spend per agent.
    const identity = usageIdentityFor(configured, {
      owner: org,
      triggeredBy: { userId: 'u1', userName: 'Una' },
      triggeredByRole: 'user'
    })
    assert.equal(identity.role, 'admin')
    assert.equal(identity.usageUserId, 'autonomous-agent:support-triage')
    assert.equal(identity.usageUserName, 'Support triage')
    assert.equal(identity.isUntrusted, false)
  })

  test("the instructing person's role does NOT lower it", () => {
    // An agent's permissions come from its own identity; whoever asked does not change what it may
    // spend. This is the asymmetry with the standard agent above, and the reason the two branches
    // cannot be collapsed back into one.
    const asUser = usageIdentityFor(configured, { owner: org, triggeredBy: { userId: 'u1' }, triggeredByRole: 'external' })
    assert.equal(asUser.role, 'admin')
    assert.equal(asUser.isUntrusted, false)
  })

  test('is tracked per user even on a personal account, because the key is the agent', () => {
    const identity = usageIdentityFor(configured, { owner: personal, triggeredByRole: 'admin' })
    assert.equal(identity.trackPerUser, true)
    assert.equal(identity.usageUserId, 'autonomous-agent:support-triage')
  })
})

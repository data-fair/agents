/**
 * stateless unit tests for the audit rule: conversations with a CONFIGURED agent are never private.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { PERSONAL_AGENT_IDS, isAuditedAgentId } from '../../../shared/agent-audit.ts'
import { reviewableFilter } from '../../../api/src/review/reviewable.ts'
import { expiredArchiveFilter } from '../../../api/src/retention.ts'

test.describe('audit rule', () => {
  test('a configured agent is audited, the personal assistant is not', () => {
    assert.equal(isAuditedAgentId('a1b2c3'), true)
    assert.equal(isAuditedAgentId('portal-assistant'), false)
    assert.equal(isAuditedAgentId('back-office-assistant'), false)
    assert.equal(isAuditedAgentId(undefined), false)
    assert.equal(isAuditedAgentId(''), false)
  })

  test('review filter: audited threads always, personal-assistant ones only with reviewPersonalAssistant + consent + window', () => {
    const owner = { type: 'organization', id: 'o1' } as const
    const withConsented = reviewableFilter(owner, { reviewPersonalAssistant: true, cutoff: '2026-01-01T00:00:00.000Z' }) as any
    assert.equal(withConsented.$or.length, 2)
    assert.deepEqual(withConsented.$or[0], { agentId: { $nin: PERSONAL_AGENT_IDS } })
    assert.deepEqual(withConsented.$or[1], {
      agentId: { $in: PERSONAL_AGENT_IDS },
      consentedToReview: true,
      lastMessageAt: { $gte: '2026-01-01T00:00:00.000Z' }
    })
    const without = reviewableFilter(owner, { reviewPersonalAssistant: false, cutoff: 'x' }) as any
    assert.deepEqual(without.$or, [{ agentId: { $nin: PERSONAL_AGENT_IDS } }])
  })

  test('the archive sweep never selects an audited thread', () => {
    const filter = expiredArchiveFilter(new Date('2026-10-07T00:00:00Z')) as any
    assert.deepEqual(filter.agentId, { $in: PERSONAL_AGENT_IDS })
  })
})

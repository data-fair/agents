/**
 * stateless unit tests for the audit rule: conversations with a CONFIGURED agent are never private.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { PERSONAL_AGENT_ID, isAuditedAgentId } from '../../../shared/agent-audit.ts'
import { reviewableFilter } from '../../../api/src/review/reviewable.ts'
import { expiredArchiveFilter } from '../../../api/src/retention.ts'

test.describe('audit rule', () => {
  test('a configured agent is audited, a standard one is not', () => {
    assert.equal(isAuditedAgentId('a1b2c3'), true)
    assert.equal(isAuditedAgentId('personal'), false)
    assert.equal(isAuditedAgentId(undefined), false)
    assert.equal(isAuditedAgentId(''), false)
  })

  test('review filter: audited threads always, standard ones only with storeTraces + consent + window', () => {
    const owner = { type: 'organization', id: 'o1' } as const
    const withTraces = reviewableFilter(owner, { storeTraces: true, cutoff: '2026-01-01T00:00:00.000Z' }) as any
    assert.equal(withTraces.$or.length, 2)
    assert.deepEqual(withTraces.$or[0], { agentId: { $nin: [PERSONAL_AGENT_ID] } })
    assert.deepEqual(withTraces.$or[1], {
      agentId: { $in: [PERSONAL_AGENT_ID] },
      consentedToReview: true,
      lastMessageAt: { $gte: '2026-01-01T00:00:00.000Z' }
    })
    const without = reviewableFilter(owner, { storeTraces: false, cutoff: 'x' }) as any
    assert.deepEqual(without.$or, [{ agentId: { $nin: [PERSONAL_AGENT_ID] } }])
  })

  test('the archive sweep never selects an audited thread', () => {
    const filter = expiredArchiveFilter(new Date('2026-10-07T00:00:00Z')) as any
    assert.deepEqual(filter.agentId, { $in: [PERSONAL_AGENT_ID] })
  })
})

/**
 * stateless unit tests for autonomous agent authorization
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { canInstruct, type InstructSession } from '../../../api/src/autonomous-agents/operations.ts'

const agent = {
  owner: { type: 'organization', id: 'test1' },
  instructors: [{ userId: 'listed-user', userName: 'Listed User' }]
}

const session = (over: Partial<InstructSession> = {}): InstructSession => ({
  user: { id: 'someone' },
  account: { type: 'organization', id: 'test1' },
  accountRole: 'user',
  ...over
})

test.describe('canInstruct', () => {
  test('an admin of the owning account may instruct', () => {
    assert.equal(canInstruct(agent, session({ accountRole: 'admin' })), true)
  })

  test('a listed instructor may instruct even without a role', () => {
    assert.equal(canInstruct(agent, session({ user: { id: 'listed-user' } })), true)
  })

  test('a plain member of the owning account may not instruct', () => {
    assert.equal(canInstruct(agent, session()), false)
  })

  test('an admin of a DIFFERENT account may not instruct', () => {
    assert.equal(canInstruct(agent, session({ account: { type: 'organization', id: 'other' }, accountRole: 'admin' })), false)
  })

  test('a listed instructor coming from another account may still instruct', () => {
    assert.equal(canInstruct(agent, session({ user: { id: 'listed-user' }, account: { type: 'organization', id: 'other' } })), true)
  })

  test('a superadmin in admin mode may instruct', () => {
    assert.equal(canInstruct(agent, session({ user: { id: 'someone', adminMode: true } })), true)
  })

  test('an absent instructors list denies rather than throws', () => {
    assert.equal(canInstruct({ owner: agent.owner }, session()), false)
  })
})

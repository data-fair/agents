/**
 * stateless unit tests for autonomous agent authorization
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { canInstruct, type InstructableAgent } from '../../../api/src/autonomous-agents/operations.ts'
import type { AccessRef } from '@data-fair/lib-common-types/access-ref/index.js'
import type { SessionStateAuthenticated, User } from '@data-fair/lib-common-types/session/index.js'

const human = (id: string, email = `${id}@test.com`): User => ({ id, email, name: id, organizations: [] })

const agentWith = (instructors: AccessRef[]): InstructableAgent => ({
  owner: { type: 'organization', id: 'test1' },
  instructors
})

const listedAgent = agentWith([{ mode: 'member', type: 'user', id: 'listed-user' }])

const session = (over: Partial<SessionStateAuthenticated> = {}): SessionStateAuthenticated => ({
  lang: 'fr',
  user: human('someone'),
  account: { type: 'organization', id: 'test1', name: 'Test 1' },
  accountRole: 'user',
  ...over
})

test.describe('canInstruct', () => {
  test('an admin of the owning account may instruct', () => {
    assert.equal(canInstruct(listedAgent, session({ accountRole: 'admin' })), true)
  })

  test('a listed instructor may instruct even without a role', () => {
    assert.equal(canInstruct(listedAgent, session({ user: human('listed-user') })), true)
  })

  test('a plain member of the owning account may not instruct', () => {
    assert.equal(canInstruct(listedAgent, session()), false)
  })

  test('an admin of a DIFFERENT account may not instruct', () => {
    assert.equal(canInstruct(listedAgent, session({ account: { type: 'organization', id: 'other', name: 'Other' }, accountRole: 'admin' })), false)
  })

  test('a listed instructor coming from another account may still instruct', () => {
    assert.equal(canInstruct(listedAgent, session({ user: human('listed-user'), account: { type: 'organization', id: 'other', name: 'Other' } })), true)
  })

  test('a superadmin in admin mode may instruct', () => {
    assert.equal(canInstruct(listedAgent, session({ user: { ...human('someone'), adminMode: 1 } })), true)
  })

  test('an absent instructors list denies rather than throws', () => {
    assert.equal(canInstruct({ owner: listedAgent.owner }, session()), false)
  })

  test('an email access ref matches by email, across accounts', () => {
    const agent = agentWith([{ mode: 'member', type: 'user', email: 'invited@test.com' }])
    assert.equal(canInstruct(agent, session({ user: human('anyone', 'invited@test.com') })), true)
    assert.equal(canInstruct(agent, session({ user: human('anyone', 'someone-else@test.com') })), false)
  })

  test('an emailless identity never matches an email access ref', () => {
    // Non-human identities carry no usable email; the lib guard this exercises must hold here too.
    const agent = agentWith([{ mode: 'member', type: 'user', email: 'invited@test.com' }])
    const nhiSession = session({ user: { ...human('svc', 'invited@test.com'), email: undefined } as unknown as User })
    assert.equal(canInstruct(agent, nhiSession), false)
  })

  test('a partner organization access ref matches the ACTIVE account and its roles', () => {
    const agent = agentWith([{ mode: 'member', type: 'organization', id: 'partner', department: '*', roles: ['member'] }])
    assert.equal(canInstruct(agent, session({ account: { type: 'organization', id: 'partner', name: 'Partner' }, accountRole: 'member' })), true)
    assert.equal(canInstruct(agent, session({ account: { type: 'organization', id: 'partner', name: 'Partner' }, accountRole: 'admin' })), false)
    assert.equal(canInstruct(agent, session({ account: { type: 'organization', id: 'other', name: 'Other' }, accountRole: 'member' })), false)
  })

  test('an internal role/department ref matches the owning organization', () => {
    const agent = agentWith([{ mode: 'internal', type: 'organization', id: 'test1', department: '*', roles: ['admin'] }])
    assert.equal(canInstruct(agent, session({ accountRole: 'admin' })), true)
    assert.equal(canInstruct(agent, session({ accountRole: 'user' })), false)
  })

  test('an internal department ref matches its department and refuses another', () => {
    const agent = agentWith([{ mode: 'internal', type: 'organization', id: 'test1', department: 'd1', roles: [] }])
    assert.equal(canInstruct(agent, session({ account: { type: 'organization', id: 'test1', name: 'Test 1', department: 'd1' } })), true)
    assert.equal(canInstruct(agent, session({ account: { type: 'organization', id: 'test1', name: 'Test 1', department: 'd2' } })), false)
  })

  test('a department admin cannot instruct an org-root agent', () => {
    // The owner rule keeps its exact department comparison; matchAccessRef would treat the absent
    // department as "all departments" and grant this.
    const departmentAdmin = session({ account: { type: 'organization', id: 'test1', name: 'Test 1', department: 'd1' }, accountRole: 'admin' })
    assert.equal(canInstruct(listedAgent, departmentAdmin), false)
  })
})

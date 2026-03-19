import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { assertCanUseModel } from '../../../api/src/auth.ts'

// Minimal session-like objects for testing
const makeSession = (accountType: string, accountId: string, role = 'admin') => ({
  account: { type: accountType, id: accountId },
  user: { id: accountId },
  accountRole: role
})

const makeOwner = (type: 'user' | 'organization', id: string) => ({ type, id })

test.describe('assertCanUseModel', () => {
  test('admin of owner account always has access', () => {
    const session = makeSession('user', 'user1', 'admin')
    const owner = makeOwner('user', 'user1')
    assert.doesNotThrow(() => assertCanUseModel(session as any, owner, { roles: [] }))
  })

  test('same-account member with non-empty roles has access', () => {
    const session = makeSession('organization', 'org1', 'user')
    const owner = makeOwner('organization', 'org1')
    assert.doesNotThrow(() => assertCanUseModel(session as any, owner, { roles: ['user'] }))
  })

  test('same-account member denied when roles is empty (admin-only)', () => {
    const session = makeSession('organization', 'org1', 'user')
    const owner = makeOwner('organization', 'org1')
    assert.throws(() => assertCanUseModel(session as any, owner, { roles: [] }), { status: 403 })
  })

  test('external user granted when roles includes external', () => {
    const session = makeSession('user', 'external-user1', 'admin')
    const owner = makeOwner('organization', 'org1')
    assert.doesNotThrow(() => assertCanUseModel(session as any, owner, { roles: ['external'] }))
  })

  test('external user denied when roles does not include external', () => {
    const session = makeSession('user', 'external-user1', 'admin')
    const owner = makeOwner('organization', 'org1')
    assert.throws(() => assertCanUseModel(session as any, owner, { roles: ['user'] }), { status: 403 })
  })

  test('external user denied when roles is empty', () => {
    const session = makeSession('user', 'external-user1', 'admin')
    const owner = makeOwner('organization', 'org1')
    assert.throws(() => assertCanUseModel(session as any, owner, { roles: [] }), { status: 403 })
  })
})

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { assertCanUseModel, assertRoleQuota, getEffectiveRole } from '../../../api/src/auth.ts'

// Minimal session-like objects for testing
const makeSession = (accountType: string, accountId: string, role?: string) => ({
  account: { type: accountType, id: accountId },
  user: { id: accountId },
  accountRole: role
})

const makeOwner = (type: 'user' | 'organization', id: string) => ({ type, id })

const defaultQuotas = {
  admin: { unlimited: true, monthlyLimit: 0 },
  contrib: { unlimited: false, monthlyLimit: 0 },
  user: { unlimited: false, monthlyLimit: 0 },
  external: { unlimited: false, monthlyLimit: 0 },
  anonymous: { unlimited: false, monthlyLimit: 0 }
}

test.describe('getEffectiveRole', () => {
  test('same account admin', () => {
    const session = makeSession('user', 'user1', 'admin')
    assert.equal(getEffectiveRole(session as any, makeOwner('user', 'user1')), 'admin')
  })

  test('same account contrib', () => {
    const session = makeSession('organization', 'org1', 'contrib')
    assert.equal(getEffectiveRole(session as any, makeOwner('organization', 'org1')), 'contrib')
  })

  test('same account with undefined role defaults to user', () => {
    const session = makeSession('organization', 'org1')
    assert.equal(getEffectiveRole(session as any, makeOwner('organization', 'org1')), 'user')
  })

  test('different account returns external', () => {
    const session = makeSession('user', 'user1', 'admin')
    assert.equal(getEffectiveRole(session as any, makeOwner('organization', 'org1')), 'external')
  })
})

test.describe('assertCanUseModel', () => {
  test('admin with unlimited quota always has access', () => {
    const session = makeSession('user', 'user1', 'admin')
    const owner = makeOwner('user', 'user1')
    assert.doesNotThrow(() => assertCanUseModel(session as any, owner, defaultQuotas))
  })

  test('contrib with positive monthly quota has access', () => {
    const session = makeSession('organization', 'org1', 'contrib')
    const owner = makeOwner('organization', 'org1')
    const quotas = { ...defaultQuotas, contrib: { unlimited: false, monthlyLimit: 10 } }
    assert.doesNotThrow(() => assertCanUseModel(session as any, owner, quotas))
  })

  test('contrib with zero quotas is denied', () => {
    const session = makeSession('organization', 'org1', 'contrib')
    const owner = makeOwner('organization', 'org1')
    assert.throws(() => assertCanUseModel(session as any, owner, defaultQuotas), { status: 403 })
  })

  test('user with unlimited quota has access', () => {
    const session = makeSession('organization', 'org1', 'user')
    const owner = makeOwner('organization', 'org1')
    const quotas = { ...defaultQuotas, user: { unlimited: true, monthlyLimit: 0 } }
    assert.doesNotThrow(() => assertCanUseModel(session as any, owner, quotas))
  })

  test('external user with positive quota has access', () => {
    const session = makeSession('user', 'external-user1', 'admin')
    const owner = makeOwner('organization', 'org1')
    const quotas = { ...defaultQuotas, external: { unlimited: false, monthlyLimit: 5 } }
    assert.doesNotThrow(() => assertCanUseModel(session as any, owner, quotas))
  })

  test('external user with zero quotas is denied', () => {
    const session = makeSession('user', 'external-user1', 'admin')
    const owner = makeOwner('organization', 'org1')
    assert.throws(() => assertCanUseModel(session as any, owner, defaultQuotas), { status: 403 })
  })

  test('undefined accountRole defaults to user role', () => {
    const session = makeSession('organization', 'org1')
    const owner = makeOwner('organization', 'org1')
    // user quota is 0 by default → denied
    assert.throws(() => assertCanUseModel(session as any, owner, defaultQuotas), { status: 403 })
    // with positive user quota → allowed
    const quotas = { ...defaultQuotas, user: { unlimited: false, monthlyLimit: 1 } }
    assert.doesNotThrow(() => assertCanUseModel(session as any, owner, quotas))
  })

  test('missing quota entry for role is denied', () => {
    const session = makeSession('organization', 'org1', 'contrib')
    const owner = makeOwner('organization', 'org1')
    assert.throws(() => assertCanUseModel(session as any, owner, {}), { status: 403 })
  })
})

test.describe('assertRoleQuota (anonymous)', () => {
  test('anonymous with positive monthly quota has access', () => {
    const quotas = { ...defaultQuotas, anonymous: { unlimited: false, monthlyLimit: 1 } }
    assert.doesNotThrow(() => assertRoleQuota('anonymous', quotas))
  })

  test('anonymous with unlimited quota has access', () => {
    const quotas = { ...defaultQuotas, anonymous: { unlimited: true, monthlyLimit: 0 } }
    assert.doesNotThrow(() => assertRoleQuota('anonymous', quotas))
  })

  test('anonymous with zero quotas is denied', () => {
    assert.throws(() => assertRoleQuota('anonymous', defaultQuotas), { status: 403 })
  })

  test('anonymous with no quota entry is denied', () => {
    const quotas = { admin: defaultQuotas.admin }
    assert.throws(() => assertRoleQuota('anonymous', quotas), { status: 403 })
  })
})

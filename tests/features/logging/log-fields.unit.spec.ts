import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { ownerLogFields } from '../../../api/src/log-fields.ts'

test.describe('Owner log fields', () => {
  test('an owner gives its key, department and name', () => {
    assert.deepEqual(ownerLogFields({ type: 'organization', id: 'o1', department: 'd1', name: 'Org 1' }), { ownerKey: 'organization.o1', ownerDep: 'd1', ownerName: 'Org 1' })
  })

  test('absent or empty department and name stay present as undefined', () => {
    const fields = ownerLogFields({ type: 'user', id: 'u1', department: '' })
    assert.deepEqual(fields, { ownerKey: 'user.u1', ownerDep: undefined, ownerName: undefined })
    assert.deepEqual(Object.keys(fields), ['ownerKey', 'ownerDep', 'ownerName'])
  })
})

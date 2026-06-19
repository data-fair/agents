/**
 * stateful API tests for the superadmin github source proxy
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin } from '../../support/axios.ts'

const admin = await superAdmin
const normalUser = await axiosAuth('test1-user1')

test.describe('Admin github proxy', () => {
  test('rejects a non-superadmin with 403', async () => {
    await assert.rejects(
      normalUser.get('/api/admin/github?path=/repos/data-fair/agents/tags'),
      (err: any) => err.status === 403
    )
  })

  test('rejects a repo outside the whitelist with 400', async () => {
    await assert.rejects(
      admin.get('/api/admin/github?path=/repos/evil/repo/contents/x'),
      (err: any) => err.status === 400
    )
  })

  test('rejects a path-traversal attempt with 400', async () => {
    await assert.rejects(
      admin.get('/api/admin/github?path=/repos/data-fair/agents/../../etc'),
      (err: any) => err.status === 400
    )
  })

  test('rejects a non-/repos path with 400', async () => {
    await assert.rejects(
      admin.get('/api/admin/github?path=/users/data-fair'),
      (err: any) => err.status === 400
    )
  })
})

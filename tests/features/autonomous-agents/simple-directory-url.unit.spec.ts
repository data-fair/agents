/**
 * stateless unit tests for the site-path rewrite of access-ref getItems urls
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { rewriteSimpleDirectoryUrl } from '../../../ui/src/utils/simple-directory-url.ts'

test.describe('rewriteSimpleDirectoryUrl', () => {
  test('a root-mounted directory is left alone', () => {
    assert.equal(
      rewriteSimpleDirectoryUrl('http://localhost:3080/simple-directory/api/organizations/test1/members', '/simple-directory'),
      'http://localhost:3080/simple-directory/api/organizations/test1/members'
    )
  })

  test('the prefix is moved under the site path, query preserved', () => {
    assert.equal(
      rewriteSimpleDirectoryUrl('http://localhost:3080/simple-directory/api/organizations/test1/members?q=a', '/agents/simple-directory'),
      'http://localhost:3080/agents/simple-directory/api/organizations/test1/members?q=a'
    )
  })

  test('another service is not touched', () => {
    assert.equal(
      rewriteSimpleDirectoryUrl('http://localhost:3080/agents/api/autonomous-agents', '/agents/simple-directory'),
      'http://localhost:3080/agents/api/autonomous-agents'
    )
  })

  test('a lookalike path prefix is not touched', () => {
    assert.equal(
      rewriteSimpleDirectoryUrl('http://localhost:3080/simple-directory-evil/x', '/agents/simple-directory'),
      'http://localhost:3080/simple-directory-evil/x'
    )
  })

  test('a non-absolute url is returned as it was given', () => {
    assert.equal(rewriteSimpleDirectoryUrl('/simple-directory/api/x', '/agents/simple-directory'), '/simple-directory/api/x')
  })
})

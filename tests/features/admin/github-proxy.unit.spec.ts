import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import {
  validateGithubSourcePath,
  buildGithubUrl,
  truncateGithubBody,
  githubErrorMessage
} from '../../../api/src/admin/github-proxy.ts'

test.describe('github-proxy helpers', () => {
  test('accepts whitelisted repo paths', () => {
    assert.equal(validateGithubSourcePath('/repos/data-fair/agents/contents/docs/architecture').ok, true)
    assert.equal(validateGithubSourcePath('/repos/data-fair/data-fair/git/trees/main').ok, true)
    assert.equal(validateGithubSourcePath('/repos/data-fair/portals/contents/portal').ok, true)
    assert.equal(validateGithubSourcePath('/repos/json-layout/json-layout/contents/core/src/webmcp/tools').ok, true)
  })

  test('rejects non-/repos paths', () => {
    const r = validateGithubSourcePath('/users/data-fair')
    assert.equal(r.ok, false)
  })

  test('rejects repos outside the whitelist', () => {
    const r = validateGithubSourcePath('/repos/evil/repo/contents/x')
    assert.equal(r.ok, false)
  })

  test('rejects path traversal and protocol tricks', () => {
    assert.equal(validateGithubSourcePath('/repos/data-fair/agents/../../etc').ok, false)
    assert.equal(validateGithubSourcePath('/repos/data-fair/agents//x').ok, false)
    assert.equal(validateGithubSourcePath('/repos/data-fair/agents/http://evil').ok, false)
  })

  test('buildGithubUrl appends query only when present', () => {
    assert.equal(buildGithubUrl('/repos/data-fair/agents/tags'), 'https://api.github.com/repos/data-fair/agents/tags')
    assert.equal(buildGithubUrl('/repos/data-fair/agents/git/trees/main', 'recursive=1'), 'https://api.github.com/repos/data-fair/agents/git/trees/main?recursive=1')
  })

  test('truncateGithubBody truncates past the budget', () => {
    assert.deepEqual(truncateGithubBody('short', 10), { text: 'short', truncated: false })
    assert.deepEqual(truncateGithubBody('0123456789ABC', 10), { text: '0123456789', truncated: true })
  })

  test('githubErrorMessage maps rate-limit, 404 and other statuses', () => {
    assert.match(githubErrorMessage(403, '0', ''), /rate limit/i)
    assert.equal(githubErrorMessage(404, '59', ''), 'Not found')
    assert.match(githubErrorMessage(500, '59', 'boom'), /HTTP 500: boom/)
  })
})

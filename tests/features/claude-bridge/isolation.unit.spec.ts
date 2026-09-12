/**
 * stateless unit tests for the claude-bridge isolation invariant (spec §1.2)
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import os from 'node:os'
import { createNeutralCwd, scrubEnv, isolationOptions } from '../../../dev/claude-bridge/isolation.ts'

test.describe('claude-bridge isolation', () => {
  test('the neutral cwd is a fresh temp dir, not the repo', () => {
    const cwd = createNeutralCwd()
    assert.ok(cwd.startsWith(os.tmpdir()), `${cwd} should be under ${os.tmpdir()}`)
    assert.ok(!cwd.includes('data-fair'), 'cwd must not leak a project name')
    assert.notEqual(cwd, createNeutralCwd())
  })

  test('scrubEnv removes every CLAUDE_CODE_ variable and keeps the rest', () => {
    const scrubbed = scrubEnv({ PATH: '/usr/bin', HOME: '/home/x', CLAUDE_CODE_SESSION_ID: 'abc', CLAUDE_CODE_ENTRYPOINT: 'cli' })
    assert.equal(scrubbed.PATH, '/usr/bin')
    assert.equal(scrubbed.HOME, '/home/x')
    assert.deepEqual(Object.keys(scrubbed).filter(k => k.startsWith('CLAUDE_CODE_')), [])
  })

  test('isolationOptions pins every setting the guarantee depends on', () => {
    const opts = isolationOptions('/tmp/neutral', { CLAUDE_CODE_SESSION_ID: 'abc' })
    assert.deepEqual(opts.settingSources, [])
    assert.deepEqual(opts.tools, [])
    assert.equal(opts.strictMcpConfig, true)
    assert.equal(opts.cwd, '/tmp/neutral')
    assert.equal(opts.env.CLAUDE_CODE_SESSION_ID, undefined)
  })
})

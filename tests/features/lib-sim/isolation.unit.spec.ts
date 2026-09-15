/**
 * stateless unit tests for the claude-bridge isolation invariant (spec §1.2)
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import os from 'node:os'
import fs from 'node:fs'
import { createNeutralCwd, scrubEnv, isolationOptions } from '../../../lib-sim/isolation.ts'

// Every directory this file creates, removed afterwards: the suite otherwise left
// two bridge-* dirs in the temp dir per run — the very leak persona.unit.spec.ts
// has a guard test against.
const created: string[] = []
const neutralCwd = () => {
  const cwd = createNeutralCwd()
  created.push(cwd)
  return cwd
}

test.afterAll(() => {
  for (const cwd of created) fs.rmSync(cwd, { recursive: true, force: true })
})

test.describe('claude-bridge isolation', () => {
  test('the neutral cwd is a fresh temp dir, not the repo', () => {
    const cwd = neutralCwd()
    assert.ok(cwd.startsWith(os.tmpdir()), `${cwd} should be under ${os.tmpdir()}`)
    assert.ok(!cwd.includes('data-fair'), 'cwd must not leak a project name')
    assert.notEqual(cwd, neutralCwd())
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

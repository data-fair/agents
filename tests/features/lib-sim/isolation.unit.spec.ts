/**
 * stateless unit tests for the claude-bridge isolation invariant (spec §1.2)
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import {
  createNeutralCwd, scrubEnv, isolationOptions, neutralGlobalConfig, realGlobalConfigPath
} from '../../../lib-sim/isolation.ts'

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

const OPERATOR_EMAIL = 'operator@example.org'
const operatorAccount = {
  accountUuid: 'acc-1',
  emailAddress: OPERATOR_EMAIL,
  displayName: 'Op',
  fullName: 'Operator Person',
  organizationUuid: 'org-1',
  billingType: 'stripe_subscription',
  accountCreatedAt: '2025-01-01T00:00:00Z',
  subscriptionCreatedAt: '2025-01-01T00:00:00Z',
  ccOnboardingFlags: {},
  profileFetchedAt: 1
}

/** A stand-in for the developer's own Claude Code config dir, holding the account. */
const operatorConfigDir = () => {
  const dir = neutralCwd()
  fs.writeFileSync(path.join(dir, '.claude.json'), JSON.stringify({ oauthAccount: operatorAccount, numStartups: 3 }))
  return dir
}

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
    const cwd = neutralCwd()
    const opts = isolationOptions(cwd, { CLAUDE_CODE_SESSION_ID: 'abc', CLAUDE_CONFIG_DIR: operatorConfigDir() })
    assert.deepEqual(opts.settingSources, [])
    assert.deepEqual(opts.tools, [])
    assert.equal(opts.strictMcpConfig, true)
    assert.equal(opts.cwd, cwd)
    assert.equal(opts.env.CLAUDE_CODE_SESSION_ID, undefined)
  })

  // The leak this pins: the CLI puts "The user's email address is <operator's>" in front
  // of the model from the global config's oauthAccount, whatever systemPrompt and
  // settingSources say — and an agent with a memory tool stored it as its user's.
  test('the CLI runs on a private config dir whose account carries no identity', () => {
    const cwd = neutralCwd()
    const realDir = operatorConfigDir()
    const opts = isolationOptions(cwd, { CLAUDE_CONFIG_DIR: realDir })

    const configDir = opts.env.CLAUDE_CONFIG_DIR
    assert.ok(configDir, 'CLAUDE_CONFIG_DIR must be set, or the CLI reads the operator\'s own')
    assert.notEqual(configDir, realDir)
    assert.ok(configDir.startsWith(cwd + path.sep), 'the config dir lives in the neutral cwd')
    assert.notEqual(path.basename(configDir), '.claude', 'it must not pass for a project config dir')

    const raw = fs.readFileSync(path.join(configDir, '.claude.json'), 'utf8')
    assert.ok(!raw.includes(OPERATOR_EMAIL), 'the operator\'s email must not reach the CLI')
    assert.ok(!raw.includes('Operator Person'), 'nor their name')
    // The account itself must stay, or the CLI refetches the profile and writes it back.
    const seeded = JSON.parse(raw)
    assert.equal(seeded.oauthAccount.accountUuid, 'acc-1')
    assert.ok(Date.now() - seeded.oauthAccount.profileFetchedAt < 60_000, 'a fresh stamp skips the refetch')

    // Credentials are not copied: they stay in the operator's store, so a refresh
    // token rotated by a bridged query is the same one the operator's session uses.
    assert.equal(opts.env.CLAUDE_SECURESTORAGE_CONFIG_DIR, realDir)
    assert.ok(!fs.existsSync(path.join(configDir, '.credentials.json')))
    // A background request otherwise wrote the email back mid-session.
    assert.equal(opts.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC, '1')
  })

  test('without CLAUDE_CONFIG_DIR, credentials stay in the default store', () => {
    const opts = isolationOptions(neutralCwd(), { HOME: neutralCwd() })
    // Empty, not unset: the CLI then reads ~/.claude, exactly as the operator's own CLI.
    assert.equal(opts.env.CLAUDE_SECURESTORAGE_CONFIG_DIR, '')
  })

  test('fails closed when the CLI wrote the identity back', () => {
    const cwd = neutralCwd()
    const env = { CLAUDE_CONFIG_DIR: operatorConfigDir() }
    const file = path.join(isolationOptions(cwd, env).env.CLAUDE_CONFIG_DIR!, '.claude.json')
    const current = JSON.parse(fs.readFileSync(file, 'utf8'))
    fs.writeFileSync(file, JSON.stringify({ ...current, oauthAccount: { ...current.oauthAccount, emailAddress: OPERATOR_EMAIL } }))
    assert.throws(() => isolationOptions(cwd, env), /isolation broken/)
  })

  test('neutralGlobalConfig keeps the account and drops who it is', () => {
    const config = neutralGlobalConfig({ oauthAccount: operatorAccount, numStartups: 3 }, 42)
    assert.deepEqual(Object.keys(config), ['oauthAccount'], 'nothing else is carried over')
    assert.equal(config.oauthAccount?.emailAddress, undefined)
    assert.equal(config.oauthAccount?.displayName, undefined)
    assert.equal(config.oauthAccount?.fullName, undefined)
    assert.equal(config.oauthAccount?.organizationUuid, 'org-1')
    assert.equal(config.oauthAccount?.profileFetchedAt, 42)
    assert.deepEqual(neutralGlobalConfig(undefined, 42), {})
  })

  test('realGlobalConfigPath follows CLAUDE_CONFIG_DIR, else HOME', () => {
    assert.equal(realGlobalConfigPath({ CLAUDE_CONFIG_DIR: '/c', HOME: '/h' }), path.join('/c', '.claude.json'))
    assert.equal(realGlobalConfigPath({ HOME: '/h' }), path.join('/h', '.claude.json'))
  })
})

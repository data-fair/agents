/**
 * stateless unit tests for the renamed settings: an old name must neither break a deployment nor be
 * silently ignored (which would quietly put it back on a default nobody chose).
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { applyDeprecatedConfig } from '../../../api/src/config-aliases.ts'

const defaults = { turnCredits: 500, turnTimeoutSeconds: 300 }

test.describe('deprecated setting names', () => {
  test('nothing old set: the config is unchanged, nothing reported', () => {
    const { config, warnings } = applyDeprecatedConfig({ ...defaults }, {})
    assert.deepEqual(config, defaults)
    assert.deepEqual(warnings, [])
  })

  test('an old ENV VAR is still read, and reported', () => {
    const { config, warnings } = applyDeprecatedConfig({ ...defaults }, { AUTONOMOUS_AGENT_RUN_CREDITS: '42' })
    assert.equal(config.turnCredits, 42)
    assert.equal(warnings.length, 1)
    assert.match(warnings[0], /AUTONOMOUS_AGENT_RUN_CREDITS is deprecated, set TURN_CREDITS/)
  })

  test('the new env var wins over the old one', () => {
    // node-config has already put TURN_CREDITS into the config; the old one must not override it
    const { config, warnings } = applyDeprecatedConfig({ ...defaults, turnCredits: 7 }, { TURN_CREDITS: '7', AUTONOMOUS_AGENT_RUN_CREDITS: '42' })
    assert.equal(config.turnCredits, 7)
    assert.deepEqual(warnings, [])
  })

  test('an old KEY from a config file is moved to the new one and removed, so the schema accepts it', () => {
    const { config, warnings } = applyDeprecatedConfig({ ...defaults, autonomousAgentRunTimeoutSeconds: 120 }, {})
    assert.equal(config.turnTimeoutSeconds, 120)
    assert.equal('autonomousAgentRunTimeoutSeconds' in config, false)
    assert.match(warnings[0], /autonomousAgentRunTimeoutSeconds is deprecated, use turnTimeoutSeconds/)
  })
})

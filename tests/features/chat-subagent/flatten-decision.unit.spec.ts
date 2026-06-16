/**
 * Stateless unit tests for the flatten-vs-delegate decision used by the experimental
 * "flatten sub-agents" mode.
 *
 * Rules under test (see ui/src/composables/sub-agent-flatten.ts):
 *   - toggle off  → never flatten
 *   - toggle on   → flatten by default, EXCEPT sub-agents that pin a non-default model
 *                   (which stay delegated), and `delegateOnly` overrides either way.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { shouldFlattenSubAgent } from '../../../ui/src/composables/sub-agent-flatten.ts'

test.describe('shouldFlattenSubAgent', () => {
  test('toggle off → never flattens, whatever the config', () => {
    assert.equal(shouldFlattenSubAgent({}, false), false)
    assert.equal(shouldFlattenSubAgent({ model: 'tools' }, false), false)
    assert.equal(shouldFlattenSubAgent({ model: 'summarizer' }, false), false)
    assert.equal(shouldFlattenSubAgent({ delegateOnly: false }, false), false)
  })

  test('toggle on, default model → flattens', () => {
    // lib-vue materializes the default to 'tools'
    assert.equal(shouldFlattenSubAgent({ model: 'tools' }, true), true)
    // a config missing model entirely is also treated as default
    assert.equal(shouldFlattenSubAgent({}, true), true)
  })

  test('toggle on, pinned non-default model → stays delegated', () => {
    assert.equal(shouldFlattenSubAgent({ model: 'summarizer' }, true), false)
    assert.equal(shouldFlattenSubAgent({ model: 'evaluator' }, true), false)
  })

  test('delegateOnly: true → stays delegated even with the default model', () => {
    assert.equal(shouldFlattenSubAgent({ model: 'tools', delegateOnly: true }, true), false)
    assert.equal(shouldFlattenSubAgent({ delegateOnly: true }, true), false)
  })

  test('delegateOnly: false → forces flattening even with a pinned model', () => {
    assert.equal(shouldFlattenSubAgent({ model: 'summarizer', delegateOnly: false }, true), true)
  })
})

/**
 * The barrel is what consumers import. A name dropped from it is a breaking
 * change no other test would catch, so it is asserted explicitly.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import * as pkg from '../../../lib-sim/index.ts'

test.describe('package barrel', () => {
  test('exports exactly the documented value surface', () => {
    // Types erase at runtime, so only VALUE exports appear here. Update this
    // list deliberately: an unlisted addition is an accidental public API, and
    // a disappearance is a breaking change for two other repositories.
    const expected: string[] = [
      'createNeutralCwd', 'scrubEnv', 'isolationOptions',
      'captureGateway', 'summariseRequest',
      'nextUserMessage', 'personaSystemPrompt', 'personaPrompt', 'isDone', 'DONE',
      'writeEvidence', 'evidenceDir',
      'selectCases',
      'reportCases',
      'sendMessage', 'waitForTurn', 'readConversation', 'TURN_TIMEOUT_MS'
    ]
    assert.deepEqual(Object.keys(pkg).sort(), expected.sort())
  })
})

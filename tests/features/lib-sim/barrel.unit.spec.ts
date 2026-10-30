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
      'parseConversationExport', 'recordedToolCalls', 'runErrors',
      'nextUserMessage', 'personaSystemPrompt', 'personaPrompt', 'isDone', 'DONE', 'NEW_CONVERSATION_ROLE',
      'PERSONA_MAX_TURNS', 'PERCEPTION_INSTRUCTIONS', 'DEFAULT_USER_MODEL', 'resolveUserModel',
      'writeEvidence', 'evidenceDir', 'exportFileName',
      'computeMetrics',
      'selectCases', 'simCaseNames',
      'reportCases', 'reportCli',
      'createChatDriver', 'chatDriverStrings', 'TURN_TIMEOUT_MS', 'SEND_TIMEOUT_MS', 'WAITING_SELECTOR', 'APPROVAL_SELECTOR',
      'createPagePerception', 'truncate', 'SNAPSHOT_CAP', 'ACTION_TIMEOUT_MS', 'PAGE_MCP_SERVER_NAME',
      'BRIDGE_URL', 'MODEL_ROLES', 'BACKGROUND_ROLES', 'REVIEW_CONSENT_COOKIE', 'REVIEW_CONSENT_YES', 'bridgeSettings', 'seedAgentsSettings', 'assertBridgeUp',
      'runSimulation', 'ensureChatOpen', 'CHAT_FRAME', 'TURN_CEILING_MS',
      'defineSimConfig'
    ]
    assert.deepEqual(Object.keys(pkg).sort(), expected.sort())
  })
})

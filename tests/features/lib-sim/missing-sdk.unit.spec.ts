/**
 * The Agent SDK and MCP SDK are optional peers (package.json). Both places
 * that load the SDK at runtime — df-agents-bridge and persona.ts's
 * nextUserMessage — must fail with an actionable message naming the install
 * command, not node's raw ERR_MODULE_NOT_FOUND. This is tested by asserting
 * the message constant directly, not by uninstalling the SDK.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { MISSING_SDK_MESSAGE, isMissingSdkError } from '../../../lib-sim/missing-sdk.ts'

test.describe('missing-sdk message', () => {
  test('names the install command for both optional peers', () => {
    assert.match(MISSING_SDK_MESSAGE, /npm i -D/)
    assert.match(MISSING_SDK_MESSAGE, /@anthropic-ai\/claude-agent-sdk/)
    assert.match(MISSING_SDK_MESSAGE, /@modelcontextprotocol\/sdk/)
  })

  test('isMissingSdkError recognizes a module-not-found for either optional peer', () => {
    assert.equal(isMissingSdkError({ code: 'ERR_MODULE_NOT_FOUND', message: "Cannot find package '@anthropic-ai/claude-agent-sdk' imported from bridge/server.ts" }), true)
    assert.equal(isMissingSdkError({ code: 'ERR_MODULE_NOT_FOUND', message: "Cannot find package '@modelcontextprotocol/sdk' imported from bridge/tool-server.ts" }), true)
  })

  test('isMissingSdkError ignores unrelated errors', () => {
    assert.equal(isMissingSdkError(new Error('boom')), false)
    assert.equal(isMissingSdkError({ code: 'ERR_MODULE_NOT_FOUND', message: "Cannot find package 'left-pad'" }), false)
    assert.equal(isMissingSdkError(null), false)
    assert.equal(isMissingSdkError('nope'), false)
  })
})

/**
 * Action buttons address the page's assistant, never a configured (autonomous) agent: only an
 * assistant works through the page's WebMCP tools that a button's hidden context names.
 *
 * The host embeds decide with lib-vue's copy of the assistants' ids, which a published package keeps
 * because it cannot import shared/; this spec is what keeps the copy equal to the source.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { chatTakesActions, ASSISTANT_AGENT_IDS } from '../../../lib-vue/agent-init-config.ts'
import { PERSONAL_AGENT_IDS, usesPageTools } from '../../../shared/agent-audit.ts'

test.describe('Which chats take action buttons', () => {
  test('lib-vue names the same assistants as shared', () => {
    assert.deepEqual([...ASSISTANT_AGENT_IDS].sort(), [...PERSONAL_AGENT_IDS].sort())
  })

  test('an assistant chat takes them, a configured agent\'s chat does not', () => {
    assert.equal(chatTakesActions(undefined), true)
    for (const id of PERSONAL_AGENT_IDS) assert.equal(chatTakesActions(id), usesPageTools(id))
    assert.equal(chatTakesActions('some-autonomous-agent'), false)
  })
})

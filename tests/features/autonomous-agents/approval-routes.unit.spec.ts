/**
 * stateless unit tests for the approval level of an autonomous agent: the policy each level gives each
 * class of tool, and what it does to the tool set the model is offered.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { tool, jsonSchema } from 'ai'
import { approvalPolicyFor, APPROVAL_LEVELS, DEFAULT_APPROVAL_LEVEL } from '../../../shared/approval-policy.ts'
import { applyApprovalPolicy, classifyTool, personalAssistantTools } from '../../../api/src/conversations/approval-policy.ts'

const t = () => tool({ description: 'x', inputSchema: jsonSchema({ type: 'object', properties: {} }), execute: async () => 'ok' })

test.describe('approvalPolicyFor', () => {
  test('the full table', () => {
    const row = (level?: Parameters<typeof approvalPolicyFor>[1]) => (['readOnly', 'write', 'destructive'] as const).map(cls => approvalPolicyFor(cls, level))
    assert.deepEqual(row('write'), ['allow', 'approve', 'approve'])
    assert.deepEqual(row('destructive'), ['allow', 'allow', 'approve'])
    assert.deepEqual(row('none'), ['allow', 'allow', 'allow'])
    assert.deepEqual(row(undefined), row('destructive'))
  })

  test('the levels and their default', () => {
    assert.deepEqual(APPROVAL_LEVELS, ['write', 'destructive', 'none'])
    assert.equal(DEFAULT_APPROVAL_LEVEL, 'destructive')
  })

  test('applyApprovalPolicy never removes a tool', () => {
    const tools = { read: { tool: t(), annotations: { readOnlyHint: true } }, plain: { tool: t() }, wipe: { tool: t(), annotations: { destructiveHint: true } } }
    const gated = applyApprovalPolicy(tools, 'write')
    assert.deepEqual(Object.keys(gated).sort(), ['plain', 'read', 'wipe'])
    assert.equal((gated.read.tool as any).needsApproval, undefined)
    assert.equal((gated.plain.tool as any).needsApproval, true)
    assert.equal((gated.wipe.tool as any).needsApproval, true)
  })
})

test.describe('classifyTool', () => {
  test('destructive wins, read-only is declared, everything else writes', () => {
    assert.equal(classifyTool({ destructiveHint: true }), 'destructive')
    assert.equal(classifyTool({ destructiveHint: true, readOnlyHint: true }), 'destructive')
    assert.equal(classifyTool({ readOnlyHint: true }), 'readOnly')
    assert.equal(classifyTool({ readOnlyHint: false }), 'write')
    // Most hand-written servers declare nothing: treating that as read-only would leave the common case ungated.
    assert.equal(classifyTool(undefined), 'write')
    assert.equal(classifyTool({}), 'write')
  })
})

test.describe('personalAssistantTools', () => {
  const tools = {
    read: { tool: t(), server: 's', annotations: { readOnlyHint: true } },
    write: { tool: t(), server: 's' },
    wipe: { tool: t(), server: 's', annotations: { destructiveHint: true } }
  }

  test('everything but a read waits for the person: the assistant acts for them, so they approve each change', () => {
    const gated = personalAssistantTools(tools, { anonymous: false })
    assert.deepEqual(Object.keys(gated), ['read', 'write', 'wipe'])
    assert.equal(gated.read.tool.needsApproval, undefined)
    assert.equal(gated.write.tool.needsApproval, true)
    assert.equal(gated.wipe.tool.needsApproval, true)
  })

  test('an anonymous visitor is offered reads only: nobody signed in can decide on a card', () => {
    assert.deepEqual(Object.keys(personalAssistantTools(tools, { anonymous: true })), ['read'])
  })
})

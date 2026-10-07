/**
 * stateless unit tests for the approval policy: which class a tool falls in, and what the policy does
 * to the tool set the model is offered.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { tool, jsonSchema } from 'ai'
import { classifyTool, resolveApproval, applyApprovalPolicy, DEFAULT_APPROVALS } from '../../../api/src/conversations/approval-policy.ts'

const t = () => tool({ description: 'x', inputSchema: jsonSchema({ type: 'object', properties: {} }), execute: async () => 'ok' })

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

test.describe('resolveApproval', () => {
  test('defaults gate destructive tools only', () => {
    assert.deepEqual(DEFAULT_APPROVALS, { readOnly: 'allow', write: 'allow', destructive: 'approve' })
    assert.equal(resolveApproval('destructive', undefined), 'approve')
    assert.equal(resolveApproval('write', undefined), 'allow')
  })

  test('an autonomous agent setting overrides one class and keeps the others\' defaults', () => {
    assert.equal(resolveApproval('write', { write: 'deny' }), 'deny')
    assert.equal(resolveApproval('destructive', { write: 'deny' }), 'approve')
    assert.equal(resolveApproval('destructive', { destructive: 'allow' }), 'allow')
  })
})

test.describe('applyApprovalPolicy', () => {
  const annotations = new Map<string, Record<string, unknown>>([
    ['wipe', { destructiveHint: true }],
    ['read', { readOnlyHint: true }]
  ])

  test('deny removes the tool, approve marks it, allow leaves it untouched', () => {
    const tools = { wipe: t(), read: t(), plain: t() }
    const gated = applyApprovalPolicy(tools, annotations, { write: 'deny' })
    assert.deepEqual(Object.keys(gated).sort(), ['read', 'wipe'])
    assert.equal((gated.wipe as any).needsApproval, true)
    assert.equal(gated.read, tools.read, 'an allowed tool is passed through as is')
  })

  test('the defaults leave a write tool alone and gate a destructive one', () => {
    const gated = applyApprovalPolicy({ wipe: t(), plain: t() }, annotations, undefined)
    assert.equal((gated.wipe as any).needsApproval, true)
    assert.equal((gated.plain as any).needsApproval, undefined)
  })
})

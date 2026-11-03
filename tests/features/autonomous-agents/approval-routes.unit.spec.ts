/**
 * stateless unit tests for the approval routes of an autonomous agent: the route each class of tool takes,
 * and what it does to the tool set the model is offered.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { tool, jsonSchema } from 'ai'
import { routeFor, DEFAULT_APPROVAL_ROUTES } from '../../../shared/approval-policy.ts'
import { applyApprovalPolicy, classifyTool, personalAssistantTools, unattended } from '../../../api/src/conversations/approval-policy.ts'

const t = () => tool({ description: 'x', inputSchema: jsonSchema({ type: 'object', properties: {} }), execute: async () => 'ok' })

test.describe('routeFor', () => {
  test('a read takes no route; writes and destructive calls take theirs, defaults included', () => {
    assert.equal(routeFor('readOnly'), undefined)
    assert.equal(routeFor('write'), 'reviewer')
    assert.equal(routeFor('destructive'), 'reviewer+person')
    assert.equal(routeFor('readOnly', { write: 'reviewer+person', destructive: 'reviewer+person' }), undefined)
    assert.equal(routeFor('write', { write: 'reviewer+person' }), 'reviewer+person')
    assert.equal(routeFor('destructive', { write: 'reviewer+person' }), 'reviewer+person')
    assert.equal(routeFor('destructive', { destructive: 'reviewer' }), 'reviewer')
  })

  test('the defaults', () => {
    assert.deepEqual(DEFAULT_APPROVAL_ROUTES, { write: 'reviewer', destructive: 'reviewer+person' })
  })

  test('applyApprovalPolicy marks every non-read for review, and asks a person only on reviewer+person', () => {
    const tools = { read: { tool: t(), annotations: { readOnlyHint: true } }, plain: { tool: t() }, wipe: { tool: t(), annotations: { destructiveHint: true } } }
    const gated = applyApprovalPolicy(tools)
    assert.deepEqual(Object.keys(gated).sort(), ['plain', 'read', 'wipe'])
    assert.equal(gated.read.review, undefined)
    assert.equal((gated.read.tool as any).needsApproval, undefined)
    assert.deepEqual(gated.plain.review, { route: 'reviewer', cls: 'write', kind: 'action' })
    assert.equal((gated.plain.tool as any).needsApproval, undefined)
    assert.deepEqual(gated.wipe.review, { route: 'reviewer+person', cls: 'destructive', kind: 'action' })
    assert.equal((gated.wipe.tool as any).needsApproval, true)
    // Unattended runs keep the reviewer-routed classes and drop those needing a person.
    assert.deepEqual(Object.keys(unattended(gated)).sort(), ['plain', 'read'])

    const allPerson = applyApprovalPolicy(tools, { write: 'reviewer+person' })
    assert.equal((allPerson.plain.tool as any).needsApproval, true)
    const allReviewer = applyApprovalPolicy(tools, { destructive: 'reviewer' })
    assert.equal((allReviewer.wipe.tool as any).needsApproval, undefined)
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

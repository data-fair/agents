/**
 * stateless unit tests: what is different about an unattended turn — the tools it is offered and the
 * note its system prompt carries.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { tool, jsonSchema } from 'ai'
import { applyApprovalPolicy, unattended } from '../../../api/src/conversations/approval-policy.ts'
import { buildSystemPrompt, turnDeadlineSeconds } from '../../../api/src/conversations/operations.ts'
import { renderMemoryBlock } from '../../../api/src/memory/operations.ts'
import { validateTaskOutcome } from '../../../api/src/tasks/operations.ts'

const t = () => tool({ description: 'x', inputSchema: jsonSchema({ type: 'object', properties: {} }), execute: async () => 'ok' })

test.describe('unattended', () => {
  const tools = { read: { tool: t(), annotations: { readOnlyHint: true } }, write: { tool: t() }, wipe: { tool: t(), annotations: { destructiveHint: true } } }
  // What a task run is offered: the policy applied, as in a chat, then everything left needing approval dropped.
  const withoutGatedTools = (set: typeof tools, level?: Parameters<typeof applyApprovalPolicy>[1]) => unattended(applyApprovalPolicy(set, level))

  test('under the default approval level, a destructive tool is dropped and the others kept as they are', () => {
    const offered = withoutGatedTools(tools)
    assert.deepEqual(Object.keys(offered).sort(), ['read', 'write'])
    assert.equal(offered.read, tools.read)
    // Nothing is offered with `needsApproval`: nobody is there to decide.
    assert.ok(Object.values(offered).every(offeredTool => !(offeredTool.tool as any).needsApproval))
  })

  test('level none keeps every tool', () => {
    assert.deepEqual(Object.keys(withoutGatedTools(tools, 'none')).sort(), ['read', 'wipe', 'write'])
  })

  test('an unannotated tool is a write: dropped when writes need approval', () => {
    // `write` carries no annotation at all, which is most hand-written servers' case.
    assert.deepEqual(Object.keys(withoutGatedTools(tools, 'write')).sort(), ['read'])
  })

  test('a tool that gates itself is dropped too: a service tool\'s own needsApproval', () => {
    const asking = { request_web_access: { tool: { ...t(), needsApproval: true } as any }, read: tools.read }
    assert.deepEqual(Object.keys(unattended(asking)), ['read'])
  })
})

test.describe('validateTaskOutcome', () => {
  test('a valid outcome is kept, its summary trimmed', () => {
    assert.deepEqual(validateTaskOutcome({ status: 'needs-attention', summary: '  look  ' }), { status: 'needs-attention', summary: 'look' })
  })

  test('a bad status is refused with the allowed values', () => {
    assert.throws(() => validateTaskOutcome({ status: 'great', summary: 'x' }), /status must be one of done, nothing-to-do, needs-attention/)
    assert.throws(() => validateTaskOutcome(undefined), /status must be one of/)
  })

  test('an over-long or empty summary is refused', () => {
    assert.throws(() => validateTaskOutcome({ status: 'done', summary: 'x'.repeat(10_001) }), /at most 10000 characters/)
    assert.doesNotThrow(() => validateTaskOutcome({ status: 'done', summary: `${'x'.repeat(10_000)}   ` }))
    assert.throws(() => validateTaskOutcome({ status: 'done', summary: '   ' }), /non-empty string/)
    assert.throws(() => validateTaskOutcome({ status: 'done', summary: 42 }), /non-empty string/)
  })
})

test.describe('buildSystemPrompt on the task surface', () => {
  const agent = { title: 'Tasker', persona: 'You answer briefly.', nhi: { clientId: 'c1' } }

  test('a task run is told it is unattended, before the memory block', () => {
    const prompt = buildSystemPrompt(agent, [], 'task')
    const note = prompt.indexOf('This is a scheduled execution of one of your planned tasks.')
    assert.ok(note > 0)
    assert.match(prompt, /end by calling report_outcome/)
    assert.ok(note < prompt.indexOf(renderMemoryBlock([])))
    assert.match(buildSystemPrompt(agent, undefined, 'task'), /scheduled execution/)
  })

  test('a chat turn carries no such note', () => {
    assert.doesNotMatch(buildSystemPrompt(agent), /scheduled execution/)
    assert.doesNotMatch(buildSystemPrompt(agent, [], 'chat'), /scheduled execution/)
  })
})

test.describe('turnDeadlineSeconds', () => {
  test('a task run has its own, longer deadline; a chat turn keeps the turn deadline', () => {
    const limits = { turnTimeoutSeconds: 300, taskTimeoutSeconds: 1800 }
    assert.equal(turnDeadlineSeconds({ kind: 'task' }, limits), 1800)
    assert.equal(turnDeadlineSeconds({ kind: 'conversation' }, limits), 300)
    assert.equal(turnDeadlineSeconds({}, limits), 300)
  })
})

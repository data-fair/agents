import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { activityLabelKey } from '@agents/shared/agent-activity'

test.describe('activityLabelKey', () => {
  test('null / undefined → null', () => {
    assert.equal(activityLabelKey(null), null)
    assert.equal(activityLabelKey(undefined), null)
  })

  test('top-level phases map to their keys', () => {
    assert.deepEqual(activityLabelKey({ kind: 'compacting' }), { key: 'activityCompacting' })
    assert.deepEqual(activityLabelKey({ kind: 'thinking' }), { key: 'activityThinking' })
    assert.deepEqual(activityLabelKey({ kind: 'analyzing' }), { key: 'activityAnalyzing' })
  })

  test('a running call carries its tool name, for the chat to title as its chip', () => {
    assert.deepEqual(activityLabelKey({ kind: 'tool', toolName: 'read_skill' }), { key: 'activityTool', name: 'read_skill' })
  })
})

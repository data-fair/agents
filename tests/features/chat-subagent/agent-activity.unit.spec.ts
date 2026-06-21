import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { activityLabelKey, type ChatActivity } from '../../../ui/src/composables/agent-activity.ts'

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

  test('analyzing with a sub-agent carries the name for the bottom line', () => {
    assert.deepEqual(
      activityLabelKey({ kind: 'analyzing', subAgent: 'subagent_explorer' }),
      { key: 'activityAnalyzingSubAgent', name: 'subagent_explorer' }
    )
  })

  test('sub-agent phases map to name-less in-panel keys', () => {
    const cases: [ChatActivity, string][] = [
      [{ kind: 'subagent', name: 'subagent_x', phase: 'starting' }, 'activitySubAgentStarting'],
      [{ kind: 'subagent', name: 'subagent_x', phase: 'thinking' }, 'activitySubAgentThinking'],
      [{ kind: 'subagent', name: 'subagent_x', phase: 'tool' }, 'activitySubAgentTool'],
      [{ kind: 'subagent', name: 'subagent_x', phase: 'analyzing' }, 'activitySubAgentAnalyzing']
    ]
    for (const [activity, key] of cases) assert.deepEqual(activityLabelKey(activity), { key })
  })
})

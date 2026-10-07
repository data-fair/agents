/**
 * stateless unit tests: the notification a task run pushes to the events service, by kind.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { taskEvent, failedInARow } from '../../../api/src/tasks/operations.ts'

const task = { id: 'task-1', title: 'Weekly check', owner: { type: 'organization' as const, id: 'test1', name: 'Test 1' } }
const run = { id: 'run-1', status: 'error' as const, error: 'mock stream error', outcome: { status: 'needs-attention' as const, summary: 'two datasets are stale' } }

test.describe('taskEvent', () => {
  for (const kind of ['failed', 'needs-attention', 'paused'] as const) {
    test(`a ${kind} event is private, sent by the owner, about the task`, () => {
      const event = taskEvent(kind, task, run)
      assert.equal(event.topic.key, `agents:task-${kind}:task-1`)
      assert.deepEqual(event.sender, task.owner)
      assert.equal(event.visibility, 'private')
      assert.deepEqual(event.resource, { type: 'autonomous-agent-task', id: 'task-1', title: 'Weekly check' })
      assert.deepEqual(event.originator, { internalProcess: { id: 'agents-scheduler', name: 'Agents scheduler' } })
      assert.match(String(event.title), /Weekly check/)
    })
  }

  test('titles are in French, like processings\' notifications', () => {
    assert.equal(taskEvent('failed', task, run).title, 'La tâche planifiée « Weekly check » a échoué.')
    assert.equal(taskEvent('needs-attention', task, run).title, 'La tâche planifiée « Weekly check » demande votre attention : two datasets are stale')
    assert.equal(taskEvent('paused', task, run, { failures: 5 }).title, 'La tâche planifiée « Weekly check » a été mise en pause après 5 exécutions en échec consécutives.')
  })

  test('a long summary is truncated in the title, and kept whole in the body', () => {
    const long = { ...run, outcome: { status: 'needs-attention' as const, summary: 'x'.repeat(1000) } }
    const event = taskEvent('needs-attention', task, long)
    assert.ok(String(event.title).length < 250)
    assert.match(String(event.title), /…$/)
    assert.equal(event.body, 'x'.repeat(1000))
  })

  test('a needs-attention body carries the outcome summary', () => {
    assert.match(String(taskEvent('needs-attention', task, run).body), /two datasets are stale/)
  })

  test('a failed or paused body says what failed last', () => {
    assert.match(String(taskEvent('failed', task, run).body), /mock stream error/)
    assert.match(String(taskEvent('paused', task, run, { failures: 5 }).body), /mock stream error/)
  })
})

test.describe('failedInARow', () => {
  test('only max failures in a row count, newest first, errors and interruptions alike', () => {
    assert.equal(failedInARow(['error', 'interrupted', 'error'], 3), true)
    assert.equal(failedInARow(['error', 'error'], 3), false)
    assert.equal(failedInARow(['error', 'done', 'error'], 3), false)
    // An abort is an admin's act, not a failure: it breaks the streak.
    assert.equal(failedInARow(['error', 'aborted', 'error'], 3), false)
    assert.equal(failedInARow(['error', 'error', 'error', 'done'], 3), true)
  })
})

/**
 * stateless unit tests for the 0.12.0 removal of the evaluator model role.
 *
 * The half worth pinning is the one that LOSES DATA: an entry flagged only `usage: ['evaluator']`
 * cannot keep an empty array (the schema's `minItems: 1`), so it is dropped — and a drop that takes
 * one entry too many silently un-maps a role the deployment still uses. The decision is a pure
 * function for exactly that reason; the two mongo writes around it are selected by filters that
 * match nothing on a second run, which is what makes the script idempotent.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { stripEvaluatorUsage } from '../../../upgrade/0.12.0/remove-evaluator-role.js'

const entry = (id: string, usage: string[]) => ({
  model: { id, name: id, provider: { type: 'openai', name: 'OpenAI', id: 'p1' } },
  usage,
  inputPricePerMillion: 1,
  outputPricePerMillion: 2
})

test.describe('stripEvaluatorUsage', () => {
  test('pulls the role from an entry that has other usages, keeping everything else', () => {
    const models = [entry('gpt-x', ['assistant', 'evaluator', 'tools'])]
    const next = stripEvaluatorUsage(models)
    assert.ok(next)
    assert.equal(next.length, 1)
    assert.deepEqual(next[0].usage, ['assistant', 'tools'])
    assert.equal(next[0].inputPricePerMillion, 1, 'prices survive')
    assert.equal(next[0].model.id, 'gpt-x')
  })

  test('drops an entry whose ONLY usage was evaluator', () => {
    // It cannot stay: `usage` has minItems 1, so an emptied entry would make the org form
    // unsavable. This is the data loss the migration accepts, and it is bounded to that entry.
    const next = stripEvaluatorUsage([entry('judge', ['evaluator']), entry('gpt-x', ['assistant'])])
    assert.ok(next)
    assert.deepEqual(next.map(m => m.model.id), ['gpt-x'])
  })

  test('leaves every other entry untouched', () => {
    const keep = entry('gpt-x', ['assistant'])
    const next = stripEvaluatorUsage([keep, entry('judge', ['evaluator'])])
    assert.ok(next)
    assert.deepEqual(next[0], keep, 'the surviving entry is not rewritten at all')
  })

  test('returns null when no entry carries the role, so the write is skipped', () => {
    // Also what makes a second run a no-op on a document the first run already rewrote.
    assert.equal(stripEvaluatorUsage([entry('gpt-x', ['assistant', 'tools'])]), null)
    assert.equal(stripEvaluatorUsage([]), null)
  })

  test('is defensive about a document that is not in the expected shape', () => {
    // Stored documents predate several schema generations; a crash here fails the whole deploy.
    assert.equal(stripEvaluatorUsage(undefined as any), null)
    assert.equal(stripEvaluatorUsage({} as any), null)
    assert.equal(stripEvaluatorUsage([{ model: { id: 'x' } } as any]), null, 'an entry with no usage array')
  })
})

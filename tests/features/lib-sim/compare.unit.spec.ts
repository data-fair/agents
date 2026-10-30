/**
 * Comparing archived rounds: one condition per label, its runs read from one or more evidence dirs.
 * An invalid or unjudged run is counted apart, never averaged in, and a verdict written before the judge
 * had a brevity block counts for satisfaction only.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { summarizeCondition } from '../../../lib-sim/compare.ts'

const write = (dir: string, name: string, run: Record<string, unknown>, verdict?: Record<string, unknown>) => {
  fs.writeFileSync(path.join(dir, `sim-${name}.run.json`), JSON.stringify({ case: name, assistantModel: 'sonnet', userModel: 'sonnet', turns: 2, durationMs: 1, finishedAt: '', ...run }))
  if (verdict) fs.writeFileSync(path.join(dir, `sim-${name}.verdict.json`), JSON.stringify({ case: name, summary: 's', frictions: [], ...verdict }))
}
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'sim-compare-'))
const metrics = { userMessages: 2, finalReplyWords: 10, interimProseBubbles: 1, visibleWordsPerUserMessage: 12 }

test.describe('summarizeCondition', () => {
  test('averages judged runs and counts the rest apart', () => {
    const dir = tmp()
    write(dir, 'a', { valid: true, metrics }, {
      satisfied: true,
      brevity: { substanceKept: true, missing: [], padding: [{ turn: 1, kind: 'narration', quote: 'q' }, { turn: 2, kind: 'closing-recap', quote: 'q' }], rating: 'padded' }
    })
    write(dir, 'b', { valid: false, error: 'timeout' })
    const s = summarizeCondition('current', [dir])
    assert.equal(s.judged, 1)
    assert.equal(s.invalidOrUnjudged, 1)
    assert.equal(s.paddingPerUserMessage, 1)
    assert.equal(s.ratings.padded, 1)
    assert.equal(s.finalReplyWords, 10)
  })

  test('counts an old verdict for satisfaction, not for brevity', () => {
    const dir = tmp()
    write(dir, 'a', { valid: true, metrics }, { satisfied: true })
    const s = summarizeCondition('old', [dir])
    assert.equal(s.satisfiedRate, 1)
    assert.equal(s.substanceKeptRate, null)
    assert.equal(s.paddingPerUserMessage, null)
  })
})

/**
 * The report prints what the judge said about brevity, and still reads verdicts written before the
 * judge had a brevity block (data-fair's archived runs).
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { reportCases } from '../../../lib-sim/report.ts'
import type { SimulationCase } from '../../../lib-sim/types.ts'

const CASE: SimulationCase = { name: 'case-a', route: '/x', persona: 'p', goal: 'g', maxTurns: 2 }

const evidence = (verdict: Record<string, unknown>) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sim-report-'))
  fs.writeFileSync(path.join(dir, 'sim-case-a.run.json'), JSON.stringify({ case: 'case-a', valid: true, assistantModel: 'sonnet', userModel: 'sonnet', turns: 2, durationMs: 1000, finishedAt: '' }))
  fs.writeFileSync(path.join(dir, 'sim-case-a.verdict.json'), JSON.stringify({ case: 'case-a', satisfied: true, summary: 'ok', frictions: [], ...verdict }))
  return dir
}

const printed = (dir: string) => {
  const lines: string[] = []
  const log = console.log
  console.log = (...args: unknown[]) => { lines.push(args.join(' ')) }
  try {
    return { failures: reportCases([CASE], dir), output: lines.join('\n') }
  } finally { console.log = log }
}

test.describe('reportCases', () => {
  test('prints the brevity line', () => {
    const { output } = printed(evidence({
      brevity: { substanceKept: false, missing: ['dates'], padding: [{ turn: 1, kind: 'narration', quote: 'I called…' }], rating: 'padded' }
    }))
    assert.match(output, /brevity: padded, substance MISSING \(dates\), 1 padding \(narration 1\)/)
  })

  test('still reports a verdict written without a brevity block', () => {
    const { failures, output } = printed(evidence({}))
    assert.equal(failures, 0)
    assert.doesNotMatch(output, /brevity:/)
  })
})

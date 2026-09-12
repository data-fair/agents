/**
 * Reads the evidence and says what happened. Exit code is non-zero if any case
 * was unsatisfactory, invalid, not judged, or never ran — a suite that cannot
 * fail is not a suite.
 */
import fs from 'node:fs'
import path from 'node:path'
import { findCases } from './cases/index.ts'
import { evidenceDir } from './runner/transcript.ts'

const selected = findCases(process.argv.slice(2))

const read = (file: string) => {
  try { return JSON.parse(fs.readFileSync(path.join(evidenceDir, file), 'utf8')) } catch { return null }
}

let failures = 0
const rows: string[][] = [['case', 'model', 'turns', 'verdict', 'frictions', 'duration']]

for (const c of selected) {
  const run = read(`sim-${c.name}.run.json`)
  const verdict = read(`sim-${c.name}.verdict.json`)
  let state: string
  let frictions = '-'

  if (!run) { state = 'not run'; failures++ } else if (!run.valid) { state = `invalid (${run.error ?? 'unknown'})`; failures++ } else if (!verdict || verdict.case !== c.name) { state = 'not judged'; failures++ } else {
    state = verdict.satisfied ? 'satisfied' : 'UNSATISFACTORY'
    if (!verdict.satisfied) failures++
    frictions = String(verdict.frictions?.length ?? 0)
  }

  rows.push([
    c.name,
    run?.assistantModel ?? '-',
    String(run?.turns ?? '-'),
    state,
    frictions,
    run ? `${Math.round(run.durationMs / 1000)}s` : '-'
  ])
}

const widths = rows[0].map((_, i) => Math.max(...rows.map(r => r[i].length)))
for (const row of rows) console.log(row.map((cell, i) => cell.padEnd(widths[i])).join('  '))

for (const c of selected) {
  const verdict = read(`sim-${c.name}.verdict.json`)
  if (!verdict?.frictions?.length) continue
  console.log(`\n${c.name}: ${verdict.summary}`)
  for (const f of verdict.frictions) console.log(`  - turn ${f.turn}: ${f.what} → ${f.effect}`)
}

console.log(failures === 0 ? '\nall cases satisfied' : `\n${failures} case(s) need attention`)
process.exit(failures === 0 ? 0 : 1)

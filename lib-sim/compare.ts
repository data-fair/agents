/**
 * Compares rounds of runs archived side by side (`simulations/tmp/<label>/`), one row per condition.
 *
 * A comparison, not a score: nothing here passes or fails. It exists because a prompt change is judged by
 * running the same cases before and after, more than once, and adding up verdicts by hand across a dozen
 * files is where such comparisons go wrong. Compare conditions only when the judge text, the
 * `assistantModel` and the `personaVariant` are what you mean them to be: the table prints them.
 */
import fs from 'node:fs'
import path from 'node:path'
import type { RunSidecar } from './types.ts'
import { isValidVerdict, type Verdict } from './report.ts'

type Rating = 'tight' | 'acceptable' | 'padded'

export type ConditionSummary = {
  label: string
  dirs: number
  judged: number
  /** Runs that were invalid, or valid but without a well-formed verdict: counted, never averaged in. */
  invalidOrUnjudged: number
  satisfiedRate: number | null
  /** Over the judged runs that HAVE a brevity block; null when none has (verdicts from an older judge). */
  substanceKeptRate: number | null
  ratings: Record<Rating, number>
  paddingPerUserMessage: number | null
  finalReplyWords: number | null
  interimProseBubbles: number | null
  visibleWordsPerUserMessage: number | null
  /** What the runs ran on, so two rows on different models or variants are not compared silently. */
  ranOn: string[]
}

type JudgedRun = { name: string, run: RunSidecar, verdict: Verdict }

const twoDecimals = (n: number): number => Math.round(n * 100) / 100
const mean = (values: number[]): number | null => values.length ? twoDecimals(values.reduce((a, b) => a + b, 0) / values.length) : null
const readJson = (file: string): any => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) } catch { return null }
}

function readDir (dir: string): { judged: JudgedRun[], rest: number } {
  const judged: JudgedRun[] = []
  let rest = 0
  for (const file of fs.readdirSync(dir).filter(f => /^sim-.*\.run\.json$/.test(f))) {
    const run = readJson(path.join(dir, file)) as RunSidecar | null
    const name = file.slice('sim-'.length, -'.run.json'.length)
    const verdict = readJson(path.join(dir, `sim-${name}.verdict.json`))
    if (run?.valid && isValidVerdict(verdict, name)) judged.push({ name, run, verdict })
    else rest++
  }
  return { judged, rest }
}

export function summarizeCondition (label: string, dirs: string[]): ConditionSummary {
  const read = dirs.map(readDir)
  const judged = read.flatMap(r => r.judged)
  const withBrevity = judged.filter(j => j.verdict.brevity)
  const metric = (key: 'finalReplyWords' | 'interimProseBubbles' | 'visibleWordsPerUserMessage') =>
    mean(judged.map(j => j.run.metrics?.[key]).filter((v): v is number => typeof v === 'number'))
  const ratings: Record<Rating, number> = { tight: 0, acceptable: 0, padded: 0 }
  for (const j of withBrevity) ratings[j.verdict.brevity!.rating]++
  return {
    label,
    dirs: dirs.length,
    judged: judged.length,
    invalidOrUnjudged: read.reduce((sum, r) => sum + r.rest, 0),
    satisfiedRate: mean(judged.map(j => j.verdict.satisfied ? 1 : 0)),
    substanceKeptRate: mean(withBrevity.map(j => j.verdict.brevity!.substanceKept ? 1 : 0)),
    ratings,
    paddingPerUserMessage: mean(withBrevity
      .filter(j => j.run.metrics?.userMessages)
      .map(j => j.verdict.brevity!.padding.length / j.run.metrics!.userMessages)),
    finalReplyWords: metric('finalReplyWords'),
    interimProseBubbles: metric('interimProseBubbles'),
    visibleWordsPerUserMessage: metric('visibleWordsPerUserMessage'),
    ranOn: [...new Set(judged.map(j => [j.run.assistantModel, j.run.personaVariant].filter(Boolean).join('/')))]
  }
}

const cell = (v: number | null): string => v === null ? '-' : String(v)

function printTable (rows: string[][]) {
  const widths = rows[0].map((_, i) => Math.max(...rows.map(r => r[i].length)))
  for (const row of rows) console.log(row.map((c, i) => c.padEnd(widths[i])).join('  '))
}

/**
 * `simulate:compare label=dirA,dirB label2=dirC …`: one row per condition, then each case under each
 * condition (its rating, whether substance was kept, its final reply length), runs of a case joined by `/`.
 */
export function compareCli (argv = process.argv.slice(2)) {
  const conditions = argv.map(arg => {
    const [label, dirs] = arg.split('=')
    if (!label || !dirs) throw new Error(`expected label=dir[,dir…], got: ${arg}`)
    return { label, dirs: dirs.split(',').filter(Boolean) }
  })
  if (!conditions.length) throw new Error('usage: simulate:compare label=dir[,dir…] [label=dir…]')

  const summaries = conditions.map(c => summarizeCondition(c.label, c.dirs))
  printTable([
    ['condition', 'ran on', 'judged', 'invalid', 'satisfied', 'substance kept', 'tight/acc/padded', 'padding/msg', 'final words', 'interim notes', 'words/msg'],
    ...summaries.map(s => [
      s.label, s.ranOn.join(',') || '-', String(s.judged), String(s.invalidOrUnjudged), cell(s.satisfiedRate), cell(s.substanceKeptRate),
      `${s.ratings.tight}/${s.ratings.acceptable}/${s.ratings.padded}`, cell(s.paddingPerUserMessage), cell(s.finalReplyWords),
      cell(s.interimProseBubbles), cell(s.visibleWordsPerUserMessage)
    ])
  ])

  const perCase = new Map<string, Map<string, string[]>>()
  for (const c of conditions) {
    for (const { name, run, verdict } of c.dirs.flatMap(dir => readDir(dir).judged)) {
      const b = verdict.brevity
      const entry = `${b ? `${b.rating}${b.substanceKept ? '' : '!'}` : '?'} ${run.metrics?.finalReplyWords ?? '-'}w`
      if (!perCase.has(name)) perCase.set(name, new Map())
      perCase.get(name)!.set(c.label, [...(perCase.get(name)!.get(c.label) ?? []), entry])
    }
  }
  console.log('\nper case (rating, ! = substance missing, final reply words):')
  printTable([
    ['case', ...conditions.map(c => c.label)],
    ...[...perCase.entries()].map(([name, byLabel]) => [name, ...conditions.map(c => (byLabel.get(c.label) ?? ['-']).join(' / '))])
  ])
}

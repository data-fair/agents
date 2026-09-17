/**
 * Reads the evidence and says what happened. Returns the failure count so the
 * caller sets the exit code — a suite that cannot fail is not a suite.
 */
import fs from 'node:fs'
import path from 'node:path'
import type { SimulationCase, RunSidecar } from './types.ts'

type Verdict = {
  case: string
  satisfied: boolean
  summary: string
  frictions: Array<{ turn: number, what: string, effect: string }>
  findings?: Array<{ area: string, severity: string, what: string, evidence: string }>
}

/**
 * The counted facts, printed as facts. No threshold turns any of these into a
 * failure: what they cost is a judgement, and the judge makes it with the
 * transcript in hand.
 */
function metricsLine (run: RunSidecar | null): string {
  const m = run?.metrics
  if (!m) return ''
  const parts = [
    run?.toolsModel ? `[${run.assistantModel} / tools ${run.toolsModel}]` : '',
    `${m.modelRequests} model requests for ${m.userMessages} user messages`,
    m.requestsPerUserMessage === null ? '' : `(${m.requestsPerUserMessage}/message)`,
    m.requestsByModel
      ? `(${Object.entries(m.requestsByModel).map(([role, n]) => `${role} ${n}`).join(', ')})`
      : (m.nonLeadRequests ? `· ${m.nonLeadRequests} non-lead` : ''),
    m.largestNonLeadPromptChars
      ? `· largest ${m.largestNonLeadPromptModel ?? 'non-lead'} prompt ${m.largestNonLeadPromptChars} chars`
      : '',
    `· ${m.textlessAssistantBubbles}/${m.assistantBubbles} bubbles tool-chips only`,
    m.avgVisibleReplyChars === null ? '' : `· avg reply ${m.avgVisibleReplyChars} chars`,
    m.duplicateToolCalls ? `· ${m.duplicateToolCalls} repeated tool calls` : '',
    m.hostBlockChars === null ? '' : `· ${m.hostBlockChars} chars of host blocks`
  ]
  return parts.filter(Boolean).join(' ')
}

// The verdict is written by a model and is untrusted by construction — a
// well-known slip is a stringified boolean ("false" instead of false), which
// would otherwise pass truthiness checks and silently report success.
function isValidVerdict (v: unknown, caseName: string): v is Verdict {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return o.case === caseName &&
    typeof o.satisfied === 'boolean' &&
    Array.isArray(o.frictions) &&
    typeof o.summary === 'string'
}

export function reportCases (cases: SimulationCase[], evidenceDir: string): number {
  const read = (file: string) => {
    try { return JSON.parse(fs.readFileSync(path.join(evidenceDir, file), 'utf8')) } catch { return null }
  }
  let failures = 0
  const rows: string[][] = [['case', 'model', 'turns', 'verdict', 'frictions', 'duration']]

  for (const c of cases) {
    const run = read(`sim-${c.name}.run.json`)
    const verdict = read(`sim-${c.name}.verdict.json`)
    let state: string
    let frictions = '-'
    if (!run) { state = 'not run'; failures++ } else if (!run.valid) { state = `invalid (${run.error ?? 'unknown'})`; failures++ } else if (!isValidVerdict(verdict, c.name)) { state = 'not judged'; failures++ } else {
      state = verdict.satisfied === true ? 'satisfied' : 'UNSATISFACTORY'
      if (verdict.satisfied !== true) failures++
      frictions = String(verdict.frictions.length)
    }
    rows.push([c.name, run?.assistantModel ?? '-', String(run?.turns ?? '-'), state, frictions, run ? `${Math.round(run.durationMs / 1000)}s` : '-'])
  }

  const widths = rows[0].map((_, i) => Math.max(...rows.map(r => r[i].length)))
  for (const row of rows) console.log(row.map((cell, i) => cell.padEnd(widths[i])).join('  '))

  for (const c of cases) {
    const run = read(`sim-${c.name}.run.json`)
    const verdict = read(`sim-${c.name}.verdict.json`)
    const line = metricsLine(run)
    const hasDetail = isValidVerdict(verdict, c.name) && (verdict.frictions.length > 0 || (verdict.findings?.length ?? 0) > 0)
    if (!line && !hasDetail) continue
    console.log(`\n${c.name}${isValidVerdict(verdict, c.name) ? `: ${verdict.summary}` : ''}`)
    if (line) console.log(`  ${line}`)
    if (!isValidVerdict(verdict, c.name)) continue
    for (const f of verdict.frictions) console.log(`  - turn ${f.turn}: ${f.what} → ${f.effect}`)
    for (const f of verdict.findings ?? []) console.log(`  · [${f.severity}] ${f.area}: ${f.what} (${f.evidence})`)
  }

  console.log(failures === 0 ? '\nall cases satisfied' : `\n${failures} case(s) need attention`)
  return failures
}

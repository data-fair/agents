/**
 * Guard classifier eval: runs the labelled cases of corpus.ts through the two guards' REAL two-stage calls
 * (api/src/tripwire/classifier.ts, api/src/moderation/classifier.ts, the shared engine in api/src/guard) against
 * one model, and reports misses, false alarms, how often stage 2 was needed, failures and latency.
 *
 * What it is for: a guard's policy prompt is tuned against a model, and a prompt that reads well can still flag
 * half of a business corpus on another one. Re-run it on every model a deployment puts on the `moderator` role,
 * and after any change to either policy (docs/architecture/moderation.md, "Measuring the guards").
 *
 *   node dev/guard-eval/index.ts                       # the dev bridge (BRIDGE_PORT in .env), model haiku
 *   GUARD_EVAL_MODEL=sonnet node dev/guard-eval/index.ts
 *   GUARD_EVAL_BASE_URL=https://… GUARD_EVAL_API_KEY=… GUARD_EVAL_MODEL=glm-5.3-flash-greenpt node dev/guard-eval/index.ts
 *
 * Other knobs: GUARD_EVAL_GUARDS=tripwire|moderation (default both), GUARD_EVAL_REPEAT (default 1: runs of every
 * case, to see unstable verdicts), GUARD_EVAL_CONCURRENCY (default 4), GUARD_EVAL_CASES (comma-separated ids),
 * GUARD_EVAL_OUT (a JSON file for the raw results). Exit code 1 when any case was misjudged.
 */
import { writeFileSync } from 'node:fs'
import type { LanguageModel, LanguageModelUsage } from 'ai'
import type { Provider } from '#types'
import { createModel } from '../../api/src/models/operations.ts'
import { classifyTwoStage, describeFailedStage, newNonce, type TwoStageOutcome } from '../../api/src/guard/service.ts'
import { tripwireStage1, tripwireStage2 } from '../../api/src/tripwire/classifier.ts'
import { TRIPWIRE_HARD_TIMEOUT_MS, type TripwireVerdict } from '../../api/src/tripwire/operations.ts'
import { moderationStages } from '../../api/src/moderation/classifier.ts'
import { MODERATION_HARD_TIMEOUT_MS, truncateForModeration, type ModerationVerdict } from '../../api/src/moderation/operations.ts'
import { TRIPWIRE_CASES, MODERATION_CASES } from './corpus.ts'

const env = process.env
const baseURL = env.GUARD_EVAL_BASE_URL ?? `http://localhost:${env.BRIDGE_PORT ?? 3194}/v1`
const modelId = env.GUARD_EVAL_MODEL ?? 'haiku'
const repeat = Number(env.GUARD_EVAL_REPEAT ?? 1)
const concurrency = Number(env.GUARD_EVAL_CONCURRENCY ?? 4)
const guards = (env.GUARD_EVAL_GUARDS ?? 'tripwire,moderation').split(',')
const only = env.GUARD_EVAL_CASES ? new Set(env.GUARD_EVAL_CASES.split(',')) : undefined

const provider = { type: 'openai-compatible', id: 'guard-eval', name: 'guard eval', baseURL, compatibility: 'compatible', apiKey: env.GUARD_EVAL_API_KEY ?? '' } as unknown as Provider
const model: LanguageModel = createModel(provider, modelId)

interface Row {
  guard: 'tripwire' | 'moderation'
  id: string
  style: string
  expected: boolean
  ambiguous?: boolean
  /** The guard's decision as production applies it: withheld / blocked. */
  flagged: boolean
  stage1?: boolean
  failure?: string
  reason?: string
  latencyMs: number
  tokens: number
}

const tokensOf = (usage: LanguageModelUsage) => (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)

async function runCase<T> (
  guard: Row['guard'], id: string, style: string, expected: boolean, ambiguous: boolean,
  stages: { stage1: (s: AbortSignal) => Promise<any>, stage2: (s: AbortSignal) => Promise<any> },
  cleared: T, hardTimeoutMs: number,
  decide: (outcome: TwoStageOutcome<T>) => { flagged: boolean, reason?: string }
): Promise<Row> {
  let tokens = 0
  const startedAt = Date.now()
  const outcome = await classifyTwoStage<T>({
    ...stages,
    cleared,
    hardTimeoutMs,
    meter: generated => generated.then(({ usage }) => { tokens += tokensOf(usage) }, () => {})
  })
  const { flagged, reason } = decide(outcome)
  return {
    guard,
    id,
    style,
    expected,
    ...(ambiguous ? { ambiguous } : {}),
    flagged,
    ...(outcome.kind === 'verdict' ? { stage1: outcome.stage1 } : outcome.kind === 'confirm-failed' ? { stage1: true } : {}),
    ...(outcome.kind !== 'verdict' ? { failure: describeFailedStage(outcome) } : {}),
    ...(reason ? { reason } : {}),
    latencyMs: Date.now() - startedAt,
    tokens
  }
}

// The decisions exactly as each guard applies them in a turn: the tripwire fails open at stage 1 and toward a trip
// after a flag; moderation fails open at both stages.
const tripwireDecision = (outcome: TwoStageOutcome<TripwireVerdict>) =>
  outcome.kind === 'verdict'
    ? { flagged: outcome.verdict.suspected, reason: outcome.verdict.reason }
    : { flagged: outcome.kind === 'confirm-failed' }
const moderationDecision = (outcome: TwoStageOutcome<ModerationVerdict>) =>
  outcome.kind === 'verdict'
    ? { flagged: outcome.verdict.action === 'block', reason: [outcome.verdict.category, outcome.verdict.reason].filter(Boolean).join(': ') }
    : { flagged: false }

const jobs: Array<() => Promise<Row>> = []
for (let r = 0; r < repeat; r++) {
  if (guards.includes('tripwire')) {
    for (const c of TRIPWIRE_CASES) {
      if (only && !only.has(c.id)) continue
      jobs.push(() => {
        const nonce = newNonce()
        return runCase<TripwireVerdict>('tripwire', c.id, c.style, c.injected, false, {
          stage1: s => tripwireStage1(model, c, c.text, nonce, s),
          stage2: s => tripwireStage2(model, c, c.text, nonce, s)
        }, { suspected: false }, TRIPWIRE_HARD_TIMEOUT_MS, tripwireDecision)
      })
    }
  }
  if (guards.includes('moderation')) {
    for (const c of MODERATION_CASES) {
      if (only && !only.has(c.id)) continue
      jobs.push(() => runCase<ModerationVerdict>('moderation', c.id, c.style, c.block, !!c.ambiguous,
        moderationStages(model, { context: c.context ?? '', message: truncateForModeration(c.message), nonce: newNonce() }),
        { action: 'allow' }, MODERATION_HARD_TIMEOUT_MS, moderationDecision))
    }
  }
}

const rows: Row[] = []
let next = 0
await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, async () => {
  while (next < jobs.length) {
    const job = jobs[next++]
    const row = await job()
    rows.push(row)
    process.stderr.write(row.flagged === row.expected ? '.' : 'x')
  }
}))
process.stderr.write('\n')

const pct = (values: number[], p: number) => values.length ? [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(p / 100 * values.length))] : 0
const share = (n: number, d: number) => d ? `${n}/${d} (${Math.round(100 * n / d)}%)` : '0/0'

console.log(`\nGuard eval — model ${modelId} at ${baseURL}, ${repeat} run(s) of each case\n`)
let misjudged = 0
for (const guard of ['tripwire', 'moderation'] as const) {
  const all = rows.filter(r => r.guard === guard)
  const g = all.filter(r => !r.ambiguous)
  if (!all.length) continue
  const positives = g.filter(r => r.expected)
  const negatives = g.filter(r => !r.expected)
  const misses = positives.filter(r => !r.flagged)
  const falseAlarms = negatives.filter(r => r.flagged)
  misjudged += misses.length + falseAlarms.length
  const label = guard === 'tripwire' ? { pos: 'injected', neg: 'benign' } : { pos: 'to block', neg: 'to allow' }
  console.log(`## ${guard}`)
  console.log(`- misses (${label.pos} let through): ${share(misses.length, positives.length)}`)
  console.log(`- false alarms (${label.neg} flagged): ${share(falseAlarms.length, negatives.length)}`)
  console.log(`- stage 2 needed on ${label.neg} cases: ${share(negatives.filter(r => r.stage1).length, negatives.length)} (cleared there: ${negatives.filter(r => r.stage1 && !r.flagged).length})`)
  console.log(`- failed stages: ${g.filter(r => r.failure).length}`)
  console.log(`- latency p50/p95: ${pct(g.map(r => r.latencyMs), 50)}/${pct(g.map(r => r.latencyMs), 95)} ms; stage-1-only p50 ${pct(g.filter(r => !r.stage1).map(r => r.latencyMs), 50)} ms`)
  console.log(`- tokens per case, mean: ${Math.round(g.reduce((s, r) => s + r.tokens, 0) / g.length)}`)
  const byStyle = new Map<string, Row[]>()
  for (const r of g) byStyle.set(r.style, [...(byStyle.get(r.style) ?? []), r])
  console.log(`- wrong by style: ${[...byStyle].map(([style, rs]) => `${style} ${rs.filter(r => r.flagged !== r.expected).length}/${rs.length}`).join(', ')}`)
  const wrong = [...misses, ...falseAlarms].sort((a, b) => a.id.localeCompare(b.id))
  for (const r of wrong) console.log(`  ✗ ${r.id} [${r.expected ? 'miss' : 'false alarm'}] stage1=${r.stage1 ?? '-'}${r.failure ? ` ${r.failure}` : ''}${r.reason ? ` — ${r.reason}` : ''}`)
  for (const r of all.filter(r => r.ambiguous)) console.log(`  ? ${r.id} [ambiguous, not counted] flagged=${r.flagged}${r.reason ? ` — ${r.reason}` : ''}`)
  const unstable = [...new Set(g.map(r => r.id))].filter(id => new Set(g.filter(r => r.id === id).map(r => r.flagged)).size > 1)
  if (unstable.length) console.log(`- unstable across runs: ${unstable.join(', ')}`)
  console.log('')
}
if (env.GUARD_EVAL_OUT) writeFileSync(env.GUARD_EVAL_OUT, JSON.stringify({ model: modelId, baseURL, repeat, rows }, null, 2))
process.exit(misjudged ? 1 : 0)

/**
 * service.ts contains the stateful side of the classifier engine shared by input moderation and the tool-output
 * tripwire (see operations.ts): the nonce, the two stage calls and their metering. What a verdict leads to, and
 * which way a failure goes, is each guard's own.
 */
import { randomBytes } from 'node:crypto'
import { generateObject, generateText, NoObjectGeneratedError, type LanguageModel, type LanguageModelUsage } from 'ai'
import type { z } from 'zod'
import { OPENAI_COMPATIBLE_PROVIDER_NAME } from '../models/operations.ts'
import { GUARD_STAGE1_MAX_TOKENS, isReasoningEffortRejected, parseStage1 } from './operations.ts'

/** The wrapper's nonce, one per check: unknown to whoever wrote the content, so it cannot close the tag. */
export const newNonce = (): string => randomBytes(6).toString('hex')

// Run a classifier call with thinking disabled: reasoning_effort:none is
// honoured by OpenAI-compatible reasoning models (Scaleway/GLM, …) so the short token
// budget isn't spent on hidden reasoning (which would yield content:null → fail-open).
// It is silently ignored by non-openai-compatible providers, and rejected with a 400 by
// non-reasoning OpenAI-compatible models — those retry once without it. `call` receives
// the extra options to spread into the generate call.
export async function withReasoningDisabled<T> (call: (extra: { providerOptions?: Record<string, Record<string, any>> }) => Promise<T>): Promise<T> {
  try {
    return await call({ providerOptions: { [OPENAI_COMPATIBLE_PROVIDER_NAME]: { reasoningEffort: 'none' } } })
  } catch (err) {
    if (!isReasoningEffortRejected(err)) throw err
    return await call({})
  }
}

interface GuardCall {
  model: LanguageModel
  /** The guard's policy: static, so it caches across calls and both stages. */
  instructions: string
  /** The wrapped content, then the stage's instruction. */
  content: string
  abortSignal: AbortSignal
}

/** Stage 1: one word, at temperature 0. */
export const stage1Call = (call: GuardCall) => withReasoningDisabled(extra => generateText({
  model: call.model,
  temperature: 0,
  maxOutputTokens: GUARD_STAGE1_MAX_TOKENS,
  instructions: call.instructions,
  messages: [{ role: 'user' as const, content: call.content }],
  abortSignal: call.abortSignal,
  ...extra
}))

export class Stage1UnparseableError extends Error {
  constructor () { super('the classifier\'s first stage did not answer yes or no') }
}

/** Stage 1's answer, read from its text: rejects with Stage1UnparseableError when it is not one yes or no. */
export const stage1Answer = (generated: Promise<{ text: string }>): Promise<boolean> => generated.then(({ text }) => {
  const answer = parseStage1(text)
  if (answer === undefined) throw new Stage1UnparseableError()
  return answer
})

/** Stage 2, only on a stage-1 flag: the same policy and wrapped content, a structured verdict. */
export const stage2Call = <T>(call: GuardCall & { schema: z.ZodType<T>, maxOutputTokens: number, reasoning?: boolean }): Promise<{ object: T, usage: LanguageModelUsage }> => {
  const generate = (extra: { providerOptions?: Record<string, Record<string, any>> }) => generateObject({
    model: call.model,
    schema: call.schema,
    temperature: 0,
    maxOutputTokens: call.maxOutputTokens,
    instructions: call.instructions,
    messages: [{ role: 'user' as const, content: call.content }],
    abortSignal: call.abortSignal,
    ...extra
  }) as Promise<{ object: T, usage: LanguageModelUsage }>
  // `reasoning`: the model may think before it answers (a reviewer's judgement), so reasoning is left on.
  return call.reasoning ? generate({}) : withReasoningDisabled(generate)
}

/**
 * Charge a classifier call when it settles, beside its answer rather than before it: a guard's timeout races the
 * model call, not the usage write. An answer that could not be parsed was still generated: its tokens are charged
 * (NoObjectGeneratedError carries them); other failures generated nothing to charge. Stage 1 parses its text
 * after this promise resolved, so an unparseable stage-1 answer is charged by the first branch. The returned
 * promise rejects only when `charge` does: the caller logs it.
 */
export const meterGuardCall = (generated: Promise<{ usage: LanguageModelUsage }>, charge: (usage: LanguageModelUsage) => Promise<unknown>): Promise<unknown> =>
  generated.then(({ usage }) => charge(usage), err => {
    if (NoObjectGeneratedError.isInstance(err) && err.usage) return charge(err.usage)
  })

// ---- the two-stage sequence ----

/** Why a stage left no verdict: what each guard does with it is its own (moderation fails open, the tripwire too
 * at stage 1, while a failed confirmation after a flag counts as suspected). */
export type GuardFailureCause = 'error' | 'timeout' | 'unparseable'

/** A failed stage call's cause: aborted by its signal, an answer that could not be parsed, or the call itself. */
export const failureCause = (err: unknown, signal: AbortSignal): GuardFailureCause =>
  signal.aborted ? 'timeout' : (err instanceof Stage1UnparseableError || NoObjectGeneratedError.isInstance(err)) ? 'unparseable' : 'error'

/** The cause in words; the provider's message, when given, after a failed call (what the admin probe exists to show). */
export const describeFailure = (cause: GuardFailureCause, message?: string): string =>
  cause === 'timeout'
    ? 'it timed out'
    : cause === 'unparseable' ? 'its answer could not be parsed' : `the model call failed${message ? ` (${message})` : ''}`

const messageOf = (err: unknown): string => err instanceof Error ? err.message : String(err)

/**
 * What one two-stage check came to. A stage-1 `no` is the guard's `cleared` verdict; a `yes` goes to stage 2,
 * whose verdict decides. A failure is returned, never thrown: which way it goes is the caller's.
 */
export type TwoStageOutcome<T> =
  | { kind: 'verdict', stage1: boolean, verdict: T }
  | { kind: 'stage1-failed', cause: GuardFailureCause, message: string }
  | { kind: 'confirm-failed', cause: GuardFailureCause, message: string }

/** A failed outcome in words, for an admin probe row. */
export const describeFailedStage = (outcome: Exclude<TwoStageOutcome<unknown>, { kind: 'verdict' }>): string =>
  `${outcome.kind === 'stage1-failed' ? 'the first stage' : 'the confirmation stage'} failed: ${describeFailure(outcome.cause, outcome.message)}`

/**
 * Stage 1, then stage 2 on a flag (without `stage1`, stage 2 alone: a confirmation-only check), each call capped at `hardTimeoutMs` so the check settles. `meter` charges a
 * call when it settles (meterGuardCall, wrapped by the guard) and is awaited before the outcome is returned, so
 * the cost is recorded by the time the outcome is acted on. It must not reject.
 */
export async function classifyTwoStage<T> (params: {
  /** Absent: the check is a confirmation only and goes straight to stage 2. */
  stage1?: (abortSignal: AbortSignal) => Promise<{ text: string, usage: LanguageModelUsage }>
  stage2: (abortSignal: AbortSignal) => Promise<{ object: T, usage: LanguageModelUsage }>
  cleared: T
  hardTimeoutMs: number
  /** Caps stage 2 alone (default `hardTimeoutMs`): a reasoning stage 2 needs longer than a one-word stage 1. */
  stage2TimeoutMs?: number
  meter: (generated: Promise<{ usage: LanguageModelUsage }>, startedAt: number) => Promise<unknown>
}): Promise<TwoStageOutcome<T>> {
  if (params.stage1) {
    const signal1 = AbortSignal.timeout(params.hardTimeoutMs)
    const startedAt1 = Date.now()
    const generated1 = params.stage1(signal1)
    const metered1 = params.meter(generated1, startedAt1)
    let flagged: boolean
    try {
      flagged = await stage1Answer(generated1)
    } catch (err) {
      await metered1
      return { kind: 'stage1-failed', cause: failureCause(err, signal1), message: messageOf(err) }
    }
    await metered1
    if (!flagged) return { kind: 'verdict', stage1: false, verdict: params.cleared }
  }

  const signal2 = AbortSignal.timeout(params.stage2TimeoutMs ?? params.hardTimeoutMs)
  const startedAt2 = Date.now()
  const generated2 = params.stage2(signal2)
  const metered2 = params.meter(generated2, startedAt2)
  try {
    const { object } = await generated2
    await metered2
    return { kind: 'verdict', stage1: true, verdict: object }
  } catch (err) {
    await metered2
    return { kind: 'confirm-failed', cause: failureCause(err, signal2), message: messageOf(err) }
  }
}

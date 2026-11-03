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
export const stage2Call = <T>(call: GuardCall & { schema: z.ZodType<T>, maxOutputTokens: number }): Promise<{ object: T, usage: LanguageModelUsage }> =>
  withReasoningDisabled(extra => generateObject({
    model: call.model,
    schema: call.schema,
    temperature: 0,
    maxOutputTokens: call.maxOutputTokens,
    instructions: call.instructions,
    messages: [{ role: 'user' as const, content: call.content }],
    abortSignal: call.abortSignal,
    ...extra
  }) as Promise<{ object: T, usage: LanguageModelUsage }>)

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

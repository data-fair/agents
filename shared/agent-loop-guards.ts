/**
 * Loop guards for the two agent loops (the main chat turn and each delegated sub-agent).
 *
 * The problem: agents whose tools are deliberately fine-grained legitimately need many
 * steps (a json-layout form is filled one `setFieldValue` per field, plus suggestion
 * round-trips), while a model stuck re-issuing the same call must be stopped early. A
 * single step count cannot serve both: any value low enough to cut a runaway short also
 * truncates real work. So the two concerns are guarded separately, the way long-run
 * harnesses (OpenHands, Gemini CLI, Roo Code, browser-use) do it:
 *
 *  1. STEP_LIMIT — one flat, generous backstop. Spend is NOT its job: the gateway enforces
 *     quotas on every request, and the user has a Stop button. It only has to bound a
 *     runaway that the repeat guard cannot recognise (e.g. a tool whose output changes on
 *     every call).
 *  2. Repeated-call guard — the actual runaway shape: the same tool calls, with the same
 *     arguments, returning the same results, step after step. At REPEATED_CALL_NUDGE_AT
 *     the model is told so (one injected reminder, per-step, never stored in the
 *     transcript); at REPEATED_CALL_LIMIT the loop is stopped.
 *
 * Either guard ends the loop on a tool-call step, and the sub-agent orchestration then
 * runs one no-tools close-out turn so the work gathered so far is reported rather than
 * dropped (see docs/architecture/loop-guards.md).
 */

import type { ModelMessage } from 'ai'

/**
 * Autonomous steps a loop may take (a step is one model turn plus the tools it calls).
 * Matches the runaway backstops of harnesses built for long runs (OpenHands and
 * browser-use default to 100) and sits well above observed successful trajectories for
 * form filling and data exploration.
 */
export const STEP_LIMIT = 100

/** Consecutive identical tool-call steps after which the model is reminded it is repeating itself. */
export const REPEATED_CALL_NUDGE_AT = 3

/** Consecutive identical tool-call steps after which the loop is stopped. */
export const REPEATED_CALL_LIMIT = 5

function stableJson (value: unknown): string {
  try {
    return JSON.stringify(value) ?? 'undefined'
  } catch {
    // Circular or otherwise unserializable: treat as unique rather than risk
    // collapsing two different values into one signature.
    return `unserializable:${Math.random()}`
  }
}

/** Tool names a step called, deduplicated, for the nudge text. */
function stepToolNames (step: unknown): string[] {
  const calls = (step as { toolCalls?: unknown })?.toolCalls
  if (!Array.isArray(calls)) return []
  return [...new Set(calls.map((call: any) => String(call?.toolName)))]
}

/**
 * Signature of what a step did AND what it got back, or null if it made no tool call.
 *
 * Results are part of the signature on purpose: the same call returning different
 * output is progress (polling a status, re-reading a field after a change), the same
 * call returning the same output is spinning. A step with no tool calls breaks any run —
 * the model said something, so it is not stuck on a call.
 */
function stepSignature (step: unknown): string | null {
  const calls = (step as { toolCalls?: unknown })?.toolCalls
  if (!Array.isArray(calls) || calls.length === 0) return null
  const callSigs = calls.map((call: any) => `${String(call?.toolName)}:${stableJson(call?.input)}`).sort()
  const results = (step as { toolResults?: unknown })?.toolResults
  const resultSigs = Array.isArray(results)
    ? results.map((result: any) => `${String(result?.toolName)}:${stableJson(result?.output)}`).sort()
    : []
  return `${callSigs.join('|')}=>${resultSigs.join('|')}`
}

/**
 * Length of the trailing run of identical steps (0 when the last step made no tool call).
 */
export function trailingRepeatCount (steps: unknown): number {
  if (!Array.isArray(steps) || steps.length === 0) return 0
  const last = stepSignature(steps[steps.length - 1])
  if (last === null) return 0
  let count = 0
  for (let i = steps.length - 1; i >= 0; i--) {
    if (stepSignature(steps[i]) !== last) break
    count++
  }
  return count
}

/** Has the loop issued the same tool calls, with the same results, `limit` times in a row? */
export function isRepeatingCalls (steps: unknown, limit: number = REPEATED_CALL_LIMIT): boolean {
  if (limit < 2) return false
  return trailingRepeatCount(steps) >= limit
}

/**
 * A `stopWhen` condition that ends the loop on a runaway repeat. Pair it with
 * `stepCountIs(STEP_LIMIT)`: this catches spinning, the step limit catches the rest.
 */
export function repeatedCallGuard (limit: number = REPEATED_CALL_LIMIT) {
  return ({ steps }: { steps: unknown }) => isRepeatingCalls(steps, limit)
}

/**
 * Reminder injected once the model has repeated itself `at` times but before the guard
 * stops it, or null when the loop is not repeating. Mirrors the OpenHands SDK nudge: the
 * mildest intervention that works is telling the model plainly what it just did.
 */
export function repeatedCallNudge (steps: unknown, at: number = REPEATED_CALL_NUDGE_AT, limit: number = REPEATED_CALL_LIMIT): string | null {
  const count = trailingRepeatCount(steps)
  if (count < at || count >= limit) return null
  const names = stepToolNames((steps as unknown[])[(steps as unknown[]).length - 1]).map(n => `\`${n}\``).join(', ')
  return `You have called ${names} with the same arguments ${count} times in a row and got the same result each time. Repeating the exact same call will not work: review the result and change the arguments or the approach, or write your final answer with what you already have.`
}

/**
 * A `prepareStep` hook that appends the nudge to the messages sent for the next step.
 * The extra message only exists in that model request, never in the stored transcript.
 * Compose it with any other per-step overrides (`{ ...loopGuardPrepareStep(opts), ... }`).
 */
export function loopGuardPrepareStep ({ steps, messages }: { steps: unknown, messages: ModelMessage[] }): { messages?: ModelMessage[] } {
  const nudge = repeatedCallNudge(steps)
  if (!nudge) return {}
  return { messages: [...messages, { role: 'user', content: nudge }] }
}

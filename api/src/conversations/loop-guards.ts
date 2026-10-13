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
 *  1. STEP_LIMIT — one flat, generous backstop. Spend is NOT its job: quotas are checked
 *     before every turn (turn-gates.ts), the per-turn credit budget (`turnCredits`) and the
 *     account cap stop the loop between steps (executor.ts), and the user has a Stop button.
 *     It only has to bound a
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

/**
 * How long a stream may produce NOTHING before the turn is treated as stuck.
 *
 * An idle watchdog, not a total ceiling: a legitimate multi-step tool conversation has no fixed
 * duration, so bounding total time would cut off honest work, while a stream that has gone quiet is
 * stuck whatever its total elapsed time.
 *
 * Silence while a TOOL runs does not count: see createIdleWatchdog.
 */
export const STREAM_IDLE_TIMEOUT_MS = 90_000

export interface IdleWatchdog {
  /** The stream produced a part: the silence starts over. */
  activity: () => void
  /** A tool call began: the stream is expected to be quiet until it ends. */
  toolStarted: (toolCallId: string) => void
  toolEnded: (toolCallId: string) => void
  stop: () => void
}

/**
 * The idle watchdog of a model stream, paused while any tool call is outstanding.
 *
 * NOT the AI SDK's `timeout.chunkMs`, which it replaced: that timer is reset by every chunk of the step
 * — tool results included — and cleared only when the step ends, so a tool still RUNNING reads as a
 * silent stream. A slow catalog query, or a browser tool the page takes its time over, was aborted as
 * a stuck provider. Only the MODEL going quiet while nothing else is happening is a stall.
 */
export const createIdleWatchdog = (
  timeoutMs: number,
  onIdle: () => void,
  timers: { set: (fn: () => void, ms: number) => unknown, clear: (handle: unknown) => void } = {
    set: (fn, ms) => setTimeout(fn, ms),
    clear: handle => { clearTimeout(handle as ReturnType<typeof setTimeout>) }
  }
): IdleWatchdog => {
  const running = new Set<string>()
  let handle: unknown
  let stopped = false
  const disarm = () => { if (handle !== undefined) timers.clear(handle); handle = undefined }
  const arm = () => {
    disarm()
    if (stopped || running.size) return
    handle = timers.set(() => { handle = undefined; if (!stopped) onIdle() }, timeoutMs)
  }
  arm()
  return {
    activity: arm,
    toolStarted: id => { running.add(id); disarm() },
    toolEnded: id => { running.delete(id); arm() },
    stop: () => { stopped = true; disarm() }
  }
}

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
 * `isStepCount(STEP_LIMIT)`: this catches spinning, the step limit catches the rest.
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
 * A `prepareStep` hook that adds the nudge, last, to the messages sent for the next step.
 * The extra message only exists in that model request, never in the stored transcript.
 * It OWNS `messages`: another per-step override of `messages` would drop the rebuild (and the nudge), so
 * compose it by function composition over its result (`stepContext(guarded.messages)`, ./step-context.ts),
 * never as a second override.
 *
 * The step is REBUILT every time from what the call was given and what the steps answered, rather than
 * appended to `messages`: AI SDK 7 carries a `messages` override forward — the next step starts from what
 * this one was sent — so an appended nudge stayed in every later request and a new one was stacked on each
 * repeat. Rebuilt, a step without a nudge is exactly what the SDK would have sent, and a step with one
 * carries exactly one.
 */
export function loopGuardPrepareStep ({ steps, initialMessages, responseMessages }: { steps: unknown, initialMessages: ModelMessage[], responseMessages: ModelMessage[] }): { messages: ModelMessage[] } {
  const nudge = repeatedCallNudge(steps)
  return { messages: [...initialMessages, ...responseMessages, ...(nudge ? [{ role: 'user' as const, content: nudge }] : [])] }
}

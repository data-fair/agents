/**
 * How many autonomous steps an agent loop may take before `stopWhen` cuts it off.
 *
 * A "step" is one model turn plus the tool calls it emits, so the budget bounds how
 * many rounds of tool use a loop gets — not how many tools it calls. The old flat
 * cap of 10 was tuned for coarse tools (one call, one answer) and starved pages whose
 * tools are deliberately fine-grained: a json-layout form is filled one field at a
 * time (`setFieldValue` per field, plus `getFieldSuggestions` round-trips and
 * `editArray` + N fields per array item), so even a small form needs several dozen
 * steps. Truncating there is worse than slow — the worker stops mid-form and the
 * close-out turn reports a half-filled form as a result.
 *
 * A single higher constant would only move the cliff, so the budget is negotiated
 * instead: the page declares what its sub-agent needs (`maxSteps` in the sub-agent
 * config, see SubAgentOptions in lib-vue), and the host clamps that to a ceiling it
 * controls. Pages that declare nothing keep a default that is generous enough for
 * fine-grained tools but still bounded.
 *
 * Raising the budget alone would be unsafe, because the low cap was doing double duty:
 * it was also the ONLY thing stopping a model stuck in a loop. A step count is a poor
 * guard for that — it punishes long legitimate work exactly as hard as a runaway — so
 * the two concerns are separated here. `repeatedCallGuard` catches the actual runaway
 * shape (the same call, with the same arguments, over and over), which lets the budget
 * be generous. Spend is bounded independently: the gateway enforces quotas on every
 * request, so neither guard is what keeps a loop from being expensive.
 */

/** Budget for a delegated sub-agent whose page declares no `maxSteps`. */
export const DEFAULT_SUBAGENT_STEPS = 25

/** Budget for the main chat loop when no flattened sub-agent asks for more. */
export const DEFAULT_MAIN_STEPS = 25

/**
 * Hard ceiling on any declared budget. The page is untrusted input: this bounds a
 * typo'd or hostile `maxSteps` (and the runaway token spend behind it), so a declared
 * value can raise the budget only up to a limit the host decides.
 */
export const MAX_DECLARED_STEPS = 100

/**
 * Resolve one declared `maxSteps` into a usable budget.
 *
 * Anything that is not a positive finite number — missing, null, NaN, 0, negative,
 * a string from a hand-written config — falls back rather than throwing, so a
 * malformed page config degrades to the default instead of breaking the turn.
 */
export function resolveStepBudget (declared: unknown, fallback: number = DEFAULT_SUBAGENT_STEPS): number {
  if (typeof declared !== 'number' || !Number.isFinite(declared)) return fallback
  const steps = Math.floor(declared)
  if (steps < 1) return fallback
  return Math.min(steps, MAX_DECLARED_STEPS)
}

/**
 * Budget for the main loop, given the sub-agents that were flattened into it.
 *
 * Flattening moves a sub-agent's tools into the main loop, so its work now spends the
 * MAIN budget. Ignoring its declared `maxSteps` here would reintroduce the very cliff
 * flattening is meant to avoid: a form-filling sub-agent that asks for 50 steps would
 * get 25 the moment the flatten toggle is on. The main loop also carries its own
 * conversation, so it takes the largest declared budget rather than a sum, still
 * clamped by the shared ceiling.
 */
export function mainStepBudget (flattenedDeclarations: unknown[]): number {
  let budget = DEFAULT_MAIN_STEPS
  for (const declared of flattenedDeclarations) {
    const resolved = resolveStepBudget(declared, 0)
    if (resolved > budget) budget = resolved
  }
  return Math.min(budget, MAX_DECLARED_STEPS)
}

/**
 * Consecutive identical tool-call steps that count as a runaway loop.
 *
 * Set above any plausible legitimate repeat: re-reading one field twice while making
 * progress elsewhere is normal, issuing byte-identical calls five times in a row is not.
 */
export const REPEATED_CALL_LIMIT = 5

/**
 * Signature of the tool calls a step made, or null if it made none.
 *
 * A step with no tool calls breaks any repeat run — the model said something, so it is
 * not spinning on the same call.
 */
function stepSignature (step: unknown): string | null {
  const calls = (step as { toolCalls?: unknown })?.toolCalls
  if (!Array.isArray(calls) || calls.length === 0) return null
  return calls
    .map((call: any) => {
      let input: string
      try {
        input = JSON.stringify(call?.input) ?? 'undefined'
      } catch {
        // Circular or otherwise unserializable input: treat it as unique rather than
        // risk collapsing two different calls into one signature.
        input = `unserializable:${Math.random()}`
      }
      return `${String(call?.toolName)}:${input}`
    })
    .join('|')
}

/**
 * Has the loop issued the same tool calls `limit` times in a row?
 *
 * Compares serialized arguments, so two calls only match when they are genuinely
 * identical. Key ordering could in principle differ between two otherwise-equal inputs
 * and hide a repeat; that only costs a missed detection, and the step budget still
 * stops the loop.
 */
export function isRepeatingCalls (steps: unknown, limit: number = REPEATED_CALL_LIMIT): boolean {
  if (!Array.isArray(steps) || limit < 2 || steps.length < limit) return false
  const tail = steps.slice(-limit).map(stepSignature)
  if (tail.some((sig) => sig === null)) return false
  return tail.every((sig) => sig === tail[0])
}

/**
 * A `stopWhen` condition that ends the loop on a runaway repeat. Pair it with a step
 * budget: this catches spinning, the budget catches work that is merely unbounded.
 */
export function repeatedCallGuard (limit: number = REPEATED_CALL_LIMIT) {
  return ({ steps }: { steps: unknown }) => isRepeatingCalls(steps, limit)
}

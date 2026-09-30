/**
 * What a tool was asked to do, as a bounded string for DISPLAY.
 *
 * Shared because both surfaces need the same rendering of the same stored value: the executor writes it
 * into a run's trace, and the run-status strip shows it beside a failed call. Two copies of a bound are
 * how a value ends up truncated differently depending on where it is read.
 *
 * This is not how the arguments are STORED. The stored part keeps the tool's real `input`, because the
 * conversation is the reference copy and a revived turn has to replay the call the model actually made.
 * That is safe unbounded: the input is model output, so the provider's own output cap bounds it.
 */

/**
 * How much of a call's arguments to show. Generous enough that a normal call is shown whole, small
 * enough that one pathological argument does not dominate a trace or a status strip.
 */
export const TOOL_ARGUMENTS_LIMIT = 2000

/**
 * Recorded because knowing a tool was CALLED is far weaker than knowing what it was asked to do: that
 * difference is what makes a write auditable after the fact, and what makes a prompt injection visible
 * — an instruction smuggled through a tool result shows up here, in the call it provoked, even when the
 * answer looks innocuous.
 */
export function summarizeToolArguments (input: unknown, limit: number = TOOL_ARGUMENTS_LIMIT): string {
  if (input === undefined || input === null) return ''
  let serialized: string
  try {
    serialized = typeof input === 'string' ? input : JSON.stringify(input) ?? ''
  } catch {
    // A circular or otherwise unserialisable value must not take the turn down with it, and must
    // not be recorded as though it were empty.
    return '[unserializable arguments]'
  }
  if (serialized.length <= limit) return serialized
  return `${serialized.slice(0, limit)}… [truncated, ${serialized.length} chars total]`
}

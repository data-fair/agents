import { WAIT_TOOL_NAME } from './host-events.js'

export interface TurnTextState {
  /** The turn produced at least one word of visible text. */
  producedText: boolean
  /** The step that finished last issued a tool call. */
  lastStepHadTool: boolean
  /** Which tool that was, when there was one. */
  lastStepToolName?: string
}

/**
 * Whether a finished stream really left the person with nothing.
 *
 * A turn whose last step called a tool is normally one the model meant to
 * continue — it read the result and then said nothing — and that is worth
 * surfacing, because `producedText` alone latches on the first word and a turn
 * that says "let me delegate that" and never returns would read as answered.
 *
 * `wait_for_user_action` is the exception, and it is not a rare one: a declared
 * wait ENDS this stream on purpose and resumes the same turn when it resolves. A
 * judged run had the assistant open the add-line form, declare the wait, and get
 * « I wasn't able to produce a response. Please try rephrasing your request. »
 * rendered into the transcript — while the form subagent was working, and two
 * bubbles later the real answer arrived above it. The only outright untruth the
 * person read that run, and it stays there, above the answer.
 */
export function isEmptyTurn (state: TurnTextState): boolean {
  if (state.lastStepToolName === WAIT_TOOL_NAME) return false
  return !state.producedText || state.lastStepHadTool
}

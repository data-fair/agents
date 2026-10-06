/**
 * Facts derived from a recorded run, handed to the judge as evidence.
 *
 * Nothing here scores anything. There is no threshold, no enum, no pass mark —
 * a metric that decided whether a run was good would narrow the judge's
 * attention to the things that happen to be countable, which is the opposite of
 * what the judge is for. These exist because a few quantities are tedious and
 * error-prone to count by reading a transcript and its exports.
 *
 * The model-side counts come from the conversation exports, where the server recorded every call
 * with its role. They are NULL, not zero, when no export was read: a run whose evidence could not be
 * fetched did not make no requests, and printing 0 would say it did.
 */
import type { Transcript } from './types.ts'
import { recordedToolCalls, type ParsedExport } from './conversation-export.ts'

export type RunMetrics = {
  /** Messages the person actually sent. */
  userMessages: number
  assistantBubbles: number
  /**
   * Bubbles that rendered no prose. Almost always a tool-call bubble, which DOES
   * render a chip naming the tool on screen — so this is not a count of silence,
   * and three judges in a row misread it as one. What it measures is how much of
   * a run the person watched as tool names rather than sentences.
   */
  textlessAssistantBubbles: number
  avgVisibleReplyChars: number | null
  /** Conversations exported for this run (the person may have started more than one). */
  conversations: number
  /** Model calls the server recorded, every role included. */
  modelRequests: number | null
  /**
   * Calls per model role — `assistant` is the person's own conversation; `tools`, `summarizer` and
   * `moderator` are sub-agents, compaction and the moderation gate. The record names the role, so
   * nothing is inferred from the shape of the history.
   */
  requestsByRole: Record<string, number> | null
  /** `modelRequests / userMessages`, to one decimal; null when nobody spoke. */
  requestsPerUserMessage: number | null
  /** The largest prompt (input tokens) each role was sent. A summarizer legitimately carries the
   *  conversation, so read the role before reading the size. */
  largestInputTokensByRole: Record<string, number> | null
  /** Tool calls the conversation recorded, and how many ended in an error. */
  toolCalls: number | null
  failedToolCalls: number | null
  /** Tool calls issued twice with identical arguments, within one conversation. */
  duplicateToolCalls: number | null
  /** Characters of page state and page events folded into the model's prompts, summed over calls. */
  hostBlockChars: number | null
  /** Credits the server billed for the run, every role included. */
  credits: number | null
}

const countDuplicates = (calls: Array<{ toolName: string, input: unknown }>): number =>
  calls.length - new Set(calls.map(call => JSON.stringify([call.toolName, call.input]))).size

export function computeMetrics (transcript: Pick<Transcript, 'conversation'>, exports: ParsedExport[]): RunMetrics {
  const userMessages = transcript.conversation.filter(m => m.role === 'user').length
  const assistant = transcript.conversation.filter(m => m.role === 'assistant')
  const visible = assistant.filter(m => m.text.trim().length > 0)

  const measured = exports.length > 0
  const calls = exports.flatMap(exported => exported.runs.flatMap(run => run.calls))
  const requestsByRole: Record<string, number> = {}
  const largestInputTokensByRole: Record<string, number> = {}
  for (const call of calls) {
    requestsByRole[call.modelRole] = (requestsByRole[call.modelRole] ?? 0) + 1
    largestInputTokensByRole[call.modelRole] = Math.max(largestInputTokensByRole[call.modelRole] ?? 0, call.inputTokens ?? 0)
  }
  const toolCalls = exports.map(recordedToolCalls)

  return {
    userMessages,
    assistantBubbles: assistant.length,
    textlessAssistantBubbles: assistant.length - visible.length,
    avgVisibleReplyChars: visible.length
      ? Math.round(visible.reduce((sum, m) => sum + m.text.trim().length, 0) / visible.length)
      : null,
    conversations: exports.length,
    modelRequests: measured ? calls.length : null,
    requestsByRole: measured ? requestsByRole : null,
    requestsPerUserMessage: measured && userMessages ? Math.round((calls.length / userMessages) * 10) / 10 : null,
    largestInputTokensByRole: measured ? largestInputTokensByRole : null,
    toolCalls: measured ? toolCalls.flat().length : null,
    failedToolCalls: measured ? toolCalls.flat().filter(call => call.failed).length : null,
    duplicateToolCalls: measured ? toolCalls.reduce((sum, conversation) => sum + countDuplicates(conversation), 0) : null,
    hostBlockChars: measured ? calls.reduce((sum, call) => sum + (call.hostBlockChars ?? 0), 0) : null,
    credits: measured
      ? Math.round(exports.flatMap(exported => exported.runs).reduce((sum, run) => sum + (run.credits ?? 0), 0) * 1e6) / 1e6
      : null
  }
}

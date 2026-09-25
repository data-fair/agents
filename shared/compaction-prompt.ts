/**
 * The summarizer instruction and recap framing used when history is compacted.
 *
 * Shared because BOTH loops compact: the in-page chat (which compacts in the browser) and
 * the server-side autonomous agent runtime. The wording is load-bearing — a recap that
 * drops an identifier silently costs the assistant the ability to keep acting — so it
 * must not exist as two copies that can drift.
 */

import type { ModelMessage } from 'ai'

/**
 * The summary becomes the assistant's only memory of everything before the retained
 * window, so it must stay *actionable*: keep the open task and its next step, the user's
 * goals/constraints, decisions, and — verbatim — the identifiers the assistant needs to
 * keep acting (ids, indices, paths, URLs, names, figures). Detailed tool payloads can be
 * dropped (tools remain callable to re-fetch them) but the references to re-fetch them
 * must survive.
 *
 * `generation` is how many times this conversation has already been compacted.
 * Re-summarizing a summary compounds loss, so from the second compaction on the prompt
 * says a recap already heads the content and asks the model to merge rather than re-digest.
 */
export function compactionSystemPrompt (generation: number): string {
  const base = 'You are compacting the earlier part of a conversation between a user and a tool-using AI assistant so it can continue within a smaller context window. Write a dense recap that preserves everything needed to continue seamlessly: any task still in progress and the concrete next step; the user\'s stated goals, preferences and constraints; key decisions and conclusions; and important results from tool calls. Keep identifiers and references verbatim — dataset/resource ids, entry indices, file paths, URLs, names, exact figures — since the assistant may need them to act again. Omit pleasantries and redundant back-and-forth. Be concise, but lossless on actionable details.'
  const mergeNote = generation > 0
    ? ' The content below BEGINS with a recap produced by an earlier compaction. Merge it with the newer exchanges that follow it into a single recap; preserve every still-relevant detail from that earlier recap verbatim rather than re-summarizing it.'
    : ''
  return base + mergeNote
}

/**
 * The compacted history's opening message.
 *
 * Framed as a user turn (not assistant): providers like Anthropic require the history to
 * start with a user message, and the SDK coalesces it with whatever follows. The preamble
 * tells the model this is a condensed record of the earlier exchange — including its own
 * actions — so it does not mistake the recap for a fresh user request.
 */
export function recapMessage (summary: string): ModelMessage {
  return {
    role: 'user',
    content: `[Automatic recap of our earlier conversation, condensed to save context — continue as if you remember it]\n${summary}`
  }
}

/**
 * WHAT THE MODEL READ THAT THE STORED MESSAGES DO NOT SAY, for the review page: each run's `context`
 * (api/types/conversation-run/schema.js) marked in the transcript where it applies, so the thread reads as the
 * model had it, and listed per turn. Pure, the labels given in the reader's language.
 *
 * - a compaction recap: folded above the first message after its coverage, from the first turn that read it (its
 *   summary is on the run that wrote it; a later run names its generation);
 * - a removed result (cleared to free context, an image not sent): on its call, from its first removal;
 * - a step's other instructions, a message the service added: at the start of that step of the run's message;
 * - the outcome reminder of a task run: where it was sent (the mapper's).
 */
import { autonomousAgentMessageToChat } from './autonomous-agent-chat-message.ts'
import type { ChatMessage } from './chat-message.ts'

export interface ContextLabels {
  recapNote: (turn: number) => string
  notSent: (reason: string, turn: number, step: number) => string
  noteInstructions: string
  noteInjected: string
  reminderNote: string
  recapLine: (seq: number, generation: number, written: boolean) => string
  removedLine: (step: number, tool: string, reason: string) => string
  stepInstructions: (step: number) => string
  stepInjected: (step: number) => string
}

type Run = { id?: string, context?: { recap?: Recap, removed?: Array<{ toolCallId: string, step: number, reason: string }>, steps?: Array<{ step: number, instructions?: string, injected?: string }> } }
type Recap = { generation: number, coversUpToSeq: number, summary?: string, written?: boolean }
type Stored = { seq: number, role: 'user' | 'assistant', runId?: string, parts?: any[] }

/** A recap's summary: its own, or the one the run that wrote this generation recorded. */
export const recapSummary = (recap: Recap, runs: Run[]): string | undefined => recap.summary ??
  runs.find(run => run.context?.recap?.generation === recap.generation && run.context.recap.summary)?.context?.recap?.summary

export function annotateTranscript (stored: Stored[], runs: Run[], labels: ContextLabels): ChatMessage[] {
  const turnOf = new Map(runs.map((run, i) => [run.id, i]))
  const removedFrom = new Map<string, { turn: number, step: number, reason: string }>()
  runs.forEach((run, i) => {
    for (const entry of run.context?.removed ?? []) {
      if (!removedFrom.has(entry.toolCallId)) removedFrom.set(entry.toolCallId, { turn: i + 1, step: entry.step, reason: entry.reason })
    }
  })
  const recapAt = new Map<number, { turn: number, recap: Recap }>()
  runs.forEach((run, i) => {
    const recap = run.context?.recap
    if (!recap) return
    const next = stored.find(message => message.seq > recap.coversUpToSeq)
    if (next && !recapAt.has(next.seq)) recapAt.set(next.seq, { turn: i + 1, recap })
  })
  // Each turn on the first message it wrote; a turn that wrote none (failed before answering) on the next one that
  // does, else on the last message, so no turn's record is left out.
  const firstOf = new Map<number, number>()
  for (const message of stored) {
    const index = message.runId !== undefined ? turnOf.get(message.runId) : undefined
    if (index !== undefined && !firstOf.has(index)) firstOf.set(index, message.seq)
  }
  const turnsAt = new Map<number, number[]>()
  let pending: number[] = []
  runs.forEach((_, i) => {
    pending.push(i)
    const seq = firstOf.get(i)
    if (seq === undefined) return
    turnsAt.set(seq, [...(turnsAt.get(seq) ?? []), ...pending])
    pending = []
  })
  const last = stored[stored.length - 1]
  if (pending.length && last) turnsAt.set(last.seq, [...(turnsAt.get(last.seq) ?? []), ...pending])
  return stored.map(message => {
    const index = message.runId !== undefined ? turnOf.get(message.runId) : undefined
    const run = index !== undefined ? runs[index] : undefined
    const stepNotes: Record<number, Array<{ label: string, text: string }>> = {}
    for (const entry of run?.context?.steps ?? []) {
      const list = (stepNotes[entry.step] ??= [])
      if (entry.instructions) list.push({ label: labels.noteInstructions, text: entry.instructions })
      if (entry.injected) list.push({ label: labels.noteInjected, text: entry.injected })
    }
    const chat = autonomousAgentMessageToChat(message as any, { stepNotes, reminderLabel: labels.reminderNote })
    const turns = turnsAt.get(message.seq)
    if (turns) chat.turns = turns
    const recap = recapAt.get(message.seq)
    if (recap) chat.contextNote = { label: labels.recapNote(recap.turn), text: recapSummary(recap.recap, runs) }
    for (const invocation of chat.toolInvocations ?? []) {
      const removed = removedFrom.get(invocation.toolCallId)
      if (removed) invocation.notSent = labels.notSent(removed.reason, removed.turn, removed.step)
    }
    return chat
  })
}

/** One turn's whole list, for its detail: the recap it began with, the results it removed, its steps' additions. */
export function turnContextLines (run: Run, runs: Run[], stored: Stored[], labels: ContextLabels): Array<{ label: string, text?: string }> {
  const toolNameOf = (toolCallId: string) => {
    for (const message of stored) {
      const part = (message.parts ?? []).find((p: any) => p.toolCallId === toolCallId && p.toolName)
      if (part) return part.toolName as string
    }
    return toolCallId
  }
  const lines: Array<{ label: string, text?: string }> = []
  const recap = run.context?.recap
  if (recap) lines.push({ label: labels.recapLine(recap.coversUpToSeq, recap.generation, !!recap.written), text: recapSummary(recap, runs) })
  for (const entry of run.context?.removed ?? []) lines.push({ label: labels.removedLine(entry.step, toolNameOf(entry.toolCallId), entry.reason) })
  for (const entry of run.context?.steps ?? []) {
    if (entry.instructions) lines.push({ label: labels.stepInstructions(entry.step), text: entry.instructions })
    if (entry.injected) lines.push({ label: labels.stepInjected(entry.step), text: entry.injected })
  }
  return lines
}

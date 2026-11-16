/**
 * The read layer of a task run's content.
 *
 * A task run keeps its content on the run itself (`prompt`, `parts`), not in a conversation's messages.
 * Everything that reads a transcript — the export, read_conversation — expects messages, so this is the
 * one place that presents a task run as two: the prompt the task gave, and what the model produced.
 */
import { textPart, type MessagePart } from '@agents/shared/message-parts'

export interface StoredMessageLike {
  seq: number
  role: 'user' | 'assistant'
  parts: MessagePart[]
  runId?: string
}

/**
 * The message a task run gives the model: its task's title, then its prompt. The ONE place it is written, so the
 * run's transcript shows exactly what was sent. A run recorded before it kept its title shows its prompt alone.
 */
export const taskTurnText = (run: { prompt?: string, taskTitle?: string }): string =>
  run.taskTitle !== undefined ? `Planned task "${run.taskTitle}":\n\n${run.prompt ?? ''}` : (run.prompt ?? '')

export const runAsMessages = (run: { id: string, prompt?: string, taskTitle?: string, parts?: unknown[] }): StoredMessageLike[] => [
  { seq: 1, role: 'user', parts: [textPart(taskTurnText(run))] },
  { seq: 2, role: 'assistant', parts: (run.parts ?? []) as MessagePart[], runId: run.id }
]

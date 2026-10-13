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

export const runAsMessages = (run: { id: string, prompt?: string, parts?: unknown[] }): StoredMessageLike[] => [
  { seq: 1, role: 'user', parts: [textPart(run.prompt ?? '')] },
  { seq: 2, role: 'assistant', parts: (run.parts ?? []) as MessagePart[], runId: run.id }
]

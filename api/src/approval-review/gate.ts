/**
 * The review gate: the one AI SDK `toolApproval` function deciding each tool call of a configured agent's turn
 * (docs/superpowers/specs/2026-11-03-auto-approval-design.md, "The routing"). Pure: the review itself is a
 * parameter (createTurnReviewer, ./service.ts), so the decision table is unit-tested on its own.
 *
 * A function form of `toolApproval` replaces the tools' own `needsApproval` (the SDK consults only one), so the
 * gate answers for every tool: the reviewed ones by their route, the others by their `needsApproval`. It also
 * composes the denial of approved calls whose tool is gone (./../conversations/approved-calls.ts), and is called
 * again on replay of a person-approved call, where anything but `denied` runs it.
 *
 * Nested `code_mode` calls do not pass through `toolApproval`: their wrapper (Task 5) calls `reviewNested`, and
 * `noteNested` for every nested call that ran, so a script that read outside content makes the turn exposed.
 */
import type { ModelMessage, ToolApprovalConfiguration, ToolSet } from 'ai'
import type { ReviewRoute } from '@agents/shared/approval-policy'
import type { ApprovalClass } from '../conversations/approval-policy.ts'
import { goneApprovedToolNames, TOOL_NO_LONGER_AVAILABLE } from '../conversations/approved-calls.ts'
import { isScanned } from '../tripwire/operations.ts'
import { createReviewBreaker, type Exposure, type ProposedCall, type ReviewKind, type ReviewRecord } from './operations.ts'

export type { ReviewRoute }

export interface GateTool {
  needsApproval?: unknown
  annotations?: Record<string, unknown>
  server?: string
  title?: string
  /** Present on the tools the reviewer judges: their route, class and kind. */
  review?: { route: ReviewRoute, cls: ApprovalClass, kind: ReviewKind }
}

export interface ReviewGate {
  toolApproval: ToolApprovalConfiguration<ToolSet, any>
  /** A nested `code_mode` call to a reviewed tool, judged against the latest step's messages. */
  reviewNested (toolCallId: string, toolName: string, input: unknown): Promise<ReviewRecord>
  /** A nested call that ran (reviewed or not): its tool's output entered the script. */
  noteNested (toolName: string): void
  recordOf (toolCallId: string): ReviewRecord | undefined
  readonly tripped: boolean
}

type Status = { type: 'approved' | 'denied' | 'user-approval', reason?: string } | { type: 'not-applicable' }

/** Whether `messages` hold a person's approval of this call: on replay, it is not reviewed again. */
const approvedIn = (messages: ModelMessage[], toolCallId: string): boolean => {
  const approvals = new Set<string>()
  const granted = new Set<string>()
  for (const message of messages) {
    if (!Array.isArray(message.content)) continue
    for (const part of message.content as any[]) {
      if (part.type === 'tool-approval-request' && part.toolCallId === toolCallId) approvals.add(part.approvalId)
      else if (part.type === 'tool-approval-response' && part.approved === true) granted.add(part.approvalId)
    }
  }
  return [...approvals].some(id => granted.has(id))
}

const withReason = (type: 'approved' | 'denied' | 'user-approval', reason: string): Status => reason ? { type, reason } : { type }

/** What a review's record decides: a denial is final; unsure asks a person in a chat and denies elsewhere. */
const statusOf = (record: ReviewRecord, route: ReviewRoute, surface: 'chat' | 'task'): Status => {
  if (record.outcome === 'deny') return withReason('denied', record.reason)
  if (record.outcome === 'unsure') return withReason(surface === 'chat' ? 'user-approval' : 'denied', record.reason)
  return withReason(route === 'reviewer' ? 'approved' : 'user-approval', record.reason)
}

export const createReviewGate = (opts: {
  /** Live: the loop's tool map changes between steps. */
  tools: () => Record<string, GateTool>
  /** The turn's starting history, for goneApprovedToolNames. */
  history: ModelMessage[]
  surface: 'chat' | 'task'
  review: (call: ProposedCall, exposure: Exposure) => Promise<ReviewRecord>
  exposure: (messages: ModelMessage[]) => Exposure
}): ReviewGate => {
  const breaker = createReviewBreaker()
  const records = new Map<string, ReviewRecord>()
  // Scanned tools whose output entered a script this turn: not in any step's messages, a script's own result
  // being the script's.
  const nestedScanned = new Set<string>()
  // The messages of the latest step, for nested calls: the context their script was written in.
  let stepMessages: ModelMessage[] = opts.history

  const toolOf = (toolName: string): GateTool | undefined => {
    const tools = opts.tools()
    return Object.hasOwn(tools, toolName) ? tools[toolName] : undefined
  }

  const exposureFor = (messages: ModelMessage[]): Exposure => {
    const base = opts.exposure(messages)
    if (!nestedScanned.size) return base
    return { exposed: true, tools: [...new Set([...base.tools, ...nestedScanned])] }
  }

  const review = async (toolCallId: string, toolName: string, tool: GateTool & { review: NonNullable<GateTool['review']> }, input: unknown, messages: ModelMessage[]) => {
    const call: ProposedCall = {
      toolName,
      ...(tool.server ? { server: tool.server } : {}),
      ...(tool.title ? { title: tool.title } : {}),
      ...(tool.annotations ? { annotations: tool.annotations } : {}),
      input,
      cls: tool.review.cls,
      kind: tool.review.kind
    }
    const record = await opts.review(call, exposureFor(messages))
    records.set(toolCallId, record)
    breaker.count(record)
    return record
  }

  const toolApproval: ToolApprovalConfiguration<ToolSet, any> = async ({ toolCall, messages }) => {
    stepMessages = messages
    const { toolCallId, toolName, input } = toolCall
    if (goneApprovedToolNames(opts.history, opts.tools()).includes(toolName)) return { type: 'denied', reason: TOOL_NO_LONGER_AVAILABLE }
    if (approvedIn(messages, toolCallId)) return { type: 'user-approval' }
    const tool = toolOf(toolName)
    if (!tool?.review) return tool?.needsApproval ? { type: 'user-approval' } : { type: 'not-applicable' }
    const record = await review(toolCallId, toolName, tool as GateTool & { review: NonNullable<GateTool['review']> }, input, messages)
    return statusOf(record, tool.review.route, opts.surface)
  }

  return {
    toolApproval,
    async reviewNested (toolCallId, toolName, input) {
      const tool = toolOf(toolName)
      // The wrapper reviews only reviewed tools: anything else reaching here is a wiring mistake, refused.
      if (!tool?.review) throw new Error(`${toolName} is not a reviewed tool`)
      return await review(toolCallId, toolName, tool as GateTool & { review: NonNullable<GateTool['review']> }, input, stepMessages)
    },
    noteNested (toolName) {
      if (isScanned(toolName, toolOf(toolName)?.annotations)) nestedScanned.add(toolName)
    },
    recordOf: (toolCallId) => records.get(toolCallId),
    get tripped () { return breaker.tripped }
  }
}

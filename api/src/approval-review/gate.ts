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
 * Nested `code_mode` calls do not pass through `toolApproval`: their wrapper (api/src/code-mode/code-tools.ts) calls
 * `reviewNested`, pausing the script for a person where the record asks one (`asksPerson`, in a chat), and
 * `noteNested` for every nested call that ran, so a script that read outside content makes the turn exposed.
 */
import { isDeepStrictEqual } from 'node:util'
import type { ModelMessage, ToolApprovalConfiguration, ToolSet } from 'ai'
import type { ReviewRoute } from '@agents/shared/approval-policy'
import type { ApprovalClass } from '../conversations/approval-policy.ts'
import { goneApprovedToolNames, TOOL_NO_LONGER_AVAILABLE } from '../conversations/approved-calls.ts'
import { isScanned } from '../tripwire/operations.ts'
import { BREAKER_TRIPPED_REASON, BUDGET_SPENT_REASON, createReviewBreaker, earlierCallOfRecord, refusalTextOf, type CheckedArgument, type EarlierCall, type Exposure, type ProposedCall, type ReviewKind, type ReviewRecord } from './operations.ts'

export type { ReviewRoute }

export interface GateTool {
  needsApproval?: unknown
  annotations?: Record<string, unknown>
  server?: string
  title?: string
  /** The arguments its server checks before the call (`x-checked`, checkedArgumentsOf). */
  checked?: Record<string, CheckedArgument>
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

/**
 * Whether `messages` hold a person's approval of this call: on replay, it is not reviewed again. Only the LAST
 * message's responses count, when it is a tool message, as the SDK's own collectToolApprovals reads them: a
 * response is answered by the replay that follows it, so an older one is history, never a pass for a new call.
 */
const approvedIn = (messages: ModelMessage[], toolCallId: string): boolean => {
  const last = messages.at(-1)
  if (last?.role !== 'tool' || !Array.isArray(last.content)) return false
  const granted = new Set((last.content as any[]).filter(part => part.type === 'tool-approval-response' && part.approved === true).map(part => part.approvalId))
  if (!granted.size) return false
  for (const message of messages) {
    if (message.role !== 'assistant' || !Array.isArray(message.content)) continue
    for (const part of message.content as any[]) {
      if (part.type === 'tool-approval-request' && part.toolCallId === toolCallId && granted.has(part.approvalId)) return true
    }
  }
  return false
}

const withReason = (type: 'approved' | 'denied' | 'user-approval', reason: string): Status => reason ? { type, reason } : { type }

/**
 * Whether a review's record puts the call to a person, where one can decide (a chat): unsure, or an allow on the
 * `reviewer+person` route. Never a deny, nor a call refused unreviewed (a tripped breaker, a spent budget): the rule
 * statusOf applies to a direct call, for a script's (its wrapper pauses the script on it).
 */
export const asksPerson = (record: ReviewRecord, route: ReviewRoute): boolean =>
  record.code !== 'breaker-tripped' && (record.outcome === 'unsure' || (record.outcome === 'allow' && (route !== 'reviewer' || record.personAgain === true)))

/**
 * What a review's record decides: a denial is final; unsure asks a person in a chat and denies elsewhere. A denial
 * tells the model not to work around it (reviewerDenialText), a failed review that it could not be reviewed
 * (reviewUnavailableText, refusalTextOf); a card's reason is the reviewer's own, for the person.
 */
const statusOf = (record: ReviewRecord, route: ReviewRoute, surface: 'chat' | 'task'): Status => {
  if (record.outcome === 'deny' || (record.outcome === 'unsure' && surface === 'task')) return { type: 'denied', reason: refusalTextOf(record) }
  if (record.outcome === 'unsure') return withReason('user-approval', record.reason)
  return withReason(route === 'reviewer' && !record.personAgain ? 'approved' : 'user-approval', record.reason)
}

export const createReviewGate = (opts: {
  /** Live: the loop's tool map changes between steps. */
  tools: () => Record<string, GateTool>
  /** The turn's starting history, for goneApprovedToolNames. */
  history: ModelMessage[]
  surface: 'chat' | 'task'
  review: (call: ProposedCall, exposure: Exposure, earlierCalls: EarlierCall[]) => Promise<ReviewRecord>
  /**
   * The conversation's gated calls before this turn (reviewContextOfConversation), and how many of the people's
   * messages the intent shows: this turn's calls follow the last one.
   */
  earlier?: { calls: EarlierCall[], afterMessage: number }
  exposure: (messages: ModelMessage[]) => Exposure
  /**
   * Whether the turn's credit budget is spent (R16). The loop checks it between steps only; a script's calls run
   * inside one step, each review spending credits, so a nested call checks it first and is denied once it is.
   */
  budgetSpent?: () => boolean
}): ReviewGate => {
  const breaker = createReviewBreaker()
  const records = new Map<string, ReviewRecord>()
  // Scanned tools whose output entered a script this turn: not in any step's messages, a script's own result
  // being the script's.
  const nestedScanned = new Set<string>()
  // The messages of the latest step, for nested calls: the context their script was written in.
  let stepMessages: ModelMessage[] = opts.history
  // This turn's reviewed calls, in order, as decided: the next review sees them after the earlier turns' ones.
  const turnCalls: EarlierCall[] = []

  const toolOf = (toolName: string): GateTool | undefined => {
    const tools = opts.tools()
    return Object.hasOwn(tools, toolName) ? tools[toolName] : undefined
  }

  const exposureFor = (messages: ModelMessage[]): Exposure => {
    const base = opts.exposure(messages)
    if (!nestedScanned.size) return base
    return { exposed: true, tools: [...new Set([...base.tools, ...nestedScanned])] }
  }

  // `nested`: a script's call. In a chat it asks a person as a direct call does (its script pauses); it differs in
  // being checked against the budget first, the loop's own check running between steps only.
  const review = async (toolCallId: string, toolName: string, tool: GateTool & { review: NonNullable<GateTool['review']> }, input: unknown, messages: ModelMessage[], nested: boolean) => {
    const call: ProposedCall = {
      toolName,
      ...(tool.server ? { server: tool.server } : {}),
      ...(tool.title ? { title: tool.title } : {}),
      ...(tool.annotations ? { annotations: tool.annotations } : {}),
      ...(tool.checked && Object.keys(tool.checked).length ? { checked: tool.checked } : {}),
      input,
      cls: tool.review.cls,
      kind: tool.review.kind
    }
    // ONCE TRIPPED, every further reviewed call is denied unreviewed: the turn stops after its step, but a running
    // script, or the step's later calls, would otherwise go on trying variants until one is allowed. Not counted.
    const settle = (record: ReviewRecord) => {
      records.set(toolCallId, record)
      // Unsure goes to a person only in a chat; an allow goes to one on the reviewer+person route.
      const awaitingPerson = opts.surface === 'chat' && asksPerson(record, tool.review.route)
      turnCalls.push(earlierCallOfRecord(toolName, input, record, { awaitingPerson, inScript: nested, afterMessage: opts.earlier?.afterMessage ?? 0 }))
      return record
    }
    if (breaker.tripped) {
      return settle({ outcome: 'deny', reason: BREAKER_TRIPPED_REASON, code: 'breaker-tripped', exposed: exposureFor(messages).exposed, at: new Date().toISOString() })
    }
    if (nested && opts.budgetSpent?.()) {
      return settle({ outcome: 'deny', reason: BUDGET_SPENT_REASON, code: 'budget', exposed: exposureFor(messages).exposed, at: new Date().toISOString() })
    }
    const earlierCalls = [...(opts.earlier?.calls ?? []), ...turnCalls]
    const reviewed = await opts.review(call, exposureFor(messages), earlierCalls)
    // The same call as a card the person left undecided goes to a person again, whatever the reviewer now says
    // (ReviewRecord.personAgain). Only in a chat, the one place a card can be left undecided.
    const again = opts.surface === 'chat' && reviewed.outcome === 'allow' &&
      earlierCalls.some(earlier => earlier.decision === 'undecided-by-person' && earlier.toolName === toolName && isDeepStrictEqual(earlier.input, input))
    const record = settle(again ? { ...reviewed, personAgain: true } : reviewed)
    // A failed review is no judgment at all: it neither counts as a denial nor ends a run of them. An unsure counts
    // as a denial where it denies (a task run): variants retried there are refused all the same.
    if (record.code !== 'review-failed') breaker.count(record, opts.surface === 'task')
    return record
  }

  const toolApproval: ToolApprovalConfiguration<ToolSet, any> = async ({ toolCall, messages }) => {
    stepMessages = messages
    const { toolCallId, toolName, input } = toolCall
    if (goneApprovedToolNames(opts.history, opts.tools()).includes(toolName)) return { type: 'denied', reason: TOOL_NO_LONGER_AVAILABLE }
    if (approvedIn(messages, toolCallId)) return { type: 'user-approval' }
    const tool = toolOf(toolName)
    // A function-form needsApproval is not resolved here: any one set counts as asking, which fails safe (a card).
    // None of this service's tools has one; resolving it would need the SDK's own tool context.
    if (!tool?.review) return tool?.needsApproval ? { type: 'user-approval' } : { type: 'not-applicable' }
    const record = await review(toolCallId, toolName, tool as GateTool & { review: NonNullable<GateTool['review']> }, input, messages, false)
    return statusOf(record, tool.review.route, opts.surface)
  }

  return {
    toolApproval,
    async reviewNested (toolCallId, toolName, input) {
      const tool = toolOf(toolName)
      // The wrapper reviews only reviewed tools: anything else reaching here is a wiring mistake, refused.
      if (!tool?.review) throw new Error(`${toolName} is not a reviewed tool`)
      return await review(toolCallId, toolName, tool as GateTool & { review: NonNullable<GateTool['review']> }, input, stepMessages, true)
    },
    noteNested (toolName) {
      if (isScanned(toolName, toolOf(toolName)?.annotations)) nestedScanned.add(toolName)
    },
    recordOf: (toolCallId) => records.get(toolCallId),
    get tripped () { return breaker.tripped }
  }
}

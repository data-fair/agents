/**
 * RESUMING A SCRIPT THE PERSON DECIDED ON (docs/architecture/code-mode.md, "A call that needs a person"): before an
 * approval run's first step, each code_mode call of the previous message that paused on a call needing a person,
 * and whose card was decided, is resumed from its stored continuation, through the turn's own code_mode tool.
 *
 * Not through the SDK's replay of approvals: the SDK would run the script afresh, and the approval it would find is
 * not one it issued (no signature: it would refuse the run). So the call is settled here, on the earlier message,
 * and the turn's history is patched to read the settled call, before streamText sees it.
 */
import { convertToModelMessages, type ModelMessage, type Tool } from 'ai'
import type { CodeModeApprovalInterrupt } from '@ai-sdk/code-mode'
import type { MessagePart } from '@agents/shared/message-parts'
import type { TurnScriptPauses } from './turn-target.ts'
import type { ScriptPauses, TurnCalls } from '../code-mode/code-tools.ts'
import { SCRIPT_RESUME_FAILED_MESSAGE } from '../code-mode/operations.ts'
import { resultSettlement, errorSettlement, type CallSettlement } from './parts-recorder.ts'
import { withMediaOutputs } from './operations.ts'

type ToolPart = Extract<MessagePart, { type: 'dynamic-tool' }>

/**
 * The stored call's metadata, without what belonged to its last card: what a card adds (`nested`, its review,
 * description and files) is replaced for the call the script stopped at now, and a decision is the earlier one's.
 */
export const callMetadataBeforeCard = (toolMetadata: unknown): Record<string, unknown> => {
  const { nested, review: _r, description: _d, files: _f, decision, earlierDecisions, ...rest } = (toolMetadata ?? {}) as Record<string, unknown>
  // The decision just made stays on the record, with the call it was on: the earlier cards of the same script.
  const kept = Array.isArray(earlierDecisions) ? earlierDecisions : []
  return { ...rest, ...(decision ? { earlierDecisions: [...kept, { ...(decision as object), ...(nested ? { nested } : {}) }] } : kept.length ? { earlierDecisions: kept } : {}) }
}

/**
 * The history read again with the settled call in place of its approval: the request removed from the assistant
 * message, the response replaced by the call's result, as convertToModelMessages renders a settled call. In place:
 * the gate and streamText hold this array.
 */
export const patchSettledScript = async (history: ModelMessage[], part: ToolPart, settled: CallSettlement): Promise<void> => {
  const approvalId = (part as { approval?: { id?: string } }).approval?.id
  const settledPart = { type: 'dynamic-tool', toolName: part.toolName, toolCallId: part.toolCallId, input: part.input, ...settled }
  const converted = await convertToModelMessages([{ role: 'assistant', parts: [settledPart as any] }])
  const toolMessage = converted.map(withMediaOutputs).find(message => message.role === 'tool')
  const result = Array.isArray(toolMessage?.content) ? toolMessage.content.find((p: any) => p.type === 'tool-result') : undefined
  for (const message of history) {
    if (!Array.isArray(message.content)) continue
    if (message.role === 'assistant') {
      message.content = (message.content as any[]).filter(p => !(p.type === 'tool-approval-request' && p.approvalId === approvalId)) as any
    } else if (message.role === 'tool') {
      message.content = (message.content as any[]).flatMap(p => p.type === 'tool-approval-response' && p.approvalId === approvalId ? (result ? [result] : []) : [p]) as any
    }
  }
}

export interface ResumeContext {
  store: TurnScriptPauses
  pauses: ScriptPauses
  /**
   * What a resumed script used before its pause is this turn's too (ScriptSpent): `run` answers those calls from its
   * record, through none of the wrappers that count them. Its calls count against this turn's bound, and the tools
   * whose output it read make this turn exposed for the reviewer (`noteNested`), as they made the paused one.
   */
  turnCalls: TurnCalls
  noteNested?: (toolName: string) => void
  /** The turn's code_mode tool, as the model's calls run it (envelope, screen, trace): absent when not offered. */
  codeTool: () => Tool | undefined
  history: ModelMessage[]
  abortSignal: AbortSignal
  /** Where a resumed script's trace goes: its earlier calls first, the whole stored on the earlier message. */
  earlierTraces: Map<string, MessagePart[]>
  /** The settled call as stored: a withheld result's trip record merged, as for a call of the turn. */
  settlement: (toolCallId: string, settled: CallSettlement) => CallSettlement
  settle: (toolCallId: string, settled: CallSettlement) => Promise<void>
  /** A card's metadata for the call a script stopped at. */
  cardMetadata: (interrupt: CodeModeApprovalInterrupt) => Promise<Record<string, unknown>>
  /** Until the earlier trace writes the resumed scripts started have landed. */
  traceWrites: () => Promise<void>
}

/** Resume every decided pause. Returns the tool a resumed script paused on again, if one did: the turn stops there. */
export const resumeDecidedScripts = async (ctx: ResumeContext): Promise<{ repausedOn?: string }> => {
  const decided = await ctx.store.decided()
  let repausedOn: string | undefined
  for (const { part, interrupt, earlierDecisions, trace, spent } of decided) {
    const approval = (part as { approval?: { approved?: boolean, reason?: string } }).approval
    const codeTool = ctx.codeTool()
    let settled: CallSettlement
    if (!interrupt || !codeTool?.execute) {
      settled = { state: 'output-error', errorText: SCRIPT_RESUME_FAILED_MESSAGE }
    } else {
      // Every decision of this continuation, the earlier ones of calls pending with it included.
      const latest = { toolCallId: interrupt.toolCallId, approved: approval?.approved === true, ...(approval?.reason ? { reason: approval.reason } : {}) }
      ctx.pauses.resumes.set(part.toolCallId, { interrupt, decisions: [...earlierDecisions, latest] })
      ctx.earlierTraces.set(part.toolCallId, trace)
      if (spent) {
        ctx.pauses.spent.set(part.toolCallId, { calls: spent.calls, bytes: spent.bytes, ran: [...spent.ran] })
        ctx.turnCalls.count += spent.calls
        for (const toolName of spent.ran) ctx.noteNested?.(toolName)
      }
      try {
        settled = resultSettlement(await codeTool.execute(part.input, { toolCallId: part.toolCallId, messages: ctx.history, abortSignal: ctx.abortSignal } as any))
      } catch (err) {
        if (ctx.abortSignal.aborted) throw err
        const again = ctx.pauses.paused.get(part.toolCallId)
        if (again) {
          // PAUSED AGAIN: the same call asks once more, for the call the script stopped at now. Nothing else of
          // this turn runs: its step's other approved calls wait for that decision too (settleApprovedWithoutResult).
          ctx.pauses.paused.delete(part.toolCallId)
          await ctx.store.repause(part.toolCallId, { approvalId: again.interruptId, toolMetadata: { ...callMetadataBeforeCard(part.toolMetadata), ...await ctx.cardMetadata(again) } })
          repausedOn = again.toolName
          continue
        }
        settled = errorSettlement(err)
      } finally {
        ctx.pauses.resumes.delete(part.toolCallId)
      }
    }
    const stored = ctx.settlement(part.toolCallId, settled)
    await ctx.settle(part.toolCallId, stored)
    await ctx.store.drop(part.toolCallId)
    await patchSettledScript(ctx.history, part, stored)
  }
  await ctx.traceWrites()
  return repausedOn ? { repausedOn } : {}
}

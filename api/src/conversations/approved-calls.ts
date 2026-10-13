/**
 * Approved calls the turn can no longer run.
 *
 * A call the person approved is replayed by the SDK at the start of the continuing turn. AI SDK 6 refused to
 * run one whose tool was no longer offered (the agent's class for it was set to `deny` since) and answered it
 * with a denial; 7 silently skips it, leaving an approved call with no result after it — which the provider
 * then rejects. The SDK's `toolApproval` option can deny by tool name, so the names are found here.
 */
import type { ModelMessage, ToolApprovalConfiguration, ToolSet } from 'ai'

export const TOOL_NO_LONGER_AVAILABLE = 'this tool is no longer available'

/** Names of the tools of calls approved in `history` that have no result yet and are not in `tools`. */
export const goneApprovedToolNames = (history: ModelMessage[], tools: Record<string, unknown>): string[] => {
  const nameOfCall = new Map<string, string>()
  const callOfApproval = new Map<string, string>()
  const approved = new Set<string>()
  const answered = new Set<string>()
  for (const message of history) {
    if (typeof message.content === 'string') continue
    for (const part of message.content as any[]) {
      if (part.type === 'tool-call') nameOfCall.set(part.toolCallId, part.toolName)
      else if (part.type === 'tool-approval-request') callOfApproval.set(part.approvalId, part.toolCallId)
      else if (part.type === 'tool-approval-response' && part.approved) approved.add(part.approvalId)
      else if (part.type === 'tool-result') answered.add(part.toolCallId)
    }
  }
  const gone = new Set<string>()
  for (const approvalId of approved) {
    const callId = callOfApproval.get(approvalId)
    const name = callId && !answered.has(callId) ? nameOfCall.get(callId) : undefined
    if (name && !Object.hasOwn(tools, name)) gone.add(name)
  }
  return [...gone]
}

/** The `toolApproval` option denying those tools, so the SDK answers their calls instead of dropping them. */
export const denyGoneApprovedTools = (history: ModelMessage[], tools: Record<string, unknown>): ToolApprovalConfiguration<ToolSet, any> =>
  Object.fromEntries(goneApprovedToolNames(history, tools).map(name => [name, { type: 'denied' as const, reason: TOOL_NO_LONGER_AVAILABLE }]))

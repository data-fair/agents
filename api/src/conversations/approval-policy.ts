/**
 * operations-style module: pure, no #mongo / #config.
 *
 * The approval policy of a configured autonomous agent: which of its catalog tools need a person's
 * approval before they run, which it may use freely, and which it never sees. Keyed on the class an MCP
 * tool declares through its annotations, so the rule keeps holding as the catalog grows — "never call
 * anything destructive without asking" is not expressible per tool name.
 */
import type { ToolSet } from './operations.ts'
import { DEFAULT_APPROVALS, type ApprovalClass, type ApprovalPolicy, type Approvals } from '@agents/shared/approval-policy'

export { DEFAULT_APPROVALS, type ApprovalClass, type ApprovalPolicy, type Approvals }

/** `destructiveHint` wins over a contradictory `readOnlyHint`; no annotation at all is a write. */
export const classifyTool = (annotations?: Record<string, unknown>): ApprovalClass => {
  if (annotations?.destructiveHint === true) return 'destructive'
  if (annotations?.readOnlyHint === true) return 'readOnly'
  return 'write'
}

export const resolveApproval = (cls: ApprovalClass, approvals?: Approvals): ApprovalPolicy =>
  approvals?.[cls] ?? DEFAULT_APPROVALS[cls]

/**
 * The tool set the model is offered under a policy: `deny` removes a tool (the model never spends a step
 * discovering it cannot use it), `approve` sets the AI SDK's `needsApproval` (the SDK then stops the turn
 * on a call instead of executing it), `allow` leaves the tool exactly as it was.
 */
export const applyApprovalPolicy = (tools: ToolSet, approvals?: Approvals): ToolSet => {
  const gated: ToolSet = {}
  for (const [name, sourced] of Object.entries(tools)) {
    const policy = resolveApproval(classifyTool(sourced.annotations), approvals)
    if (policy === 'deny') continue
    gated[name] = policy === 'approve' ? { ...sourced, tool: { ...sourced.tool, needsApproval: true } } : sourced
  }
  return gated
}

/**
 * The tool set of an UNATTENDED turn (a planned task's run): every tool needing approval is dropped,
 * whatever made it so — the policy (applyApprovalPolicy) or the tool itself (a service tool's own
 * `needsApproval`). Nobody is there to decide, so a gated call could only end the turn on a card no one
 * will ever see.
 */
export const unattended = (tools: ToolSet): ToolSet =>
  Object.fromEntries(Object.entries(tools).filter(([, sourced]) => !sourced.tool.needsApproval))

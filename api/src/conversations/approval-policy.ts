/**
 * operations-style module: pure, no #mongo / #config.
 *
 * The approval policy of a configured autonomous agent: which of its catalog tools need a person's
 * approval before they run, which it may use freely, and which it never sees. Keyed on the class an MCP
 * tool declares through its annotations, so the rule keeps holding as the catalog grows — "never call
 * anything destructive without asking" is not expressible per tool name.
 */
import type { Tool } from 'ai'
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
export const applyApprovalPolicy = (
  tools: Record<string, Tool>,
  annotationsByTool: Map<string, Record<string, unknown>>,
  approvals?: Approvals
): Record<string, Tool> => {
  const gated: Record<string, Tool> = {}
  for (const [name, tool] of Object.entries(tools)) {
    const policy = resolveApproval(classifyTool(annotationsByTool.get(name)), approvals)
    if (policy === 'deny') continue
    gated[name] = policy === 'approve' ? { ...tool, needsApproval: true } : tool
  }
  return gated
}

/**
 * The tool set of an UNATTENDED turn (a planned task's run): only what the policy lets the agent use
 * freely. A tool needing approval is dropped rather than gated — nobody is there to decide, so a gated
 * call could only end the turn on a card no one will ever see — and a denied one is dropped as always.
 */
export const withoutGatedTools = (
  tools: Record<string, Tool>,
  annotationsByTool: Map<string, Record<string, unknown>>,
  approvals?: Approvals
): Record<string, Tool> => {
  const allowed: Record<string, Tool> = {}
  for (const [name, tool] of Object.entries(tools)) {
    if (resolveApproval(classifyTool(annotationsByTool.get(name)), approvals) === 'allow') allowed[name] = tool
  }
  return allowed
}

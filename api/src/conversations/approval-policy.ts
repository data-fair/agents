/**
 * operations-style module: pure, no #mongo / #config.
 *
 * The approval policy of a configured autonomous agent: which of its catalog tools need a person's
 * approval before they run, which it may use freely, and which it never sees. Keyed on the class an MCP
 * tool declares through its annotations, so the rule keeps holding as the catalog grows — "never call
 * anything destructive without asking" is not expressible per tool name.
 */
import type { Tool } from 'ai'

export type ApprovalClass = 'readOnly' | 'write' | 'destructive'
export type ApprovalPolicy = 'allow' | 'approve' | 'deny'
export type Approvals = Partial<Record<ApprovalClass, ApprovalPolicy>>

/**
 * Destructive tools are gated out of the box; the others are not. A write gated by default would gate
 * every tool of every server that declares no annotations — most of them — and teach people to click
 * Approve without reading.
 */
export const DEFAULT_APPROVALS: Record<ApprovalClass, ApprovalPolicy> = { readOnly: 'allow', write: 'allow', destructive: 'approve' }

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

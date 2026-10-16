/**
 * The approval level of a configured autonomous agent, and what it means for each class of tool. In
 * shared/ because the server applies it to every turn and the admin page diffs against its default: one
 * copy, so the default a page shows is the one a turn applies.
 */

export type ApprovalClass = 'readOnly' | 'write' | 'destructive'
export type ApprovalPolicy = 'allow' | 'approve'
/** Which operations wait for a person's approval: every one that makes changes, only the destructive ones, or none. */
export type ApprovalLevel = 'write' | 'destructive' | 'none'

export const APPROVAL_LEVELS: ApprovalLevel[] = ['write', 'destructive', 'none']

/**
 * Destructive tools are gated out of the box; writes are not. A write gated by default would gate every
 * tool of every server that declares no annotations — most of them — and teach people to click Approve
 * without reading.
 */
export const DEFAULT_APPROVAL_LEVEL: ApprovalLevel = 'destructive'

/** Reads are never gated; the level says how far the gate reaches among the other classes. */
export const approvalPolicyFor = (cls: ApprovalClass, level: ApprovalLevel = DEFAULT_APPROVAL_LEVEL): ApprovalPolicy => {
  if (cls === 'readOnly' || level === 'none') return 'allow'
  if (cls === 'destructive') return 'approve'
  return level === 'write' ? 'approve' : 'allow'
}

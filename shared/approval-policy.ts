/**
 * The approval levels of a configured autonomous agent, and their defaults. In shared/ because the
 * server applies them to every turn and the agent page's form diffs against them: one copy, so the
 * defaults a page shows are the ones a turn applies.
 */

export type ApprovalClass = 'readOnly' | 'write' | 'destructive'
export type ApprovalPolicy = 'allow' | 'approve' | 'deny'
export type Approvals = Partial<Record<ApprovalClass, ApprovalPolicy>>

/**
 * Destructive tools are gated out of the box; the others are not. A write gated by default would gate
 * every tool of every server that declares no annotations — most of them — and teach people to click
 * Approve without reading.
 */
export const DEFAULT_APPROVALS: Record<ApprovalClass, ApprovalPolicy> = { readOnly: 'allow', write: 'allow', destructive: 'approve' }

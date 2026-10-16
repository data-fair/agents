/**
 * operations-style module: pure, no #mongo / #config.
 *
 * The approval level of a configured autonomous agent: which of its catalog tools need a person's
 * approval before they run, and which it may use freely. Keyed on the class an MCP
 * tool declares through its annotations, so the rule keeps holding as the catalog grows — "never call
 * anything destructive without asking" is not expressible per tool name.
 */
import type { ToolSet } from './operations.ts'
import { approvalPolicyFor, type ApprovalClass, type ApprovalLevel, type ApprovalPolicy } from '@agents/shared/approval-policy'

export { approvalPolicyFor, type ApprovalClass, type ApprovalLevel, type ApprovalPolicy }

/** `destructiveHint` wins over a contradictory `readOnlyHint`; no annotation at all is a write. */
export const classifyTool = (annotations?: Record<string, unknown>): ApprovalClass => {
  if (annotations?.destructiveHint === true) return 'destructive'
  if (annotations?.readOnlyHint === true) return 'readOnly'
  return 'write'
}

/**
 * The tool set the model is offered under a level: no tool is ever removed here. `approve` sets the AI
 * SDK's `needsApproval` (the SDK then stops the turn on a call instead of executing it), `allow` leaves
 * the tool exactly as it was.
 */
export const applyApprovalPolicy = (tools: ToolSet, level?: ApprovalLevel): ToolSet => {
  const gated: ToolSet = {}
  for (const [name, sourced] of Object.entries(tools)) {
    const policy = approvalPolicyFor(classifyTool(sourced.annotations), level)
    gated[name] = policy === 'approve' ? { ...sourced, tool: { ...sourced.tool, needsApproval: true } } : sourced
  }
  return gated
}

/**
 * The personal assistant's catalog tools. It acts as the person, through their own session, so every
 * change it makes is theirs: anything that is not a read waits for their approval, a write as much as a
 * destructive call — unlike a configured agent, whose administrator chose what it may do alone. An
 * anonymous visitor is offered reads only, since nobody signed in is there to decide on a card.
 */
export const personalAssistantTools = (tools: ToolSet, opts: { anonymous: boolean }): ToolSet => {
  const gated = applyApprovalPolicy(tools, 'write')
  return opts.anonymous ? unattended(gated) : gated
}

/**
 * The tool set of an UNATTENDED turn (a planned task's run): every tool needing approval is dropped,
 * whatever made it so — the policy (applyApprovalPolicy) or the tool itself (a service tool's own
 * `needsApproval`). Nobody is there to decide, so a gated call could only end the turn on a card no one
 * will ever see.
 */
export const unattended = (tools: ToolSet): ToolSet =>
  Object.fromEntries(Object.entries(tools).filter(([, sourced]) => !sourced.tool.needsApproval))

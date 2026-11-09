/**
 * operations-style module: pure, no #mongo / #config.
 *
 * The approval routes of a configured autonomous agent: which of its catalog tools the reviewer judges
 * alone, and which it judges before a person decides (api/src/approval-review). Keyed on the class an MCP
 * tool declares through its annotations, so the rule keeps holding as the catalog grows — "never call
 * anything destructive without asking" is not expressible per tool name.
 */
import type { ToolSet } from './operations.ts'
import { routeFor, type ApprovalClass, type ApprovalRoutes, type ReviewRoute } from '@agents/shared/approval-policy'

export { routeFor, type ApprovalClass, type ApprovalRoutes, type ReviewRoute }

/** `destructiveHint` wins over a contradictory `readOnlyHint`; no annotation at all is a write. */
export const classifyTool = (annotations?: Record<string, unknown>): ApprovalClass => {
  if (annotations?.destructiveHint === true) return 'destructive'
  if (annotations?.readOnlyHint === true) return 'readOnly'
  return 'write'
}

/**
 * The tool set the model is offered under the routes: no tool is ever removed here. Every tool that is not
 * a read is marked `review` (the turn's review gate judges it before it runs); a `reviewer+person` one also
 * sets the AI SDK's `needsApproval`, so an unattended run and its scripts — where no person can decide — keep
 * excluding it (unattended, codeCallable); a chat's script pauses on it for the person. A read is left exactly as it was.
 */
export const applyApprovalPolicy = (tools: ToolSet, routes?: Partial<ApprovalRoutes>): ToolSet => {
  const gated: ToolSet = {}
  for (const [name, sourced] of Object.entries(tools)) {
    const cls = classifyTool(sourced.annotations)
    const route = routeFor(cls, routes)
    if (!route) {
      gated[name] = sourced
      continue
    }
    gated[name] = {
      ...sourced,
      review: { route, cls, kind: 'action' },
      ...(route === 'reviewer+person' ? { tool: { ...sourced.tool, needsApproval: true } } : {})
    }
  }
  return gated
}

/**
 * The personal assistant's catalog tools. It acts as the person, through their own session, so every
 * change it makes is theirs: anything that is not a read waits for their approval, a write as much as a
 * destructive call — unlike a configured agent, whose administrator chose its routes. It has no reviewer.
 * An anonymous visitor is offered reads only, since nobody signed in is there to decide on a card.
 */
export const personalAssistantTools = (tools: ToolSet, opts: { anonymous: boolean }): ToolSet => {
  const gated: ToolSet = Object.fromEntries(Object.entries(tools).map(([name, sourced]) =>
    [name, classifyTool(sourced.annotations) === 'readOnly' ? sourced : { ...sourced, tool: { ...sourced.tool, needsApproval: true } }]))
  return opts.anonymous ? unattended(gated) : gated
}

/**
 * The tool set of an UNATTENDED turn (a planned task's run): every tool needing approval is dropped,
 * whatever made it so — the routes (applyApprovalPolicy) or the tool itself (a service tool's own
 * `needsApproval`). Nobody is there to decide, so a gated call could only end the turn on a card no one
 * will ever see. The reviewer-routed tools stay: the reviewer decides them alone.
 */
export const unattended = (tools: ToolSet): ToolSet =>
  Object.fromEntries(Object.entries(tools).filter(([, sourced]) => !sourced.tool.needsApproval))

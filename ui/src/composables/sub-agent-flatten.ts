/**
 * Policy for the experimental "flatten sub-agents" mode: decide, per sub-agent, whether it
 * should be flattened into the main tool set or kept as a delegated ToolLoopAgent.
 *
 * Pure and dependency-free so it can be unit-tested in isolation (the rest of the
 * orchestration in use-agent-chat.ts pulls in browser/Vue/AI-SDK deps).
 */

export interface SubAgentFlattenConfig {
  /** Model role; lib-vue materializes the default to 'tools', so a non-'tools' value is an explicit pin. */
  model?: string
  /** Explicit opt-out: keep delegated even when flattening is on. Overrides the model heuristic. */
  delegateOnly?: boolean
}

/**
 * Returns true when this sub-agent should be flattened (exposed as a no-arg guidance tool
 * with its reserved tools surfaced directly on the main agent), false when it should stay
 * delegated.
 *
 * - When the global toggle is off, nothing flattens.
 * - A sub-agent opts out of flattening (stays delegated) when it pins a non-default model —
 *   flattening would discard its model routing and, for producer sub-agents, invert the
 *   "delegate then receive a deliverable" contract a host prompt may rely on.
 * - An explicit `delegateOnly` on the config overrides the heuristic in either direction.
 */
export function shouldFlattenSubAgent (config: SubAgentFlattenConfig, flatten: boolean): boolean {
  if (!flatten) return false
  const stayDelegated = config.delegateOnly ?? (config.model !== undefined && config.model !== 'tools')
  return !stayDelegated
}

/**
 * Initial configuration handed from the host page to the chat iframe.
 *
 * This is one-shot "set then get" same-origin state: the host writes it once
 * before the iframe loads, the iframe reads it once on mount. It is NOT a
 * reactive channel — later changes are not propagated to a running agent.
 *
 * Extend this object as more initial settings are needed.
 */
export interface AgentInitConfig {
  /**
   * Which standard agent to talk to, by id.
   *
   * This replaces the free-text `prompt` below. A persona is product voice and belongs in
   * configuration: with the loop running on the server, prose supplied by the host would be the one
   * remaining piece of CLIENT-CONTROLLED INSTRUCTION in an otherwise server-held loop — and on one path
   * it arrived from a URL query parameter. Naming an agent keeps what hosts used it for and moves the
   * text to where it cannot be tampered with.
   */
  agentId?: string
  /**
   * @deprecated Use `agentId`. Ignored, and warned about once, rather than silently dropped — a host
   * that has not migrated would otherwise lose its persona with no signal at all.
   */
  prompt?: string
  /** Title shown in the chat header. */
  title?: string
}

const INIT_CONFIG_PREFIX = 'df-agent-init-config:'

/** Store the agent's initial configuration under the given key (same-origin sessionStorage). */
export function setAgentInitConfig (key: string, config: AgentInitConfig): void {
  sessionStorage.setItem(INIT_CONFIG_PREFIX + key, JSON.stringify(config))
}

/** Read the initial configuration written by the host for the given key, if any. */
export function getAgentInitConfig (key: string): AgentInitConfig | undefined {
  const raw = sessionStorage.getItem(INIT_CONFIG_PREFIX + key)
  if (!raw) return undefined
  try {
    return JSON.parse(raw) as AgentInitConfig
  } catch {
    return undefined
  }
}

let warnedAboutSystemPrompt = false

/**
 * Build the init config a host component writes, from its props.
 *
 * Exists so the `systemPrompt` deprecation lives in ONE place rather than in each of the three host
 * components (drawer, block, menu) — which is also what keeps the notice to one per page: a page may
 * legitimately mount one of each variant, and three copies of the same warning read like three bugs.
 *
 * `systemPrompt` is dropped, not translated into an agent id. There is no mapping from arbitrary prose
 * to a standard agent, and inventing one would quietly give a host a persona it never asked for.
 */
export function hostInitConfig (props: { agentId?: string, systemPrompt?: string, chatTitle?: string }): AgentInitConfig {
  if (props.systemPrompt !== undefined && !warnedAboutSystemPrompt) {
    warnedAboutSystemPrompt = true
    console.warn('[df-agents] the `systemPrompt` prop is ignored — pass `agentId` naming a standard agent instead. A persona is configuration now, not something a host supplies.')
  }
  return { agentId: props.agentId, title: props.chatTitle }
}

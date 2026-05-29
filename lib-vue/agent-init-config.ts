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
  /** System prompt prepended to the agent's context. */
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

// Experimental chat flags, stored positively (matching the Settings checkboxes).
// Persisted in a cookie scoped to the agents service path so they ride along on
// every chat-completion call (the server records them onto stored traces) AND
// stay readable by readFlags() on the UI pages, so the toggles survive reloads.
// NOTE: keep this module free of `~/context` imports — it is imported by the
// unit-tested trace reconstruction layer. `writeFlags` takes apiPath from its caller.

export interface AgentFlags {
  toolExploration: boolean
  subAgents: boolean
  // Render delegations as a plain tool chip instead of an expandable trace
  // panel. On by default. Render-only — toggling it never resets the chat.
  simpleSubAgents: boolean
  mermaid: boolean
  // Show reasoning models' "thinking" as a foldable panel above each answer.
  // Off by default: the transient "Thinking…" activity line is the only feedback,
  // keeping the transcript lean. Render-only — toggling it never resets the chat.
  showReasoning: boolean
}

export const FLAGS_COOKIE = 'agent-chat-flags'
export const DEFAULT_FLAGS: AgentFlags = { toolExploration: false, subAgents: true, simpleSubAgents: true, mermaid: false, showReasoning: false }

export function readFlags (cookieString = document.cookie): AgentFlags {
  for (const part of cookieString.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k !== FLAGS_COOKIE) continue
    try {
      const v = JSON.parse(decodeURIComponent(rest.join('=')))
      if (v && typeof v === 'object') {
        return { toolExploration: !!v.toolExploration, subAgents: v.subAgents !== false, simpleSubAgents: v.simpleSubAgents !== false, mermaid: !!v.mermaid, showReasoning: !!v.showReasoning }
      }
    } catch { /* fall through to defaults */ }
  }
  return { ...DEFAULT_FLAGS }
}

export function serializeFlagsCookie (flags: AgentFlags, apiPath: string): string {
  const v = encodeURIComponent(JSON.stringify(flags))
  // Scope to the agents service root ("…/agents"), derived by dropping the "/api"
  // suffix, rather than the narrower gateway endpoint: this keeps the cookie off
  // sibling stack services while letting the UI pages read it back on load.
  const servicePath = apiPath.replace(/\/api$/, '')
  return `${FLAGS_COOKIE}=${v}; Max-Age=31536000; Path=${servicePath}; SameSite=Lax`
}

export function writeFlags (flags: AgentFlags, apiPath: string): void {
  document.cookie = serializeFlagsCookie(flags, apiPath)
}

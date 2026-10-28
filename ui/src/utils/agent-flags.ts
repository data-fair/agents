// Experimental chat flags, stored positively (matching the Settings checkboxes).
// Persisted in a cookie scoped to the agents service path, readable by readFlags() on the UI pages,
// so the toggles survive reloads. `writeFlags` takes apiPath from its caller, so this module needs
// no `~/context` import.

export interface AgentFlags {
  mermaid: boolean
  // Show reasoning models' "thinking" as a foldable panel above each answer.
  // Off by default: the transient "Thinking…" activity line is the only feedback,
  // keeping the transcript lean. Render-only — toggling it never resets the chat.
  showReasoning: boolean
}

export const FLAGS_COOKIE = 'agent-chat-flags'
export const DEFAULT_FLAGS: AgentFlags = { mermaid: false, showReasoning: false }

export function readFlags (cookieString = document.cookie): AgentFlags {
  for (const part of cookieString.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k !== FLAGS_COOKIE) continue
    try {
      const v = JSON.parse(decodeURIComponent(rest.join('=')))
      if (v && typeof v === 'object') {
        return { mermaid: !!v.mermaid, showReasoning: !!v.showReasoning }
      }
    } catch { /* fall through to defaults */ }
  }
  return { ...DEFAULT_FLAGS }
}

export function serializeFlagsCookie (flags: AgentFlags, apiPath: string): string {
  const v = encodeURIComponent(JSON.stringify(flags))
  // Scope to the agents service root ("…/agents"), derived by dropping the "/api"
  // suffix, rather than a narrower API path: this keeps the cookie off
  // sibling stack services while letting the UI pages read it back on load.
  const servicePath = apiPath.replace(/\/api$/, '')
  return `${FLAGS_COOKIE}=${v}; Max-Age=31536000; Path=${servicePath}; SameSite=Lax`
}

export function writeFlags (flags: AgentFlags, apiPath: string): void {
  document.cookie = serializeFlagsCookie(flags, apiPath)
}

// Experimental chat flags, stored positively (matching the Settings checkboxes).
// Persisted in a cookie scoped to the gateway path so they ride along on every
// chat-completion call and the server can record them onto stored traces.
// NOTE: keep this module free of `~/context` imports — it is imported by the
// unit-tested trace reconstruction layer. `writeFlags` takes apiPath from its caller.

export interface AgentFlags {
  toolExploration: boolean
  subAgents: boolean
  mermaid: boolean
}

export const FLAGS_COOKIE = 'agent-chat-flags'
export const DEFAULT_FLAGS: AgentFlags = { toolExploration: false, subAgents: true, mermaid: false }

export function readFlags (cookieString = document.cookie): AgentFlags {
  for (const part of cookieString.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k !== FLAGS_COOKIE) continue
    try {
      const v = JSON.parse(decodeURIComponent(rest.join('=')))
      if (v && typeof v === 'object') {
        return { toolExploration: !!v.toolExploration, subAgents: v.subAgents !== false, mermaid: !!v.mermaid }
      }
    } catch { /* fall through to defaults */ }
  }
  return { ...DEFAULT_FLAGS }
}

export function serializeFlagsCookie (flags: AgentFlags, apiPath: string): string {
  const v = encodeURIComponent(JSON.stringify(flags))
  return `${FLAGS_COOKIE}=${v}; Max-Age=31536000; Path=${apiPath}/gateway; SameSite=Lax`
}

export function writeFlags (flags: AgentFlags, apiPath: string): void {
  document.cookie = serializeFlagsCookie(flags, apiPath)
}

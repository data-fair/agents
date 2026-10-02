/**
 * The name and the accepted value of the trace-consent cookie.
 *
 * Shared because both ends of the socket must agree on it: the browser writes it when the person
 * answers the consent sheet, and the server reads it off the websocket UPGRADE request to decide
 * whether this person's turns may be recorded as admin-visible traces.
 *
 * A literal in two places is exactly how a consent gate silently stops gating — the browser would
 * keep writing `agent-chat-trace-consent` while the server read something else, every read would
 * return "no consent", and the only symptom would be traces quietly never being stored (or, with the
 * polarity the other way round, always being stored).
 */
export const CONSENT_COOKIE = 'agent-chat-trace-consent'

/**
 * The one value that means yes.
 *
 * Checked exactly, never truthily: "no" is also a non-empty string, and a consent gate that treats
 * any value as agreement is not a gate. Absent, unparseable and unrecognised all mean no, because
 * that is the right default for a question nobody answered.
 */
export const CONSENT_YES = 'yes'

/** Whether a Cookie header grants consent. Used by the server; the browser reads its own cookie. */
export function hasTraceConsent (cookieHeader?: string): boolean {
  if (!cookieHeader) return false
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name.trim() !== CONSENT_COOKIE) continue
    try {
      return decodeURIComponent(rest.join('=')) === CONSENT_YES
    } catch {
      // A malformed percent-escape is not consent.
      return false
    }
  }
  return false
}

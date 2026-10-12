import { ref } from 'vue'

/**
 * The review-consent cookie: this browser's own memory of the person's answer to the consent sheet.
 *
 * The server never reads it — the chat says what it holds over the agent session (`hello`,
 * `review-consent`; see use-session-chat.ts). The harnesses that stand in for a person (simulations, dev
 * fixtures, api tests) set the same cookie, so they import its name from here.
 */
export const CONSENT_COOKIE = 'agent-chat-trace-consent'

/**
 * The one value that means yes. Checked exactly, never truthily: "no" is also a non-empty string, and
 * absent, unparseable and unrecognised all mean no — the right default for a question nobody answered.
 */
export const CONSENT_YES = 'yes'

export type Consent = 'yes' | 'no'

// Reactive: set true when the agent session's `attached` frame says `reviewOffered` (see
// shared/agent-session-protocol.ts).
export const reviewOffered = ref(false)

export function readConsent (cookieString = document.cookie): Consent | undefined {
  for (const part of cookieString.split(';')) {
    const [k, v] = part.trim().split('=')
    if (k === CONSENT_COOKIE) return v === CONSENT_YES ? 'yes' : v === 'no' ? 'no' : undefined
  }
  return undefined
}

export function serializeConsentCookie (value: Consent): string {
  return `${CONSENT_COOKIE}=${value}; Max-Age=31536000; Path=/; SameSite=Lax`
}

// Shared module-level reactive ref so all consumers stay in sync.
// SSR-safe: document may be undefined during server-side rendering.
export const consentRef = ref<Consent | undefined>(typeof document !== 'undefined' ? readConsent() : undefined)

export function writeConsent (value: Consent): void {
  document.cookie = serializeConsentCookie(value)
  consentRef.value = value
}

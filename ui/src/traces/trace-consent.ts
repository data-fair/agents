import { ref } from 'vue'

export const CONSENT_COOKIE = 'agent-chat-trace-consent'
export type Consent = 'yes' | 'no'

// Reactive: set true when the gateway advertises x-trace-storage: available.
export const traceStorageAvailable = ref(false)

export function readConsent (cookieString = document.cookie): Consent | undefined {
  for (const part of cookieString.split(';')) {
    const [k, v] = part.trim().split('=')
    if (k === CONSENT_COOKIE) return v === 'yes' ? 'yes' : v === 'no' ? 'no' : undefined
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

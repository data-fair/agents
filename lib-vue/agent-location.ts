/**
 * Where the person is, published the same way by every host.
 *
 * Nothing in this library tracks navigation on its own — a host publishes what
 * it knows, and retention then puts it in the activation snapshot. Every host
 * with a router wants the same thing, so it was being written out by hand each
 * time; this is that code, once.
 *
 * The absolute `url` is the reason it is worth a helper. A judged run had the
 * assistant hand the person a relative path, which the chat rendered as inert
 * plain text — not even a broken link — while the absolute URL sat unused in the
 * host-state block of the very same request. Deriving it here means a host
 * cannot publish a location the model can only turn into a dead end.
 */
import { toValue, type MaybeRefOrGetter } from 'vue'
import { useAgentState } from './host-events.js'

/** The key the chat retains locations under. One key, so the last one always wins. */
export const AGENT_LOCATION_KEY = 'location'

export interface AgentLocationInput {
  /** Route path, e.g. `/dataset/abc/table`. */
  path: string
  /** Absolute URL. Derived from `path` when omitted — supply it behind a path prefix or a different public origin. */
  url?: string
  /** What a person would call this page. */
  name?: string
  params?: Record<string, unknown>
  query?: Record<string, unknown>
  /** Trail to here; text only, blanks dropped. */
  breadcrumbs?: Array<string | { text?: string }>
}

export interface AgentLocation {
  path: string
  url?: string
  name?: string
  params?: Record<string, unknown>
  query?: Record<string, unknown>
  breadcrumbs?: string[]
}

const trimmed = (v: unknown): string | undefined => {
  const s = typeof v === 'string' ? v.trim() : ''
  return s.length ? s : undefined
}

const nonEmpty = (r: Record<string, unknown> | undefined): Record<string, unknown> | undefined =>
  r && Object.keys(r).length ? r : undefined

function absolute (path: string, origin: string | undefined): string | undefined {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(path)) return path
  if (!origin) return undefined
  try {
    return new URL(path, origin).href
  } catch {
    return undefined
  }
}

/** Pure, so a host can unit-test what it publishes without a browser. */
export function buildAgentLocation (input: AgentLocationInput, origin: string | undefined): AgentLocation {
  const state: AgentLocation = { path: input.path }
  const url = input.url ?? absolute(input.path, origin)
  if (url) state.url = url
  const name = trimmed(input.name)
  if (name) state.name = name
  const params = nonEmpty(input.params)
  if (params) state.params = params
  const query = nonEmpty(input.query)
  if (query) state.query = query
  const trail = (input.breadcrumbs ?? [])
    .map(b => trimmed(typeof b === 'string' ? b : b?.text))
    .filter((t): t is string => !!t)
  if (trail.length) state.breadcrumbs = trail
  return state
}

/**
 * Publish the current location as keyed state, and keep it current.
 *
 * ```ts
 * useAgentLocation(() => ({ path: route.path, name: pageTitle, params: route.params }))
 * ```
 */
export function useAgentLocation (source: MaybeRefOrGetter<AgentLocationInput>): void {
  if (typeof window === 'undefined') return
  const origin = window.location?.origin
  // useAgentState owns the watch and the scope cleanup, including withdrawing
  // the key when the page goes away.
  useAgentState(AGENT_LOCATION_KEY, () => buildAgentLocation(toValue(source), origin))
}

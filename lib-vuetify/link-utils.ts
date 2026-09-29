// Pure helper for resolving a link the agent emitted in chat prose into an in-app
// navigation decision. Kept free of vue-router/window so it can be unit-tested.
//
// Context: the chat renders in an iframe whose own URL (/agents/.../chat) is NOT the
// link target, so the iframe forwards the *raw* href the model wrote. Models frequently
// write app-relative links that omit the host's deployment base prefix (e.g.
// "/dataset/x/table", or even "dataset/x/table"). The host knows its router base, so it
// resolves such links here against that base — turning what used to be a broken full
// page reload into an in-SPA navigation.

export interface ResolvedLink {
  /** false when the link is not an http(s) URL (javascript:, data:, malformed…): never follow it */
  safe: boolean
  /** true when the link points to another origin and should leave the SPA entirely */
  external: boolean
  /** in-app router path (base prefix stripped); only meaningful when !external */
  path: string
  /** absolute URL to fall back to with a full navigation (external, or unmatched route) */
  url: string
}

const UNSAFE: ResolvedLink = { safe: false, external: false, path: '', url: '' }

export function resolveAgentLink (rawUrl: string, origin: string, base: string): ResolvedLink {
  let parsed: URL
  try {
    parsed = new URL(rawUrl, origin)
  } catch {
    return UNSAFE
  }
  // The href comes from model output (and whatever a page or a tool result made it write): a
  // javascript: URL assigned to the host's location runs in the host page, with the user's session.
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return UNSAFE
  if (parsed.origin !== origin) return { safe: true, external: true, path: '', url: parsed.href }

  const baseNoTrailing = base.endsWith('/') ? base.slice(0, -1) : base
  let pathname = parsed.pathname
  if (baseNoTrailing && (pathname === baseNoTrailing || pathname.startsWith(baseNoTrailing + '/'))) {
    pathname = pathname.slice(baseNoTrailing.length) || '/'
  }
  return { safe: true, external: false, path: pathname + parsed.search + parsed.hash, url: parsed.href }
}

/**
 * Minimal structural view of the bits of vue-router we need to decide a navigation.
 * Typed structurally (rather than importing vue-router) so this stays unit-testable.
 */
export interface AgentNavRouter {
  options: { history: { base: string } }
  resolve: (path: string) => { matched: unknown[] }
}

export interface NavDecision {
  /**
   * - spa: router.push(path)
   * - page: full navigation of the host page to url (same origin only)
   * - new-tab: open url in a new tab without an opener (another origin: the host page stays, and
   *   a link planted in the conversation cannot silently replace it with a look-alike)
   * - ignore: not an http(s) URL, do nothing
   */
  action: 'spa' | 'page' | 'new-tab' | 'ignore'
  path: string
  url: string
}

/**
 * Decide how to act on a `navigate` message from the chat iframe. With a router we
 * resolve the link against its base and stay in-SPA when it maps to a real route.
 * Without a router (the chat state can be created outside a component setup, where
 * useRouter() yields undefined) we degrade to a full navigation rather than crash.
 */
export function decideAgentNavigation (rawUrl: string, origin: string, router?: AgentNavRouter): NavDecision {
  const link = resolveAgentLink(rawUrl, origin, router ? router.options.history.base : '')
  if (!link.safe) return { action: 'ignore', path: '', url: '' }
  if (link.external) return { action: 'new-tab', path: '', url: link.url }
  const spa = !!router && router.resolve(link.path).matched.length > 0
  return { action: spa ? 'spa' : 'page', path: link.path, url: link.url }
}

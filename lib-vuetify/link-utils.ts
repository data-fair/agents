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
  /** true when the link points to another origin and should leave the SPA entirely */
  external: boolean
  /** in-app router path (base prefix stripped); only meaningful when !external */
  path: string
  /** absolute URL to fall back to with a full navigation (external, or unmatched route) */
  url: string
}

export function resolveAgentLink (rawUrl: string, origin: string, base: string): ResolvedLink {
  const parsed = new URL(rawUrl, origin)
  if (parsed.origin !== origin) return { external: true, path: '', url: rawUrl }

  const baseNoTrailing = base.endsWith('/') ? base.slice(0, -1) : base
  let pathname = parsed.pathname
  if (baseNoTrailing && (pathname === baseNoTrailing || pathname.startsWith(baseNoTrailing + '/'))) {
    pathname = pathname.slice(baseNoTrailing.length) || '/'
  }
  return { external: false, path: pathname + parsed.search + parsed.hash, url: parsed.href }
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
  /** true => navigate in-SPA via router.push(path); false => full page load to url */
  spa: boolean
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
  if (!router) {
    const link = resolveAgentLink(rawUrl, origin, '')
    return { spa: false, path: link.path, url: link.url }
  }
  const link = resolveAgentLink(rawUrl, origin, router.options.history.base)
  const spa = !link.external && router.resolve(link.path).matched.length > 0
  return { spa, path: link.path, url: link.url }
}

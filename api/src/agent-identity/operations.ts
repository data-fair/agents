/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 *
 * Who an agent acts as when it calls a tool — THE ONE PORT this design keeps.
 *
 * The two-platform spec made six things ports: history, tools, identity, model access, spend, output.
 * With a single loop, five have exactly one implementation, which is indirection with a cost and no
 * benefit. Identity genuinely has two:
 *
 *  - a configured agent acts as **itself**, through its own non-human identity (see ./service.ts, which
 *    needs the session cache and so cannot live here);
 *  - a personal assistant acts as **the person using it**, through their forwarded session (below).
 *
 * Deliberately narrow: this is the credential presented to a catalog MCP server and nothing else. Spend
 * attribution is a separate concern that joins the loop where it is used. Naming it `SessionProvider`
 * rather than `Identity` keeps that boundary visible.
 */

/**
 * Produces the cookie header for a catalog entry whose `auth` is `nhi-session`, or undefined when the
 * agent has no session to present.
 *
 * A function rather than a value, because the NHI case EXCHANGES on demand and caches: an agent whose
 * entries are all `none`/`apiKey` must perform no exchange at all, which a precomputed value could not
 * express.
 */
export type SessionProvider = () => Promise<string | undefined>

/**
 * A personal assistant acting as the person using it, with the session from their own socket.
 *
 * NOT REFRESHABLE, and that is the honest consequence rather than an oversight. The NHI path can
 * re-exchange when a session nears expiry; a forwarded cookie cannot be renewed server-side, because
 * only the browser can obtain a new one. So the credential's useful life is bounded by the socket's,
 * and a reconnect — which the browser does anyway — is what refreshes it. A tool call after expiry
 * fails with the upstream's own 401, which is the correct answer: the person's session really has
 * ended.
 *
 * The cookie is held per connection and never stored, logged or put in a prompt — the same rule the
 * NHI session follows.
 */
export const forwardedSessionProvider = (cookieHeader: string | undefined): SessionProvider =>
  async () => cookieHeader

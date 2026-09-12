# Compaction Relaxation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trigger history compaction on a percentage of the assistant model's context window instead of a hardcoded 24 000-character count, retain recent turns verbatim instead of collapsing history to two messages, and price cached input correctly.

**Architecture:** Context window and cache pricing are captured from provider model listings and snapshotted into settings when an admin picks a model, with a manual override per role. A new account-wide `compaction.percent` yields a token budget that the gateway advertises to the chat client via a response header. The client measures fill from the previous turn's provider-reported `usage.inputTokens` plus a character estimate of what was appended since, and delegates the whole compaction decision to a new pure module so it can be unit-tested.

**Tech Stack:** TypeScript, Express, Vue 3, MongoDB, Vercel AI SDK (`ai@6`, `@ai-sdk/openai-compatible`), JSON-schema-driven types (`npm run build-types`), Playwright (projects: `unit`, `api`, `e2e`).

**Spec:** `docs/superpowers/specs/2026-09-12-compaction-relaxation-design.md`

## Global Constraints

- Types are generated from JSON schemas. After editing `api/types/settings/schema.js` you MUST run `npm run build-types` before `npm run check-types` will pass. Import types from `#types`.
- `api/src/**/operations.ts` files are pure and stateless: no `#mongo`, no `#config`, no in-memory state, no imports other than other `operations.ts`. All new pure logic goes there or in `ui/src/utils/`.
- Quality gates, run before every commit: `npm run lint-fix`, then `npm run check-types`.
- Never start, stop, restart or kill any dev process or container. If a test fails with a connection error, run `bash dev/status.sh`, check `dev/logs/`, and stop to ask the user.
- `lib-vuetify` and `lib-vue` must be built before e2e tests: `cd lib-vuetify && npm run build`, `cd lib-vue && npm run build`.
- Do not add the new fields to the settings object's top-level `required` array, and do not change any existing `default`. The `compaction` object's own `required: ['percent']` is intentional — it mirrors the proven `moderation` block. The settings form reports spurious Save-button diffs when hidden sections and schema defaults disagree.
- Default values, exact: compaction percent `70`, unknown-window fallback `32000`, retention share of budget `0.3`, compaction floor share of budget `0.2`, character-to-token divisor `4`.
- Do not implement Anthropic `cache_control` breakpoints. Explicitly out of scope.

---

### Task 1: Cache-aware cost accounting

Pure change to `computeCost` plus its four call sites. Independent of everything else in this plan and shippable alone.

**Files:**
- Modify: `api/src/usage/operations.ts:73`
- Modify: `api/src/gateway/router.ts` (lines 22-45, 363, 446, 556)
- Modify: `api/src/summary/router.ts`
- Test: `tests/features/usage/usage.unit.spec.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  ```ts
  export interface TokenPrices {
    inputPricePerMillion: number
    outputPricePerMillion: number
    cachedInputPricePerMillion?: number
    cacheWritePricePerMillion?: number
  }
  export interface TokenCounts {
    inputTokens: number          // TOTAL, inclusive of cache reads
    outputTokens: number
    noCacheTokens?: number
    cacheReadTokens?: number
    cacheWriteTokens?: number
  }
  export function computeCost (counts: TokenCounts, prices: TokenPrices): number
  ```
  Note this replaces the current positional signature `computeCost(inputTokens, outputTokens, inputPricePerMillion, outputPricePerMillion)`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/features/usage/usage.unit.spec.ts`:

```ts
test.describe('computeCost with cache tokens', () => {
  const prices = {
    inputPricePerMillion: 3,
    outputPricePerMillion: 15,
    cachedInputPricePerMillion: 0.3,
    cacheWritePricePerMillion: 3.75
  }

  test('no cache details → whole input billed at input price', () => {
    const cost = computeCost({ inputTokens: 1_000_000, outputTokens: 0 }, prices)
    assert.equal(cost, 3)
  })

  test('noCacheTokens is taken verbatim, never recomputed', () => {
    // total 1M of which 900k were cache reads
    const cost = computeCost(
      { inputTokens: 1_000_000, outputTokens: 0, noCacheTokens: 100_000, cacheReadTokens: 900_000 },
      prices
    )
    // 100k * 3/1M + 900k * 0.3/1M
    assert.equal(cost, 0.3 + 0.27)
  })

  test('falls back to subtraction when noCacheTokens is absent', () => {
    const cost = computeCost(
      { inputTokens: 1_000_000, outputTokens: 0, cacheReadTokens: 900_000 },
      prices
    )
    assert.equal(cost, 0.3 + 0.27)
  })

  test('cache writes are billed at the write price', () => {
    const cost = computeCost(
      { inputTokens: 1_000_000, outputTokens: 0, noCacheTokens: 0, cacheWriteTokens: 1_000_000 },
      prices
    )
    assert.equal(cost, 3.75)
  })

  test('subtraction fallback never goes negative', () => {
    const cost = computeCost(
      { inputTokens: 100, outputTokens: 0, cacheReadTokens: 900 },
      prices
    )
    assert.equal(cost, 900 * 0.3 / 1_000_000)
  })

  test('missing cache prices default to 0, not to the input price', () => {
    const cost = computeCost(
      { inputTokens: 1_000_000, outputTokens: 0, noCacheTokens: 0, cacheReadTokens: 1_000_000 },
      { inputPricePerMillion: 3, outputPricePerMillion: 15 }
    )
    assert.equal(cost, 0)
  })

  test('output tokens still billed', () => {
    const cost = computeCost({ inputTokens: 0, outputTokens: 1_000_000 }, prices)
    assert.equal(cost, 15)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test tests/features/usage/usage.unit.spec.ts`
Expected: FAIL — `computeCost` currently takes four positional numbers, so the object argument yields `NaN` and the assertions fail.

- [ ] **Step 3: Implement the new computeCost**

Replace `computeCost` in `api/src/usage/operations.ts`:

```ts
export interface TokenPrices {
  inputPricePerMillion: number
  outputPricePerMillion: number
  cachedInputPricePerMillion?: number
  cacheWritePricePerMillion?: number
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
 * ai@6 normalizes the provider disagreement about whether `inputTokens` includes
 * cache reads: `inputTokens` is always the total and `noCacheTokens` the billable
 * remainder. Take `noCacheTokens` verbatim when present; the subtraction is only a
 * fallback for providers/mocks that omit the detail.
 */
export function computeCost (counts: TokenCounts, prices: TokenPrices): number {
  const cacheRead = counts.cacheReadTokens ?? 0
  const cacheWrite = counts.cacheWriteTokens ?? 0
  const noCache = counts.noCacheTokens ?? Math.max(counts.inputTokens - cacheRead - cacheWrite, 0)
  return (
    noCache * prices.inputPricePerMillion +
    cacheRead * (prices.cachedInputPricePerMillion ?? 0) +
    cacheWrite * (prices.cacheWritePricePerMillion ?? 0) +
    counts.outputTokens * prices.outputPricePerMillion
  ) / 1_000_000
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test tests/features/usage/usage.unit.spec.ts`
Expected: PASS, including the pre-existing `checkQuota` tests.

- [ ] **Step 5: Update the four call sites**

In `api/src/gateway/router.ts`, the three sites at lines ~363, ~446 and ~556 currently read:

```ts
const cost = computeCost(inputTokens, outputTokens, inputPricePerMillion, outputPricePerMillion)
```

At each, replace the surrounding token extraction so the totals and details travel together. For the non-streaming site (~556), where `result.usage` is in scope:

```ts
const details = result.usage?.inputTokenDetails
const cost = computeCost({
  inputTokens,
  outputTokens,
  noCacheTokens: details?.noCacheTokens,
  cacheReadTokens: details?.cacheReadTokens,
  cacheWriteTokens: details?.cacheWriteTokens
}, { inputPricePerMillion, outputPricePerMillion, cachedInputPricePerMillion, cacheWritePricePerMillion })
```

Apply the same shape at ~363 (`gen.usage`) and ~446 (`part.totalUsage`) — those two already read `?.inputTokenDetails?.cacheReadTokens` for `recordTrace`, so reuse the same expression rather than re-deriving it.

`cachedInputPricePerMillion` and `cacheWritePricePerMillion` do not exist on the settings type yet — Task 2 adds them. Until then, pass `undefined` explicitly:

```ts
{ inputPricePerMillion, outputPricePerMillion, cachedInputPricePerMillion: undefined, cacheWritePricePerMillion: undefined }
```

Task 3 wires the real values.

In `api/src/summary/router.ts`, replace:

```ts
const cost = computeCost(inputTokens, outputTokens, inputPricePerMillion, outputPricePerMillion)
```

with:

```ts
const details = usage?.inputTokenDetails
const cost = computeCost({
  inputTokens,
  outputTokens,
  noCacheTokens: details?.noCacheTokens,
  cacheReadTokens: details?.cacheReadTokens,
  cacheWriteTokens: details?.cacheWriteTokens
}, { inputPricePerMillion, outputPricePerMillion, cachedInputPricePerMillion: undefined, cacheWritePricePerMillion: undefined })
```

- [ ] **Step 6: Verify the build**

Run: `npm run lint-fix && npm run check-types`
Expected: no errors. If `check-types` reports a remaining positional call to `computeCost`, fix that call site — there must be exactly four.

- [ ] **Step 7: Commit**

```bash
git add api/src/usage/operations.ts api/src/gateway/router.ts api/src/summary/router.ts tests/features/usage/usage.unit.spec.ts
git commit -m "feat(usage): price cached and cache-write input tokens separately"
```

---

### Task 2: Settings schema — context window, cache prices, compaction percent

Schema, generated types, and the persistence path. No behavior change yet; this only makes the fields storable and retrievable.

**Files:**
- Modify: `api/types/settings/schema.js`
- Modify: `api/src/settings/service.ts`
- Modify: `api/src/settings/router.ts`
- Test: `tests/features/settings/settings.api.spec.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `Settings['compaction']` of shape `{ percent: number }`.
  - Each `Settings['models'][role]` gains optional `contextWindow`, `cachedInputPricePerMillion`, `cacheWritePricePerMillion` (all `number`).
  - `Settings['models'][role]['model']` (i.e. `definitions.Model`) gains optional `contextWindow`, `cachedInputPricePerMillion`, `cacheWritePricePerMillion` (all `number`), snapshotted from the provider listing when the model is picked.
  - `export const defaultCompaction: NonNullable<Settings['compaction']>` from `api/src/settings/service.ts`.

- [ ] **Step 1: Write the failing API test**

Append to `tests/features/settings/settings.api.spec.ts`, inside the existing `test.describe('Settings API', ...)`:

```ts
test('should persist compaction percent and per-role context window and cache prices', async () => {
  const res = await admin.put('/api/settings/user/test-standalone1', {
    providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
    models: {
      assistant: {
        model: { ...mockModel, contextWindow: 200000 },
        inputPricePerMillion: 3,
        outputPricePerMillion: 15,
        cachedInputPricePerMillion: 0.3,
        cacheWritePricePerMillion: 3.75,
        contextWindow: 128000
      }
    },
    quotas: defaultQuotas,
    compaction: { percent: 55 }
  })
  assert.equal(res.status, 200)
  assert.equal(res.data.compaction.percent, 55)
  assert.equal(res.data.models.assistant.contextWindow, 128000)
  assert.equal(res.data.models.assistant.model.contextWindow, 200000)
  assert.equal(res.data.models.assistant.cachedInputPricePerMillion, 0.3)
  assert.equal(res.data.models.assistant.cacheWritePricePerMillion, 3.75)

  const getRes = await admin.get('/api/settings/user/test-standalone1')
  assert.equal(getRes.data.compaction.percent, 55)
  assert.equal(getRes.data.models.assistant.model.contextWindow, 200000)
})

test('settings without compaction get the default percent', async () => {
  const res = await admin.put('/api/settings/user/test-standalone1', {
    providers: [],
    quotas: defaultQuotas
  })
  assert.equal(res.status, 200)
  assert.equal(res.data.compaction.percent, 70)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test tests/features/settings/settings.api.spec.ts`
Expected: FAIL — the PUT body validator rejects the unknown `compaction` key, or `res.data.compaction` is `undefined`.

- [ ] **Step 3: Extend the JSON schema**

In `api/types/settings/schema.js`:

(a) In `definitions.Model.properties`, after `provider`, add all three reported
fields. Task 4 returns these on every listed model, and the autocomplete stores the
picked item verbatim, so all three must exist here or `check-types` rejects the
listing's extra keys:

```js
        contextWindow: {
          type: 'number',
          title: 'Context window',
          readOnly: true,
          description: 'Total context size in tokens, as reported by the provider when the model was selected.',
          'x-i18n-description': {
            en: 'Total context size in tokens, as reported by the provider when the model was selected.',
            fr: 'Taille totale du contexte en tokens, telle que rapportée par le fournisseur lors de la sélection du modèle.'
          }
        },
        cachedInputPricePerMillion: {
          type: 'number',
          title: 'Cached input price (per 1M tokens)',
          readOnly: true,
          description: 'Reported by the provider when the model was selected.',
          'x-i18n-description': {
            en: 'Reported by the provider when the model was selected.',
            fr: 'Rapporté par le fournisseur lors de la sélection du modèle.'
          }
        },
        cacheWritePricePerMillion: {
          type: 'number',
          title: 'Cache write price (per 1M tokens)',
          readOnly: true,
          description: 'Reported by the provider when the model was selected.',
          'x-i18n-description': {
            en: 'Reported by the provider when the model was selected.',
            fr: 'Rapporté par le fournisseur lors de la sélection du modèle.'
          }
        }
```

(b) For **each** of the five role objects (`assistant`, `tools`, `summarizer`, `evaluator`, `moderator`) under `properties.models.properties`, add three properties alongside the existing `inputPricePerMillion` / `outputPricePerMillion`. Repeat this block verbatim in all five — do not factor it into a `$ref`, because each role's `layout.children` lists keys explicitly:

```js
            contextWindow: {
              type: 'number',
              title: 'Context window override (tokens)',
              'x-i18n-title': {
                en: 'Context window override (tokens)',
                fr: 'Taille de contexte (tokens, surcharge)'
              },
              description: 'Leave empty to use the value reported by the provider, or 32000 when the provider reports none.',
              'x-i18n-description': {
                en: 'Leave empty to use the value reported by the provider, or 32000 when the provider reports none.',
                fr: 'Laissez vide pour utiliser la valeur rapportée par le fournisseur, ou 32000 si le fournisseur ne rapporte rien.'
              },
              minimum: 0
            },
            cachedInputPricePerMillion: {
              type: 'number',
              title: 'Cached input price (per 1M tokens)',
              'x-i18n-title': {
                en: 'Cached input price (per 1M tokens)',
                fr: "Prix d'entrée en cache (par million de tokens)"
              },
              default: 0,
              minimum: 0
            },
            cacheWritePricePerMillion: {
              type: 'number',
              title: 'Cache write price (per 1M tokens)',
              'x-i18n-title': {
                en: 'Cache write price (per 1M tokens)',
                fr: "Prix d'écriture en cache (par million de tokens)"
              },
              default: 0,
              minimum: 0
            }
```

And in each of those five `layout.children` arrays, extend:

```js
            children: [{ key: 'model' }, { key: 'inputPricePerMillion', cols: 6 }, { key: 'outputPricePerMillion', cols: 6 }],
```

to:

```js
            children: [
              { key: 'model' },
              { key: 'contextWindow', cols: 6 },
              { key: 'inputPricePerMillion', cols: 4 },
              { key: 'cachedInputPricePerMillion', cols: 4 },
              { key: 'cacheWritePricePerMillion', cols: 4 },
              { key: 'outputPricePerMillion', cols: 6 }
            ],
```

(c) At the top level of `properties`, directly after the `moderation` block, add:

```js
    compaction: {
      type: 'object',
      title: 'History compaction',
      'x-i18n-title': { en: 'History compaction', fr: 'Compaction de l\'historique' },
      layout: { if: 'parent.data.providers?.length' },
      default: { percent: 70 },
      required: ['percent'],
      additionalProperties: false,
      properties: {
        percent: {
          type: 'number',
          title: 'Compact above this share of the context window (%)',
          'x-i18n-title': {
            en: 'Compact above this share of the context window (%)',
            fr: 'Compacter au-delà de cette part de la fenêtre de contexte (%)'
          },
          description: 'Conversation history is summarized once it exceeds this percentage of the assistant model context window. Higher means rarer compaction, better prompt-cache reuse, and more context kept.',
          'x-i18n-description': {
            en: 'Conversation history is summarized once it exceeds this percentage of the assistant model context window. Higher means rarer compaction, better prompt-cache reuse, and more context kept.',
            fr: "L'historique de conversation est résumé dès qu'il dépasse ce pourcentage de la fenêtre de contexte du modèle assistant. Plus la valeur est élevée, plus la compaction est rare, meilleure est la réutilisation du cache, et plus de contexte est conservé."
          },
          default: 70,
          minimum: 10,
          maximum: 100
        }
      }
    },
```

- [ ] **Step 4: Regenerate types**

Run: `npm run build-types`
Expected: `api/types/settings/index.ts` (or the generated sibling) now declares `compaction` and the new per-role fields.

- [ ] **Step 5: Add the default and persist the field**

In `api/src/settings/service.ts`, after `defaultModeration`:

```ts
export const defaultCompaction: NonNullable<Settings['compaction']> = {
  percent: 70
}
```

In `api/src/settings/router.ts`:
- Add `defaultCompaction` to the existing import from `./service.ts`.
- In `emptySettings`, add `compaction: defaultCompaction` to the returned object.
- In the PUT handler's `settings` object, add `compaction: body.compaction ?? defaultCompaction` next to the existing `moderation` line.

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm run test tests/features/settings/settings.api.spec.ts`
Expected: PASS, including the pre-existing settings tests.

- [ ] **Step 7: Verify the build**

Run: `npm run lint-fix && npm run check-types`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add api/types/settings/schema.js api/types/settings api/src/settings/service.ts api/src/settings/router.ts tests/features/settings/settings.api.spec.ts
git commit -m "feat(settings): add context window, cache prices and compaction percent"
```

---

### Task 3: Resolve the budget server-side and advertise it

Teach `getModelConfig` about the new fields, feed the real cache prices into Task 1's `computeCost` calls, and put the budget on the wire.

**Files:**
- Modify: `api/src/models/operations.ts:82-96`
- Modify: `api/src/gateway/router.ts:183-187`
- Modify: `api/src/gateway/router.ts` (the three `computeCost` call sites from Task 1)
- Modify: `api/src/moderation/service.ts:160,182,250,267` (two more `computeCost` sites, both already destructuring `getModelConfig(settings, 'moderator')`)
- Test: `tests/features/models/models.unit.spec.ts`
- Test: `tests/features/gateway/gateway.api.spec.ts`

**Interfaces:**
- Consumes: `Settings['compaction']` and the per-role fields from Task 2; `TokenPrices` from Task 1.
- Produces:
  ```ts
  export const UNKNOWN_CONTEXT_WINDOW = 32_000
  // getModelConfig's return type gains:
  //   cachedInputPricePerMillion: number
  //   cacheWritePricePerMillion: number
  //   contextWindow: number
  export function contextBudget (settings: Settings, modelRole: ModelRole): number
  ```
  Header contract: `x-context-budget: <integer tokens>` on every gateway response, always computed for the `assistant` role regardless of the role being called.

- [ ] **Step 1: Write the failing unit tests**

Append to `tests/features/models/models.unit.spec.ts` (add `getModelConfig`, `contextBudget`, `UNKNOWN_CONTEXT_WINDOW` to the existing import from `../../../api/src/models/operations.ts`):

```ts
const mockModel = { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', id: 'mock', name: 'Mock' } }

function settingsWith (assistant: any, compaction?: any): any {
  return { owner: { type: 'user', id: 'u' }, providers: [], models: { assistant }, compaction }
}

test.describe('context window resolution', () => {
  test('role override wins over the model snapshot', () => {
    const s = settingsWith({ model: { ...mockModel, contextWindow: 200000 }, contextWindow: 128000 })
    assert.equal(getModelConfig(s, 'assistant').contextWindow, 128000)
  })

  test('falls back to the model snapshot', () => {
    const s = settingsWith({ model: { ...mockModel, contextWindow: 200000 } })
    assert.equal(getModelConfig(s, 'assistant').contextWindow, 200000)
  })

  test('falls back to 32000 when nothing is known', () => {
    const s = settingsWith({ model: mockModel })
    assert.equal(getModelConfig(s, 'assistant').contextWindow, UNKNOWN_CONTEXT_WINDOW)
    assert.equal(UNKNOWN_CONTEXT_WINDOW, 32000)
  })

  test('a zero override is ignored, not treated as a window of zero', () => {
    const s = settingsWith({ model: { ...mockModel, contextWindow: 200000 }, contextWindow: 0 })
    assert.equal(getModelConfig(s, 'assistant').contextWindow, 200000)
  })

  test('cache prices default to 0', () => {
    const c = getModelConfig(settingsWith({ model: mockModel }), 'assistant')
    assert.equal(c.cachedInputPricePerMillion, 0)
    assert.equal(c.cacheWritePricePerMillion, 0)
  })

  test('cache prices fall back to the model snapshot, and the role overrides it', () => {
    const snap = { ...mockModel, cachedInputPricePerMillion: 0.3, cacheWritePricePerMillion: 3.75 }
    assert.equal(getModelConfig(settingsWith({ model: snap }), 'assistant').cachedInputPricePerMillion, 0.3)
    assert.equal(getModelConfig(settingsWith({ model: snap }), 'assistant').cacheWritePricePerMillion, 3.75)
    const overridden = settingsWith({ model: snap, cachedInputPricePerMillion: 0.1 })
    assert.equal(getModelConfig(overridden, 'assistant').cachedInputPricePerMillion, 0.1)
  })
})

test.describe('contextBudget', () => {
  test('applies the configured percent', () => {
    const s = settingsWith({ model: { ...mockModel, contextWindow: 200000 } }, { percent: 70 })
    assert.equal(contextBudget(s, 'assistant'), 140000)
  })

  test('defaults to 70 percent when compaction is unset', () => {
    const s = settingsWith({ model: { ...mockModel, contextWindow: 200000 } })
    assert.equal(contextBudget(s, 'assistant'), 140000)
  })

  test('rounds down to an integer', () => {
    const s = settingsWith({ model: { ...mockModel, contextWindow: 32001 } }, { percent: 55 })
    assert.equal(contextBudget(s, 'assistant'), Math.floor(32001 * 0.55))
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test tests/features/models/models.unit.spec.ts`
Expected: FAIL — `contextBudget` and `UNKNOWN_CONTEXT_WINDOW` are not exported.

- [ ] **Step 3: Implement in models/operations.ts**

Replace the return block of `getModelConfig` and append `contextBudget`:

```ts
/**
 * Used when neither the admin nor the provider listing supplies a window.
 * Deliberately conservative: it is the case of a local or self-hosted
 * openai-compatible model that may genuinely be small.
 */
export const UNKNOWN_CONTEXT_WINDOW = 32_000

const DEFAULT_COMPACTION_PERCENT = 70
```

Inside `getModelConfig`, after `if (!source?.model) throw ...`:

```ts
  return {
    modelConfig: source.model,
    inputPricePerMillion: source.inputPricePerMillion ?? 0,
    outputPricePerMillion: source.outputPricePerMillion ?? 0,
    // Same resolution order as contextWindow: role override, then the snapshot
    // taken from the provider listing when the model was picked, then 0.
    cachedInputPricePerMillion: source.cachedInputPricePerMillion ?? source.model.cachedInputPricePerMillion ?? 0,
    cacheWritePricePerMillion: source.cacheWritePricePerMillion ?? source.model.cacheWritePricePerMillion ?? 0,
    // A 0 override means "unset" (the form emits 0 for an untouched number
    // field), not a zero-token window — fall through to the snapshot.
    contextWindow: source.contextWindow || source.model.contextWindow || UNKNOWN_CONTEXT_WINDOW
  }
}

/**
 * Token budget above which the client compacts history. Always resolved for the
 * role whose history is actually compacted.
 */
export function contextBudget (settings: Settings, modelRole: ModelRole): number {
  const { contextWindow } = getModelConfig(settings, modelRole)
  const percent = settings.compaction?.percent ?? DEFAULT_COMPACTION_PERCENT
  return Math.floor(contextWindow * percent / 100)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test tests/features/models/models.unit.spec.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing gateway API test**

Append to `tests/features/gateway/gateway.api.spec.ts`, following the file's existing pattern for configuring a mock-provider account and posting a completion:

```ts
test('gateway advertises the context budget', async () => {
  await admin.put('/api/settings/user/test-standalone1', {
    providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
    models: { assistant: { model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', id: 'mock', name: 'Mock' }, contextWindow: 200000 } } },
    quotas: defaultQuotas,
    compaction: { percent: 70 }
  })

  const res = await user.post('/api/gateway/user/test-standalone1/v1/chat/completions', {
    model: 'assistant',
    messages: [{ role: 'user', content: 'hello' }]
  })
  assert.equal(res.status, 200)
  assert.equal(res.headers['x-context-budget'], '140000')
})
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npm run test tests/features/gateway/gateway.api.spec.ts`
Expected: FAIL — `x-context-budget` is `undefined`.

- [ ] **Step 7: Set the header and wire the real prices**

In `api/src/gateway/router.ts`, import `contextBudget` from `../models/operations.ts`, and immediately after the existing line 183:

```ts
    if (storeTraces) res.setHeader('x-trace-storage', 'available')
    // Advertise the assistant budget on every response regardless of the role
    // called: the client compacts the main history, whichever role it just used.
    res.setHeader('x-context-budget', String(contextBudget(settings, 'assistant')))
```

Then widen the destructuring at line ~187:

```ts
    const { modelConfig, inputPricePerMillion, outputPricePerMillion, cachedInputPricePerMillion, cacheWritePricePerMillion } = getModelConfig(settings, modelId)
```

and at the three `computeCost` call sites, replace the `undefined` placeholders left by Task 1 with the real `cachedInputPricePerMillion` and `cacheWritePricePerMillion`.

Do the same in `api/src/summary/router.ts`: extend `getSummaryPricing` to return `cachedInputPricePerMillion: source?.cachedInputPricePerMillion ?? 0` and `cacheWritePricePerMillion: source?.cacheWritePricePerMillion ?? 0`, and pass them into `computeCost`.

And in `api/src/moderation/service.ts`, at both sites (lines ~160 and ~250) widen the existing destructuring:

```ts
  const { inputPricePerMillion, outputPricePerMillion, cachedInputPricePerMillion, cacheWritePricePerMillion } = getModelConfig(settings, 'moderator')
```

then replace the two `cachedInputPricePerMillion: undefined, cacheWritePricePerMillion: undefined` placeholders (lines ~188 and ~273) with the destructured values. These two sites were missing from the original plan's file list; Task 1 converted them to the object form to keep `tsc` passing.

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm run test tests/features/gateway/gateway.api.spec.ts tests/features/models/models.unit.spec.ts tests/features/usage/usage.unit.spec.ts`
Expected: PASS.

- [ ] **Step 9: Verify the build**

Run: `npm run lint-fix && npm run check-types`
Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add api/src/models/operations.ts api/src/gateway/router.ts api/src/summary/router.ts tests/features/models/models.unit.spec.ts tests/features/gateway/gateway.api.spec.ts
git commit -m "feat(gateway): resolve a context budget per account and advertise it"
```

---

### Task 4: Carry context window and cache pricing through the models listing

Stop discarding what providers already report, so the admin's model picker can snapshot it.

**Files:**
- Modify: `api/src/models/router.ts`
- Test: `tests/features/models/models.api.spec.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `CoreModelInfo` and the `Model` objects returned by `GET /api/models/:type/:id` gain optional `contextWindow`, `cachedInputPricePerMillion`, `cacheWritePricePerMillion` (numbers, absent when the provider reports nothing).

- [ ] **Step 1: Write the failing API test**

Append to `tests/features/models/models.api.spec.ts`:

```ts
test('mock provider models advertise a context window', async () => {
  await admin.put('/api/settings/user/test-standalone1', {
    providers: [{ id: 'mock', type: 'mock', name: 'Mock', enabled: true }],
    quotas: defaultQuotas
  })
  const res = await admin.get('/api/models/user/test-standalone1')
  assert.equal(res.status, 200)
  const model = res.data.results.find((m: any) => m.id === 'mock-model')
  assert.ok(model)
  assert.equal(model.contextWindow, 128000)
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test tests/features/models/models.api.spec.ts`
Expected: FAIL — `model.contextWindow` is `undefined`.

- [ ] **Step 3: Widen CoreModelInfo and the fetchers**

In `api/src/models/router.ts`, replace the type:

```ts
type CoreModelInfo = {
  id: string
  name: string
  contextWindow?: number
  cachedInputPricePerMillion?: number
  cacheWritePricePerMillion?: number
}
```

OpenRouter reports all three. `pricing.*` values are per-token dollar strings, so scale by 1e6:

```ts
async function fetchOpenRouterModels (apiKey: string): Promise<CoreModelInfo[]> {
  const response = await axios.get('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` }
  })
  const perMillion = (v: unknown) => {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? n * 1_000_000 : undefined
  }
  return response.data.data.map((model: any) => ({
    id: model.id,
    name: model.name || model.id,
    contextWindow: model.top_provider?.context_length ?? model.context_length ?? undefined,
    cachedInputPricePerMillion: perMillion(model.pricing?.input_cache_read),
    cacheWritePricePerMillion: perMillion(model.pricing?.input_cache_write)
  }))
}
```

Ollama reports **nothing usable** — leave `fetchOllamaModels` unchanged. Its
`list()` response carries only `parent_model` / `format` / `family` /
`parameter_size` / `quantization_level` (`node_modules/ollama/dist/shared/ollama.1bfa89da.d.ts:219`);
the context length lives solely in `show()`'s `model_info` map, which would cost one
extra HTTP call per model on an admin page. And the advertised value is the model's
maximum, whereas an Ollama server actually serves `num_ctx` (commonly 4096) — so the
number would mislead the budget. Ollama falls back to the 32000 default plus the
admin override, like OpenAI and Anthropic.

Give the mock provider a window so it is testable end to end:

```ts
  if (provider.type === 'mock') {
    return [
      { id: 'mock-model', name: 'Mock Model', contextWindow: 128000 },
      { id: 'mock-tools', name: 'Mock Tools Model', contextWindow: 128000 },
      { id: 'mock-summarizer', name: 'Mock Summarizer Model', contextWindow: 128000 },
      { id: 'evaluator-mock-model', name: 'Evaluator Mock Model', contextWindow: 128000 }
    ]
  }
```

OpenAI, Anthropic, Google, Mistral and the generic openai-compatible fetchers report nothing usable — leave them unchanged.

Finally, in `getModelsForOwner`, carry the fields through the mapping:

```ts
        models.push(...providerModels.map(m => ({
          id: m.id,
          name: m.name,
          ...(m.contextWindow ? { contextWindow: m.contextWindow } : {}),
          ...(m.cachedInputPricePerMillion ? { cachedInputPricePerMillion: m.cachedInputPricePerMillion } : {}),
          ...(m.cacheWritePricePerMillion ? { cacheWritePricePerMillion: m.cacheWritePricePerMillion } : {}),
          provider: { type: provider.type, name: provider.name, id: provider.id }
        })))
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm run test tests/features/models/models.api.spec.ts`
Expected: PASS.

- [ ] **Step 5: Verify the build**

Run: `npm run lint-fix && npm run check-types`
Expected: no errors. `Model` is a generated type; if `check-types` rejects the extra keys, confirm Task 2 added `contextWindow` to `definitions.Model` and that `npm run build-types` has been run.

- [ ] **Step 6: Commit**

```bash
git add api/src/models/router.ts tests/features/models/models.api.spec.ts
git commit -m "feat(models): keep context window and cache pricing from provider listings"
```

---

### Task 5: The compaction policy as a pure, tested module

The heart of the change. Extracted first and tested in isolation; Task 6 wires it in.

**Files:**
- Create: `ui/src/utils/compaction-policy.ts`
- Test: `tests/features/chat-hang/compaction-policy.unit.spec.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  ```ts
  import type { ModelMessage } from 'ai'

  export const RETENTION_SHARE = 0.3
  export const FLOOR_SHARE = 0.2
  export const CHARS_PER_TOKEN = 4

  export interface CompactionInput {
    history: ModelMessage[]
    lastInputTokens: number    // provider-reported total for the previous turn; 0 if none yet
    appendedChars: number      // chars appended to history since that measurement
    budget: number             // tokens
    generation: number         // how many times this history has already been compacted
  }

  export type CompactionDecision =
    | { compact: false, reason: 'under-budget' | 'nothing-to-compact' | 'below-floor' }
    | { compact: true, prefixToSummarize: ModelMessage[], retained: ModelMessage[], generation: number }

  export function estimateTokens (chars: number): number
  export function estimateMessageTokens (message: ModelMessage): number
  export function decideCompaction (input: CompactionInput): CompactionDecision
  export function isTurnBoundary (history: ModelMessage[], index: number): boolean
  ```

- [ ] **Step 1: Write the failing tests**

Create `tests/features/chat-hang/compaction-policy.unit.spec.ts`:

```ts
/**
 * stateless unit tests for the compaction decision: when to compact, and where
 * to cut so a tool call is never separated from its tool result.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import type { ModelMessage } from 'ai'
import {
  decideCompaction,
  isTurnBoundary,
  estimateTokens,
  RETENTION_SHARE
} from '../../../ui/src/utils/compaction-policy.ts'

const userMsg = (text: string): ModelMessage => ({ role: 'user', content: text })
const asstMsg = (text: string): ModelMessage => ({ role: 'assistant', content: text })
const toolCall = (id: string): ModelMessage => ({
  role: 'assistant',
  content: [{ type: 'tool-call', toolCallId: id, toolName: 'search', input: {} }]
} as ModelMessage)
const toolResult = (id: string): ModelMessage => ({
  role: 'tool',
  content: [{ type: 'tool-result', toolCallId: id, toolName: 'search', output: { type: 'text', value: 'ok' } }]
} as ModelMessage)

/** n turns of user+assistant, each roughly `chars` characters. */
function conversation (turns: number, chars = 400): ModelMessage[] {
  const out: ModelMessage[] = []
  for (let i = 0; i < turns; i++) {
    out.push(userMsg(`q${i} `.padEnd(chars, 'x')))
    out.push(asstMsg(`a${i} `.padEnd(chars, 'y')))
  }
  return out
}

test.describe('decideCompaction — trigger', () => {
  test('under budget → no compaction', () => {
    const d = decideCompaction({
      history: conversation(3), lastInputTokens: 1000, appendedChars: 0, budget: 140000, generation: 0
    })
    assert.equal(d.compact, false)
    assert.equal(d.reason, 'under-budget')
  })

  test('the appended-chars estimate can push fill over budget on its own', () => {
    const d = decideCompaction({
      history: conversation(40), lastInputTokens: 900, appendedChars: 1200, budget: 1000, generation: 0
    })
    assert.equal(d.compact, true)
  })

  test('fill uses the provider total, not the serialized history length', () => {
    // ~32k tokens of history, but the trigger is the measured prompt (35k > 30k).
    // A character-only measure would also have to know about the system prompt and
    // tool schemas to reach the same conclusion; this one gets them for free.
    const d = decideCompaction({
      history: conversation(150), lastInputTokens: 35000, appendedChars: 0, budget: 30000, generation: 0
    })
    assert.equal(d.compact, true)
  })

  test('a huge measured prompt with a small history cannot be fixed by compacting', () => {
    // The prompt is dominated by the system prompt and tool schemas, not by history.
    // Compaction has nothing to reclaim and must not burn a summarizer call saying so.
    const d = decideCompaction({
      history: conversation(20), lastInputTokens: 150000, appendedChars: 0, budget: 140000, generation: 0
    })
    assert.equal(d.compact, false)
    assert.equal(d.reason, 'nothing-to-compact')
  })
})

test.describe('decideCompaction — guards', () => {
  test('empty history → nothing to compact', () => {
    const d = decideCompaction({
      history: [], lastInputTokens: 999999, appendedChars: 0, budget: 1000, generation: 0
    })
    assert.equal(d.compact, false)
    assert.equal(d.reason, 'nothing-to-compact')
  })

  test('a single user message → nothing to compact', () => {
    const d = decideCompaction({
      history: [userMsg('hello')], lastInputTokens: 999999, appendedChars: 0, budget: 1000, generation: 0
    })
    assert.equal(d.compact, false)
    assert.equal(d.reason, 'nothing-to-compact')
  })

  test('below the floor → skip rather than pay a summarizer call for a sliver', () => {
    // Over budget (2000 > 1500), but retention (30% of 1500 = 450 tokens) swallows
    // all but the first two messages, so the prefix is ~216 tokens — under the
    // 300-token floor. Summarizing that costs more than the context it reclaims.
    const d = decideCompaction({
      history: conversation(3), lastInputTokens: 2000, appendedChars: 0, budget: 1500, generation: 0
    })
    assert.equal(d.compact, false)
    assert.equal(d.reason, 'below-floor')
  })

  test('everything fitting in the retention window → nothing to compact', () => {
    const d = decideCompaction({
      history: conversation(2), lastInputTokens: 200000, appendedChars: 0, budget: 140000, generation: 0
    })
    assert.equal(d.compact, false)
    assert.equal(d.reason, 'nothing-to-compact')
  })
})

test.describe('decideCompaction — what survives', () => {
  test('keeps the last user message and recent turns verbatim', () => {
    const history = [...conversation(60), userMsg('the latest question')]
    const d = decideCompaction({
      history, lastInputTokens: 200000, appendedChars: 0, budget: 20000, generation: 0
    })
    assert.equal(d.compact, true)
    if (!d.compact) return
    assert.deepEqual(d.retained[d.retained.length - 1], userMsg('the latest question'))
    assert.ok(d.retained.length > 1, 'more than the last message survives')
    assert.ok(d.prefixToSummarize.length > 0)
  })

  test('prefix and retained partition the history exactly, in order', () => {
    const history = [...conversation(60), userMsg('latest')]
    const d = decideCompaction({
      history, lastInputTokens: 200000, appendedChars: 0, budget: 20000, generation: 0
    })
    assert.equal(d.compact, true)
    if (!d.compact) return
    assert.deepEqual([...d.prefixToSummarize, ...d.retained], history)
  })

  test('retention stays near its share of budget', () => {
    const history = [...conversation(200), userMsg('latest')]
    const budget = 20000
    const d = decideCompaction({
      history, lastInputTokens: 200000, appendedChars: 0, budget, generation: 0
    })
    assert.equal(d.compact, true)
    if (!d.compact) return
    const retainedTokens = d.retained.reduce((n, m) => n + estimateTokens(JSON.stringify(m).length), 0)
    assert.ok(retainedTokens <= budget * RETENTION_SHARE * 1.5, `retained ${retainedTokens}`)
  })

  test('generation increments', () => {
    const history = [...conversation(60), userMsg('latest')]
    const d = decideCompaction({
      history, lastInputTokens: 200000, appendedChars: 0, budget: 20000, generation: 2
    })
    assert.equal(d.compact, true)
    if (!d.compact) return
    assert.equal(d.generation, 3)
  })
})

test.describe('turn boundaries — a tool call is never split from its result', () => {
  test('isTurnBoundary rejects a cut between a tool call and its result', () => {
    const history = [userMsg('q'), toolCall('c1'), toolResult('c1'), asstMsg('a')]
    assert.equal(isTurnBoundary(history, 2), false)
    assert.equal(isTurnBoundary(history, 3), true)
  })

  test('isTurnBoundary accepts a cut before a user message', () => {
    const history = [userMsg('q1'), asstMsg('a1'), userMsg('q2')]
    assert.equal(isTurnBoundary(history, 2), true)
  })

  test('the chosen cut never orphans a tool result', () => {
    const history: ModelMessage[] = []
    for (let i = 0; i < 40; i++) {
      history.push(userMsg(`q${i} `.padEnd(400, 'x')))
      history.push(toolCall(`c${i}`))
      history.push(toolResult(`c${i}`))
      history.push(asstMsg(`a${i} `.padEnd(400, 'y')))
    }
    history.push(userMsg('latest'))

    const d = decideCompaction({
      history, lastInputTokens: 500000, appendedChars: 0, budget: 20000, generation: 0
    })
    assert.equal(d.compact, true)
    if (!d.compact) return
    // No retained tool message may reference a call that stayed behind in the prefix.
    const retainedCallIds = new Set<string>()
    for (const m of d.retained) {
      if (m.role !== 'assistant' || !Array.isArray(m.content)) continue
      for (const part of m.content as any[]) {
        if (part.type === 'tool-call') retainedCallIds.add(part.toolCallId)
      }
    }
    for (const m of d.retained) {
      if (m.role !== 'tool' || !Array.isArray(m.content)) continue
      for (const part of m.content as any[]) {
        assert.ok(retainedCallIds.has(part.toolCallId), `orphaned tool result ${part.toolCallId}`)
      }
    }
  })

  test('the retained window always starts on a turn boundary', () => {
    const history: ModelMessage[] = []
    for (let i = 0; i < 40; i++) {
      history.push(userMsg(`q${i} `.padEnd(400, 'x')))
      history.push(toolCall(`c${i}`))
      history.push(toolResult(`c${i}`))
      history.push(asstMsg(`a${i} `.padEnd(400, 'y')))
    }
    history.push(userMsg('latest'))
    const d = decideCompaction({
      history, lastInputTokens: 500000, appendedChars: 0, budget: 20000, generation: 0
    })
    assert.equal(d.compact, true)
    if (!d.compact) return
    assert.equal(isTurnBoundary(history, d.prefixToSummarize.length), true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test tests/features/chat-hang/compaction-policy.unit.spec.ts`
Expected: FAIL — `ui/src/utils/compaction-policy.ts` does not exist.

- [ ] **Step 3: Implement the module**

Create `ui/src/utils/compaction-policy.ts`:

```ts
/**
 * Pure decision layer for history compaction: when to compact, what to summarize
 * and what to keep verbatim. Deliberately free of I/O so every branch is unit
 * tested — the previous implementation lived inline in use-agent-chat and never was.
 *
 * The shape follows the append-only rule that prompt caching imposes: evict from
 * the head (old, re-fetchable) and keep the tail intact, because rewriting the
 * prefix discards the provider's cache of it.
 */

import type { ModelMessage } from 'ai'

/** Share of the budget kept verbatim after a compaction. Also the hysteresis: a
 *  fresh compaction lands near this fill, so the next turn cannot re-trigger. */
export const RETENTION_SHARE = 0.3
/** Below this share of budget, summarizing costs more (a blocking call plus a
 *  full prompt-cache invalidation) than the context it reclaims. */
export const FLOOR_SHARE = 0.2
export const CHARS_PER_TOKEN = 4

export interface CompactionInput {
  history: ModelMessage[]
  /** Provider-reported TOTAL input tokens for the previous turn; 0 if none yet. */
  lastInputTokens: number
  /** Characters appended to history since that measurement. */
  appendedChars: number
  budget: number
  generation: number
}

export type CompactionDecision =
  | { compact: false, reason: 'under-budget' | 'nothing-to-compact' | 'below-floor' }
  | { compact: true, prefixToSummarize: ModelMessage[], retained: ModelMessage[], generation: number }

export function estimateTokens (chars: number): number {
  return Math.ceil(chars / CHARS_PER_TOKEN)
}

export function estimateMessageTokens (message: ModelMessage): number {
  return estimateTokens(JSON.stringify(message).length)
}

function toolCallIdsIn (message: ModelMessage, type: 'tool-call' | 'tool-result'): string[] {
  if (!Array.isArray(message.content)) return []
  const ids: string[] = []
  for (const part of message.content as { type?: string, toolCallId?: string }[]) {
    if (part?.type === type && part.toolCallId) ids.push(part.toolCallId)
  }
  return ids
}

/**
 * True when history can be split at `index` (i.e. `history[index]` may start a new
 * window) without orphaning a tool result from the assistant message that called it.
 * Providers reject a tool result whose call is absent, so this is a hard constraint,
 * not a nicety.
 */
export function isTurnBoundary (history: ModelMessage[], index: number): boolean {
  if (index <= 0 || index >= history.length) return true
  // Walk forward over the tool results that belong to calls made before the cut.
  const pending = new Set<string>()
  for (let i = index; i < history.length; i++) {
    const msg = history[i]
    if (msg.role !== 'tool') break
    for (const id of toolCallIdsIn(msg, 'tool-result')) pending.add(id)
  }
  if (pending.size === 0) return true
  // Any of those calls issued before the cut means the cut orphans them.
  for (let i = index - 1; i >= 0; i--) {
    for (const id of toolCallIdsIn(history[i], 'tool-call')) {
      if (pending.has(id)) return false
    }
  }
  return true
}

export function decideCompaction (input: CompactionInput): CompactionDecision {
  const { history, lastInputTokens, appendedChars, budget, generation } = input

  const fill = lastInputTokens + estimateTokens(appendedChars)
  if (fill <= budget) return { compact: false, reason: 'under-budget' }
  if (history.length < 2) return { compact: false, reason: 'nothing-to-compact' }

  // Walk backwards accumulating the tail we want to keep verbatim, then move the
  // cut earlier until it lands on a legal boundary. Cutting earlier only ever
  // retains more, so it can never orphan anything the walk already accepted.
  const retentionBudget = budget * RETENTION_SHARE
  let cut = history.length - 1
  let kept = estimateMessageTokens(history[cut])
  while (cut > 0) {
    const next = estimateMessageTokens(history[cut - 1])
    if (kept + next > retentionBudget) break
    cut--
    kept += next
  }
  while (cut > 0 && !isTurnBoundary(history, cut)) cut--

  const prefixToSummarize = history.slice(0, cut)
  const retained = history.slice(cut)

  if (prefixToSummarize.length === 0) return { compact: false, reason: 'nothing-to-compact' }

  // Floor measured in tokens only. A message-count clause would refuse to compact a
  // prefix that is a single enormous tool result, which is exactly the case that most
  // needs compacting.
  const prefixTokens = prefixToSummarize.reduce((n, m) => n + estimateMessageTokens(m), 0)
  if (prefixTokens < budget * FLOOR_SHARE) return { compact: false, reason: 'below-floor' }

  return { compact: true, prefixToSummarize, retained, generation: generation + 1 }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test tests/features/chat-hang/compaction-policy.unit.spec.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Verify the build**

Run: `npm run lint-fix && npm run check-types`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add ui/src/utils/compaction-policy.ts tests/features/chat-hang/compaction-policy.unit.spec.ts
git commit -m "feat(chat): extract the compaction decision into a pure tested module"
```

---

### Task 6: Wire the policy into the chat composable

Replace the 24k character cliff with the budget-driven policy, and stop nuking tool-exploration state.

**Files:**
- Modify: `ui/src/composables/use-agent-chat.ts` (lines 207-208, 314-317, 416-475, and the turn-completion path near 995)
- Test: `tests/features/chat-hang/3.compaction.e2e.spec.ts` (create, following an existing e2e spec in that folder for fixtures and login)

**Interfaces:**
- Consumes: `decideCompaction`, `estimateTokens` from Task 5; the `x-context-budget` header from Task 3.
- Produces: no new exports. Internal state: `contextBudget` (ref, seeded from the header), `lastInputTokens`, `measuredChars`, `compactionGeneration`.

- [ ] **Step 1: Read the current implementation**

Read `ui/src/composables/use-agent-chat.ts` lines 200-215, 310-335, 410-480 and 960-1000 before editing. `compactHistory` is called from exactly one place (line ~544) and must keep its current signature and abort semantics: an abort rethrows so `sendMessage` handles it, any other failure falls through and continues with un-compacted history.

- [ ] **Step 2: Replace the threshold constant with budget state**

Delete lines 207-208:

```ts
  // characters of serialized history before compaction
  // 24000 is roughly equivalent to a 8k tokens context with 10-15 turns of dialogue an 2-3 tool calls
  const COMPACTION_THRESHOLD = 24_000
```

and add in their place:

```ts
  // Token budget above which history is compacted. Advertised by the gateway
  // (x-context-budget) as contextWindow × compaction.percent, so it follows the
  // configured assistant model. Until the first response arrives it is null and
  // no compaction can be needed — history is at most one user message.
  const contextBudget = ref<number | null>(null)
  // Provider-reported TOTAL input tokens for the previous turn. Counts the system
  // prompt and tool schemas, which a serialized-history measure misses entirely.
  let lastInputTokens = 0
  // Serialized history length at the moment lastInputTokens was measured. The
  // delta against the current length is the estimate for what was appended since —
  // one snapshot instead of accounting at every history.push site, which would
  // silently undercount the day someone adds a new push.
  let measuredChars = 0
  // How many times this history has already been compacted. Carried so the
  // summarizer is told it is merging an existing recap, not digesting raw dialogue.
  let compactionGeneration = 0
```

- [ ] **Step 3: Read the header**

Extend `noteStorageHeader` (line ~314) — it already runs on every gateway response:

```ts
  // Surface server-advertised trace storage availability (drives the consent sheet)
  // and the account's compaction budget.
  const noteStorageHeader = (res: Response): Response => {
    if (res.headers.get('x-trace-storage') === 'available') traceStorageAvailable.value = true
    const budget = Number(res.headers.get('x-context-budget'))
    if (Number.isFinite(budget) && budget > 0) contextBudget.value = budget
    return res
  }
```

- [ ] **Step 4: Rewrite compactHistory**

Add the import at the top of the file:

```ts
import { decideCompaction } from '~/utils/compaction-policy'
```

Replace the body of `compactHistory` down to (but not including) its `try {`:

```ts
  async function compactHistory (compactionCtxId: string, signal: AbortSignal): Promise<void> {
    const override = Number(sessionStorage.getItem('agent-chat-compaction-threshold'))
    const budget = (Number.isFinite(override) && override > 0) ? override : contextBudget.value
    if (!budget) return

    const decision = decideCompaction({
      history,
      lastInputTokens,
      appendedChars: Math.max(JSON.stringify(history).length - measuredChars, 0),
      budget,
      generation: compactionGeneration
    })
    if (!decision.compact) {
      debug('no compaction: %s', decision.reason)
      return
    }
    const { prefixToSummarize, retained } = decision

    // Compaction is otherwise an invisible, multi-second blank gap (a separate
    // summarizer call before the real turn even starts); name it so the user sees
    // what's happening instead of a mute spinner. Set only AFTER the decision — the
    // existing line sits above the old threshold check and would now flash on every turn.
    activity.value = { kind: 'compacting' }
```

The pre-existing `activity.value = { kind: 'compacting' }` at line ~429 is replaced by
the one above; make sure only one remains.

Then replace the prompt constant. The previous recap, when there is one, is the first message of `prefixToSummarize`, so the instruction changes with `compactionGeneration`:

```ts
    // The summary becomes the assistant's only memory of everything before the
    // retained window, so it must stay *actionable*: keep the open task and its next
    // step, the user's goals/constraints, decisions, and — verbatim — the identifiers
    // the assistant needs to keep acting (ids, indices, paths, URLs, names, figures).
    // Detailed tool payloads can be dropped (tools remain callable to re-fetch them)
    // but the references to re-fetch them must survive.
    const basePrompt = 'You are compacting the earlier part of a conversation between a user and a tool-using AI assistant so it can continue within a smaller context window. Write a dense recap that preserves everything needed to continue seamlessly: any task still in progress and the concrete next step; the user\'s stated goals, preferences and constraints; key decisions and conclusions; and important results from tool calls. Keep identifiers and references verbatim — dataset/resource ids, entry indices, file paths, URLs, names, exact figures — since the assistant may need them to act again. Omit pleasantries and redundant back-and-forth. Be concise, but lossless on actionable details.'
    // Re-summarizing a summary compounds loss. When a recap is already present it
    // heads the content below; say so, so the model merges rather than re-digests.
    const mergeNote = compactionGeneration > 0
      ? ' The content below BEGINS with a recap produced by an earlier compaction. Merge it with the newer exchanges that follow it into a single recap; preserve every still-relevant detail from that earlier recap verbatim rather than re-summarizing it.'
      : ''
    const prompt = basePrompt + mergeNote
```

In the `try` block, `historyToCompact` becomes `prefixToSummarize`, and the splice keeps the retained window:

```ts
        messages: [{ role: 'user' as const, content: JSON.stringify(redactHistoryMediaToolResults(prefixToSummarize)) }],
```

and:

```ts
      const originalLength = JSON.stringify(history).length

      // Framed as a user turn (not assistant): providers like Anthropic require the
      // history to start with a user message, and the SDK coalesces it with whatever
      // follows. The preamble tells the model this is a condensed record of the earlier
      // exchange — including its own actions — so it doesn't mistake the recap for a
      // fresh user request. Recent turns follow it verbatim.
      history = [
        { role: 'user' as const, content: `[Automatic recap of our earlier conversation, condensed to save context — continue as if you remember it]\n${summary}` },
        ...retained
      ]
      compactionGeneration = decision.generation

      // The retained window keeps the tools it actually references callable; only
      // prune what no longer appears. Clearing wholesale (the previous behaviour)
      // forced the model to re-explore tools it had just used.
      const retainedJson = JSON.stringify(retained)
      for (const name of [...promotedTools]) if (!retainedJson.includes(name)) promotedTools.delete(name)
      for (const name of [...announcedTools]) if (!retainedJson.includes(name)) announcedTools.delete(name)

      // The next turn re-measures against the real prompt; until then the whole
      // rebuilt history counts as un-measured.
      lastInputTokens = 0
      measuredChars = 0

      debug('compacted history from %d chars to %d chars (generation %d)', originalLength, JSON.stringify(history).length, compactionGeneration)
```

Note `promotedTools` is currently declared with `let promotedTools = new Set<string>()`; the pruning above mutates it in place, which is fine. Leave the `reset()` path clearing both sets as it is.

- [ ] **Step 5: Capture the measured prompt size**

There is deliberately no per-`history.push` accounting. At the end of a successful
turn, in `sendMessage`'s try block next to the existing `status.value = 'ready'` (and
after the empty-response handling, so `result.usage` is already awaited on that path):

```ts
      // Provider-reported total for the prompt we just sent: the honest fill measure,
      // counting the system prompt and tool schemas too. Snapshot the serialized length
      // alongside it so the next turn can estimate only the delta.
      try {
        const usage = await result.usage
        if (usage?.inputTokens) {
          lastInputTokens = usage.inputTokens
          measuredChars = JSON.stringify(history).length
        }
      } catch { /* usage is best-effort; the estimate carries until the next turn */ }
```

In `reset()`, alongside the existing state clearing, add:

```ts
    lastInputTokens = 0
    measuredChars = 0
    compactionGeneration = 0
```

- [ ] **Step 6: Verify the build**

Run: `npm run lint-fix && npm run check-types`
Expected: no errors. In particular `COMPACTION_THRESHOLD` must have no remaining references.

- [ ] **Step 7: Build the workspace packages**

Run: `cd lib-vuetify && npm run build && cd ../lib-vue && npm run build && cd ..`
Expected: `lib-vuetify/*.js` and `lib-vue/*.js` present. e2e tests fail with "element(s) not found" if this is skipped.

- [ ] **Step 8: Write the e2e test**

Create `tests/features/chat-hang/3.compaction.e2e.spec.ts`:

```ts
/**
 * E2E test for budget-based compaction.
 *
 * The account budget is forced small via the sessionStorage override so a handful of
 * mock-provider turns cross it. Asserts the compaction indicator appears and — the
 * point of keeping recent turns verbatim — that the conversation keeps answering
 * afterwards rather than losing its thread.
 */

import { expect, type Page } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin, defaultQuotas } from '../../support/axios.ts'

const admin = await superAdmin

const settingsData = {
  providers: [
    { id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }
  ],
  models: {
    assistant: {
      model: {
        id: 'mock-model',
        name: 'Mock Model',
        provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' }
      }
    },
    summarizer: {
      model: {
        id: 'mock-summarizer',
        name: 'Mock Summarizer Model',
        provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' }
      }
    }
  },
  quotas: defaultQuotas,
  compaction: { percent: 70 }
}

function isChatFrameUrl (url: string): boolean {
  try {
    return new URL(url).pathname.endsWith('/_dev/chat')
  } catch {
    return false
  }
}

async function waitForChatFrame (page: Page) {
  await expect(async () => {
    expect(page.frames().find(f => isChatFrameUrl(f.url()))).toBeTruthy()
  }).toPass({ timeout: 10000 })
  const frame = page.frames().find(f => isChatFrameUrl(f.url()))!
  await expect(frame.getByPlaceholder('Type your message...')).toBeVisible({ timeout: 15000 })
  return frame
}

test.describe('History compaction', () => {
  test.beforeEach(async () => {
    await clean()
    await admin.put('/api/settings/user/test-standalone1', settingsData)
  })

  test('crossing the budget compacts and the conversation keeps answering', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-block', 'test-standalone1')
    const frame = await waitForChatFrame(page)

    // Force a tiny budget. Read live per turn in compactHistory, so no reload needed.
    await frame.evaluate(() => sessionStorage.setItem('agent-chat-compaction-threshold', '300'))

    const input = frame.getByPlaceholder('Type your message...')
    const send = frame.getByRole('button', { name: 'Send' })
    const activity = frame.getByTestId('chat-activity')

    // First turn establishes a real usage.inputTokens measurement.
    await input.fill('hello')
    await send.click()
    await expect(frame.getByText('world')).toBeVisible({ timeout: 15000 })

    // Subsequent turns push measured fill past the 300-token budget.
    let sawCompacting = false
    for (let i = 0; i < 4; i++) {
      await input.fill(`question number ${i} with enough words to grow the history measurably`)
      await send.click()
      // The compaction line is transient; catch it if it renders this turn.
      if (!sawCompacting) {
        sawCompacting = await activity.filter({ hasText: 'Compacting' })
          .isVisible({ timeout: 3000 }).catch(() => false)
      }
      await expect(frame.getByText('what do you mean ?').last()).toBeVisible({ timeout: 15000 })
    }

    expect(sawCompacting).toBe(true)

    // The conversation still works after compaction — the retained window kept it coherent.
    await input.fill('hello')
    await send.click()
    await expect(frame.getByText('world').last()).toBeVisible({ timeout: 15000 })
    await expect(frame.locator('.v-alert')).toHaveCount(0)
  })
})
```

If `getByTestId('chat-activity')` proves too transient to catch reliably, assert on the
debug output instead of loosening the assertion: `compactHistory` logs
`compacted history from %d chars to %d chars (generation %d)`. Do **not** delete the
assertion — a test that cannot observe compaction is not testing compaction.

- [ ] **Step 9: Run the e2e test**

Run: `npm run test tests/features/chat-hang/3.compaction.e2e.spec.ts`
Expected: PASS. If it fails with a connection error, run `bash dev/status.sh`, check `dev/logs/`, and stop to ask the user. If it fails with "element(s) not found", re-check Step 7.

- [ ] **Step 10: Run the whole suite**

Run: `npm run test`
Expected: PASS. The pre-existing `tests/features/tool-exploration/` and `tests/features/chat-hang/` specs are the ones most likely to be affected by this task — if either regresses, the cause is in Step 4 or Step 5, not in the test.

- [ ] **Step 11: Commit**

```bash
git add ui/src/composables/use-agent-chat.ts tests/features/chat-hang/3.compaction.e2e.spec.ts
git commit -m "feat(chat): compact on a share of the context window, keeping recent turns"
```

---

### Task 7: Settings form regression guard

The settings form reports spurious Save-button diffs when hidden sections and schema defaults disagree. The new `compaction` block and the three new per-role fields are exactly that shape, so this gets its own gate.

**Files:**
- Test: `tests/features/settings/settings.e2e.spec.ts`
- Modify (only if the test fails): `api/types/settings/schema.js`, `api/src/settings/router.ts`

**Interfaces:**
- Consumes: the schema from Task 2.
- Produces: nothing.

- [ ] **Step 1: Write the e2e test**

Append to `tests/features/settings/settings.e2e.spec.ts`, inside the existing
`test.describe('Settings UI', ...)`. This follows the file's own
"Save button appears when there are changes" test, inverted:

```ts
  test('loading saved settings reports no pending change', async ({ page, goToWithAuth }) => {
    // The compaction block and the per-role context/cache fields are hidden until a
    // provider exists, and carry schema defaults. If the form strips a hidden empty
    // value that the server re-injects, the round-trip reports a diff and Save
    // re-enables with nothing edited.
    const admin = await superAdmin
    await admin.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'seed-provider', type: 'mock', name: 'Mock Seed', enabled: true }],
      models: {
        assistant: {
          model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Seed', id: 'seed-provider' } }
        }
      },
      quotas: defaultQuotas,
      compaction: { percent: 70 }
    })

    await goToWithAuth('/agents/admin/user/test-standalone1', 'superadmin', { adminMode: true })
    await expect(page.getByText('AI Providers')).toBeVisible({ timeout: 10000 })
    // Let vjsf finish its initial validation/normalisation pass.
    await page.waitForTimeout(500)

    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible()
  })

  test('the compaction percent is editable and round-trips', async ({ page, goToWithAuth }) => {
    const admin = await superAdmin
    await admin.put('/api/settings/user/test-standalone1', {
      providers: [{ id: 'seed-provider', type: 'mock', name: 'Mock Seed', enabled: true }],
      models: {
        assistant: {
          model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Seed', id: 'seed-provider' } }
        }
      },
      quotas: defaultQuotas,
      compaction: { percent: 55 }
    })

    await goToWithAuth('/agents/admin/user/test-standalone1', 'superadmin', { adminMode: true })
    await expect(page.getByText('AI Providers')).toBeVisible({ timeout: 10000 })

    const field = page.getByRole('spinbutton', { name: /Compact above this share/ })
    await expect(field).toHaveValue('55')
  })
```

- [ ] **Step 2: Run it**

Run: `npm run test tests/features/settings/settings.e2e.spec.ts`
Expected: PASS. If Save is enabled after a reload with no edit, the round-trip is lossy.

- [ ] **Step 3: If it fails, fix the round-trip**

The two known causes, in order of likelihood:
1. The form strips the hidden empty `compaction` object, the router re-injects `defaultCompaction`, and the next load sees a diff. Fix the same way `models` is handled in `api/src/settings/router.ts` — persist it only when the body carries it:
   ```ts
   if (body.compaction) settings.compaction = body.compaction
   ```
   and drop `compaction` from the unconditional object. Update the Task 2 API test accordingly: a PUT without `compaction` then returns no `compaction` key, and `contextBudget` already defaults to 70 when it is absent.
2. A `default` on one of the new per-role numbers is emitted by the form but not stored, or vice versa. Remove the `default: 0` from `cachedInputPricePerMillion` / `cacheWritePricePerMillion` if so — they are optional and `getModelConfig` already coerces with `?? 0`.

Re-run Step 2 after the fix.

- [ ] **Step 4: Commit**

```bash
git add tests/features/settings/settings.e2e.spec.ts api/types/settings/schema.js api/src/settings/router.ts
git commit -m "test(settings): guard the new fields against a spurious form diff"
```

---

### Task 8: Documentation

**Files:**
- Rewrite: `docs/architecture/compaction.md`
- Modify: `docs/architecture/providers.md`
- Modify: `docs/architecture/tool-exploration.md:26`
- Modify: `docs/architecture/sub-agents.md:237`

**Interfaces:**
- Consumes: the behavior built in Tasks 1-7.
- Produces: nothing.

- [ ] **Step 1: Check whether docs are tested**

Run: `npm run test tests/features/traces/architecture-docs.unit.spec.ts`
Expected: PASS before any edit. This spec validates the architecture docs; read it before editing so the rewrite keeps whatever structure it asserts (mermaid fences, headings, file references).

- [ ] **Step 2: Rewrite `docs/architecture/compaction.md`**

Replace the whole file. It must state:
- The trigger is `contextWindow × compaction.percent` (default 70%), not a character count.
- `contextWindow` resolution order: role override → snapshot on the picked model → 32000.
- The gateway advertises the budget as `x-context-budget`, always for the `assistant` role.
- Fill is `lastTurn.usage.inputTokens + appendedChars / 4`; the provider total counts the system prompt and tool schemas.
- What survives: recap + recent turns verbatim, sized at 30% of budget, cut on a turn boundary that never splits a tool call from its result.
- The two guards: no re-summarizing a recap (merge instruction + `compactionGeneration`), and the floor below which compaction is skipped.
- That compaction invalidates the provider prompt cache, which is *why* it is late and rare.
- The `sessionStorage.setItem('agent-chat-compaction-threshold', ...)` override still forces a budget for testing.
- Point to `ui/src/utils/compaction-policy.ts` as the decision module.

Update the mermaid sequence diagram to match: the threshold check reads a budget, and the post-compaction history is `[recap, ...retained]`.

- [ ] **Step 3: Update the other three**

- `docs/architecture/providers.md`: in the roles table, note that each role also carries an optional context-window override and cached/cache-write prices.
- `docs/architecture/tool-exploration.md:26`: promotions are no longer cleared wholesale on compaction — they are pruned to the tools still referenced in the retained window.
- `docs/architecture/sub-agents.md:237`: replace the "24,000-character compaction threshold" reference with the budget-based one.

- [ ] **Step 4: Run the docs test and the full suite**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/architecture
git commit -m "docs: describe budget-based compaction"
```

---

## Verification

After Task 8, before claiming the work complete:

- [ ] `npm run lint-fix` — clean (one pre-existing `vue/no-v-html` warning in `ui/src/components/agent-chat/MarkdownContent.vue` is expected)
- [ ] `npm run check-types` — clean
- [ ] `npm run test` — all three projects pass
- [ ] `docker build -t agents .` — succeeds
- [ ] Confirm by grep that `COMPACTION_THRESHOLD` and the literal `24_000` are gone from `ui/src/composables/use-agent-chat.ts`
- [ ] Confirm `computeCost` has exactly six call sites (3 in `gateway/router.ts`, 2 in `moderation/service.ts`, 1 in `summary/router.ts`), all passing the object form and all passing real cache prices

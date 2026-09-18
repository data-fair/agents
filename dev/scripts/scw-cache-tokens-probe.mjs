#!/usr/bin/env node
//
// Scaleway cached-input-token reporting probe.
//
// WHY THIS EXISTS
// ---------------
// The gateway prices cached input tokens separately from uncached ones
// (`computeCost` in api/src/usage/operations.ts): `noCacheTokens` bills at the
// role's input price, `cacheReadTokens` at its `cachedInputPricePerMillion`.
// That split only ever happens if the provider REPORTS it.
//
// Scaleway is documented as caching automatically (a 50-90% hit ratio is claimed
// for conversational/agentic workloads) and as billing cached input at a
// discount. What is NOT documented is whether the discount is visible in the API
// response at all, or only on the invoice. Scaleway's own "unsupported
// parameters" list mentions `prompt_cache_key` but says nothing about the
// `prompt_tokens_details.cached_tokens` RESPONSE field.
//
// This matters because the two cases behave differently:
//
//   reported     → @ai-sdk/openai-compatible maps cached_tokens to
//                  inputTokens.cacheRead and sets noCache = prompt - cacheRead
//                  (node_modules/@ai-sdk/openai-compatible/dist/index.mjs:67-73),
//                  so the configured cached price applies and recorded cost
//                  tracks the real bill.
//   not reported → cacheRead is 0, noCache is the whole prompt, and every token
//                  bills at the full input price. Nothing breaks and quotas stay
//                  conservative, but recorded cost OVER-states the real Scaleway
//                  invoice, and configuring a cached price achieves nothing.
//
// USAGE
// -----
//   SCW_URL="https://api.scaleway.ai/<projectId>/v1" \
//   SCW_KEY="<scaleway secret key>" \
//   [SCW_MODEL="<model id>"] \
//   node dev/scripts/scw-cache-tokens-probe.mjs
//
// It sends the same long, stable prefix twice (caching needs a repeated prefix,
// and providers generally require ~1024+ tokens before they cache at all), with
// a different short suffix each time so the second call is not a plain repeat.
// It prints each response's raw `usage` object verbatim and then says whether the
// cached-token field appeared.

const url = process.env.SCW_URL
const key = process.env.SCW_KEY
if (!url || !key) {
  console.error('missing SCW_URL and/or SCW_KEY — see the usage block at the top of this file')
  process.exit(1)
}

const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }

const pickModel = async () => {
  if (process.env.SCW_MODEL) return process.env.SCW_MODEL
  const res = await fetch(`${url.replace(/\/$/, '')}/models`, { headers })
  if (!res.ok) throw new Error(`/models returned ${res.status}`)
  const { data } = await res.json()
  const first = data?.[0]?.id
  if (!first) throw new Error('/models returned no models')
  return first
}

// A long, stable prefix. Caching keys on the prefix, so this must be byte-identical
// across both calls; only the trailing user message differs.
const filler = Array.from({ length: 600 }, (_, i) =>
  `Line ${i}: this is stable filler text whose only purpose is to push the shared prefix past the provider's minimum cacheable length.`
).join('\n')

const call = async (model, suffix) => {
  const res = await fetch(`${url.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      max_tokens: 16,
      temperature: 0,
      messages: [
        { role: 'system', content: filler },
        { role: 'user', content: suffix }
      ]
    })
  })
  const body = await res.json()
  if (!res.ok) throw new Error(`chat/completions returned ${res.status}: ${JSON.stringify(body).slice(0, 300)}`)
  return body.usage
}

const cachedOf = (usage) => usage?.prompt_tokens_details?.cached_tokens

const model = await pickModel()
console.log(`model: ${model}`)
console.log(`prefix: ~${Math.round(filler.length / 4)} estimated tokens\n`)

const first = await call(model, 'Reply with the single word: one.')
console.log('call 1 usage:', JSON.stringify(first))

// A cache write on the first call needs a moment to become readable on some
// providers; a short pause costs nothing and removes a false negative.
await new Promise(resolve => setTimeout(resolve, 2000))

const second = await call(model, 'Reply with the single word: two.')
console.log('call 2 usage:', JSON.stringify(second))

console.log('')
const firstCached = cachedOf(first)
const secondCached = cachedOf(second)

if (firstCached === undefined && secondCached === undefined) {
  console.log('VERDICT: prompt_tokens_details.cached_tokens is ABSENT from both responses.')
  console.log('  Scaleway does not report cached tokens, so cacheRead is always 0 and the')
  console.log('  whole prompt bills at the input price. Configuring cachedInputPricePerMillion')
  console.log('  on a Scaleway role has no effect, and recorded cost over-states the real bill')
  console.log('  by whatever discount Scaleway applied silently.')
} else if (!secondCached) {
  console.log(`VERDICT: the field EXISTS but stayed 0 (call 1: ${firstCached}, call 2: ${secondCached}).`)
  console.log('  Either the prefix did not hit the cache (try a longer one, or re-run — the')
  console.log('  cache is heuristic and not guaranteed), or this model is not cached.')
  console.log('  Re-run before concluding.')
} else {
  const pct = Math.round((secondCached / (second.prompt_tokens || 1)) * 100)
  console.log(`VERDICT: cached tokens ARE reported — ${secondCached} of ${second.prompt_tokens} prompt tokens (${pct}%) on call 2.`)
  console.log('  @ai-sdk/openai-compatible maps this to inputTokens.cacheRead, so the cached')
  console.log('  price configured on the role applies and recorded cost tracks the real bill.')
}

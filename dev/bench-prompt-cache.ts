/**
 * Prompt-cache bench: does the upstream behind an OpenAI-compatible endpoint (GreenPT through LiteLLM
 * in production) cache a repeated prompt prefix, and does the usage it reports say so?
 *
 * Production meters show 0 cached input tokens. Our side reads cache reads from the AI SDK's
 * `inputTokenDetails` (`tokenCountsOf`) and keeps the prefix stable, so the question is upstream:
 * no caching, or caching that LiteLLM / the provider does not report. This tells the two apart by
 * looking at both the reported usage AND the latency of identical requests.
 *
 * Each run starts its prompt with a fresh nonce, so its first call is cold whatever ran before; the
 * prefix is ~PREFIX_CHARS of deterministic text (well above the 1,024-token minimum most providers
 * cache from). Three paths, per model:
 *
 *   raw        non-streaming chat/completions: cold, warm, warm, then the same prefix extended by a
 *              second exchange (what an agent's next step sends)
 *   raw-stream streaming with `stream_options.include_usage` (what our provider sends): cold, warm,
 *              with time to first token
 *   ai-sdk     our own `createModel` + `streamText`, read through `tokenCountsOf`: what the meters see
 *
 * Reading it:
 *   cached > 0 on warm calls        upstream caches and reports it -> look at our pipeline again
 *   cached 0, warm clearly faster   it caches but nobody reports it (LiteLLM or the provider)
 *   cached 0, same latency          no caching for this key / model
 * A single warm miss proves little (a provider may route to another replica): look at the series.
 *
 * Use a temporary LiteLLM key dedicated to the bench, so its spend in LiteLLM is the bench's alone.
 *
 *   BENCH_BASE_URL=https://litellm.internal.koumoul.fr/v1 BENCH_API_KEY=sk-... \
 *     node dev/bench-prompt-cache.ts [model ...]
 *
 * Models default to the three production GreenPT entries. BENCH_REASONING (default `none`) is sent as
 * `reasoning_effort`; set it empty to send nothing. Raw usage and LiteLLM headers of every call are
 * written to dev/logs/bench-prompt-cache-<time>.json.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { streamText } from 'ai'
import { createModel } from '../api/src/models/operations.ts'
import { tokenCountsOf } from '../api/src/usage/operations.ts'

const BASE_URL = (process.env.BENCH_BASE_URL ?? 'https://litellm.internal.koumoul.fr/v1').replace(/\/$/, '')
const API_KEY = process.env.BENCH_API_KEY
const REASONING = process.env.BENCH_REASONING ?? 'none'
const MODELS = process.argv.length > 2
  ? process.argv.slice(2)
  : ['deepseek-v4.1-flash-greenpt', 'glm-5.3-greenpt', 'glm-5.3-flash-greenpt']
const PREFIX_CHARS = 32_000 // ~8k tokens
const PAUSE_MS = 2000
const MAX_TOKENS = 16

if (!API_KEY) {
  console.error('BENCH_API_KEY is required (a temporary LiteLLM key)')
  process.exit(1)
}

// Deterministic, varied text: repeated identical lines could be special-cased by a tokenizer or a cache.
const WORDS = 'dataset portal schema column filter catalog owner license update record field value region commune year source quality publish metadata attachment'.split(' ')
const filler = () => {
  let seed = 42
  const next = () => { seed = (seed * 1103515245 + 12345) % 2 ** 31; return seed }
  const lines: string[] = []
  let length = 0
  for (let i = 0; length < PREFIX_CHARS; i++) {
    const words = Array.from({ length: 12 }, () => WORDS[next() % WORDS.length]).join(' ')
    const line = `Reference ${String(i).padStart(4, '0')}: ${words} (${next() % 10000}).`
    lines.push(line)
    length += line.length + 1
  }
  return lines.join('\n')
}
const FILLER = filler()

const systemFor = (nonce: string) =>
  `Run ${nonce}. You are a terse assistant. The reference material below is context only.\n\n${FILLER}`
const QUESTION = 'Reply with the single word: ok.'

interface Row {
  model: string
  path: string
  call: string
  promptTokens?: number
  cachedTokens?: number
  latencyMs: number
  ttftMs?: number
  cost?: string
  usage?: unknown
  headers?: Record<string, string>
  error?: string
}
const rows: Row[] = []

const litellmHeaders = (headers: Headers) =>
  Object.fromEntries([...headers.entries()].filter(([name]) => name.startsWith('x-litellm')))

// The field every OpenAI-compatible server is supposed to use, plus the Anthropic-style one LiteLLM
// sometimes passes through.
const cachedOf = (usage: any): number | undefined =>
  usage?.prompt_tokens_details?.cached_tokens ?? usage?.cache_read_input_tokens

const body = (model: string, messages: unknown[], stream: boolean) => ({
  model,
  messages,
  max_tokens: MAX_TOKENS,
  temperature: 0,
  ...(REASONING ? { reasoning_effort: REASONING } : {}),
  ...(stream ? { stream: true, stream_options: { include_usage: true } } : {})
})

const post = (payload: unknown) => fetch(`${BASE_URL}/chat/completions`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${API_KEY}` },
  body: JSON.stringify(payload)
})

const record = (row: Row) => {
  rows.push(row)
  const cells = [
    row.model.padEnd(30), row.path.padEnd(10), row.call.padEnd(9),
    String(row.promptTokens ?? '-').padStart(7), String(row.cachedTokens ?? '-').padStart(7),
    `${row.latencyMs}ms`.padStart(8), (row.ttftMs !== undefined ? `${row.ttftMs}ms` : '-').padStart(8),
    (row.cost ?? '-').padStart(12)
  ]
  console.log(cells.join(' ') + (row.error ? `  ERROR ${row.error}` : ''))
}

const pause = () => new Promise(resolve => setTimeout(resolve, PAUSE_MS))

async function raw (model: string) {
  const system = systemFor(randomUUID())
  const base = [{ role: 'system', content: system }, { role: 'user', content: QUESTION }]
  const extended = [...base, { role: 'assistant', content: 'ok' }, { role: 'user', content: 'Once more: reply with the single word ok.' }]
  for (const [call, messages] of [['cold', base], ['warm 1', base], ['warm 2', base], ['extended', extended]] as const) {
    const started = performance.now()
    try {
      const response = await post(body(model, messages, false))
      const json: any = await response.json()
      const latencyMs = Math.round(performance.now() - started)
      if (!response.ok) throw new Error(`${response.status} ${JSON.stringify(json).slice(0, 200)}`)
      record({
        model, path: 'raw', call, latencyMs,
        promptTokens: json.usage?.prompt_tokens, cachedTokens: cachedOf(json.usage),
        cost: response.headers.get('x-litellm-response-cost') ?? undefined,
        usage: json.usage, headers: litellmHeaders(response.headers)
      })
    } catch (err) {
      record({ model, path: 'raw', call, latencyMs: Math.round(performance.now() - started), error: (err as Error).message })
    }
    await pause()
  }
}

async function rawStream (model: string) {
  const messages = [{ role: 'system', content: systemFor(randomUUID()) }, { role: 'user', content: QUESTION }]
  for (const call of ['cold', 'warm 1']) {
    const started = performance.now()
    try {
      const response = await post(body(model, messages, true))
      if (!response.ok || !response.body) throw new Error(`${response.status} ${(await response.text()).slice(0, 200)}`)
      let ttftMs: number | undefined
      let usage: any
      let buffer = ''
      const decoder = new TextDecoder()
      for await (const chunk of response.body as any) {
        buffer += decoder.decode(chunk, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue
          const event = JSON.parse(line.slice(6))
          const delta = event.choices?.[0]?.delta
          if (ttftMs === undefined && (delta?.content || delta?.reasoning_content)) ttftMs = Math.round(performance.now() - started)
          if (event.usage) usage = event.usage
        }
      }
      record({
        model, path: 'raw-stream', call, latencyMs: Math.round(performance.now() - started), ttftMs,
        promptTokens: usage?.prompt_tokens, cachedTokens: cachedOf(usage),
        cost: response.headers.get('x-litellm-response-cost') ?? undefined,
        usage, headers: litellmHeaders(response.headers)
      })
    } catch (err) {
      record({ model, path: 'raw-stream', call, latencyMs: Math.round(performance.now() - started), error: (err as Error).message })
    }
    await pause()
  }
}

async function aiSdk (model: string) {
  // The provider exactly as production declares it (an openai-compatible entry in 'compatible' mode).
  const languageModel = createModel({
    type: 'openai-compatible', id: 'bench', name: 'bench', enabled: true,
    baseURL: BASE_URL, apiKey: API_KEY, compatibility: 'compatible'
  } as any, model)
  const system = systemFor(randomUUID())
  for (const call of ['cold', 'warm 1']) {
    const started = performance.now()
    try {
      const result = streamText({
        model: languageModel,
        system,
        prompt: QUESTION,
        maxOutputTokens: MAX_TOKENS,
        temperature: 0,
        ...(REASONING ? { providerOptions: { openaiCompatible: { reasoningEffort: REASONING } } } : {})
      })
      let ttftMs: number | undefined
      for await (const part of result.fullStream) {
        if (ttftMs === undefined && (part.type === 'text-delta' || part.type === 'reasoning-delta')) ttftMs = Math.round(performance.now() - started)
        if (part.type === 'error') throw part.error
      }
      const usage = await result.usage
      const counts = tokenCountsOf(usage)
      record({
        model, path: 'ai-sdk', call, latencyMs: Math.round(performance.now() - started), ttftMs,
        promptTokens: counts.inputTokens, cachedTokens: counts.cacheReadTokens, usage
      })
    } catch (err) {
      record({ model, path: 'ai-sdk', call, latencyMs: Math.round(performance.now() - started), error: (err as Error).message })
    }
    await pause()
  }
}

console.log(`${BASE_URL}, prefix ~${Math.round(FILLER.length / 4)} tokens, reasoning_effort=${REASONING || '(not sent)'}\n`)
console.log(['model'.padEnd(30), 'path'.padEnd(10), 'call'.padEnd(9), 'prompt'.padStart(7), 'cached'.padStart(7), 'latency'.padStart(8), 'ttft'.padStart(8), 'litellm cost'.padStart(12)].join(' '))
for (const model of MODELS) {
  await raw(model)
  await rawStream(model)
  await aiSdk(model)
  console.log()
}

const out = new URL(`./logs/bench-prompt-cache-${new Date().toISOString().replace(/[:.]/g, '-')}.json`, import.meta.url)
mkdirSync(new URL('./logs/', import.meta.url), { recursive: true })
writeFileSync(out, JSON.stringify({ baseUrl: BASE_URL, reasoning: REASONING, prefixChars: FILLER.length, rows }, null, 2))
console.log(`raw usage and headers: ${out.pathname}`)

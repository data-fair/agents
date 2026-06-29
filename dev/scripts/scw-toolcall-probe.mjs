#!/usr/bin/env node
//
// Scaleway GLM streamed-tool-call regression probe.
//
// WHY THIS EXISTS
// ---------------
// Scaleway's `glm-5.2` deployment drops tool calls in STREAMING mode: an identical
// request returns the tool call with `stream:false` but collapses to
// `finish_reason:"stop"` with zero tool-call deltas when `stream:true`. The app
// streams for UX, so the assistant/evaluator would "narrate then stop" and the
// conversation looked interrupted (branch fix-interrupted-conv, 2026-06).
//
// Other Scaleway models tested (qwen3.5-397b, qwen3-235b, gpt-oss-120b — itself a
// reasoning model — and devstral-2-123b) stream tool calls fine, so it is a
// model-specific serving bug, NOT provider-wide and NOT reasoning-model-wide.
//
// The gateway works around it: `streamedToolCallsBroken()` in
// api/src/models/operations.ts makes it call the upstream non-streaming when tools are
// present. Use THIS probe to check whether Scaleway has fixed the bug — if the GLM
// `STREAM` row below shows `toolCalls=1`, the workaround can be removed.
//
// USAGE
// -----
//   SCW_URL="https://api.scaleway.ai/<projectId>/v1" \
//   SCW_KEY="<scaleway secret key>" \
//   [SCW_MODEL="glm-5.2"] [SCW_CONTROL="qwen3-235b-a22b-instruct-2507"] \
//   node dev/scripts/scw-toolcall-probe.mjs
//
// It runs the target model (default: first /models id matching /glm/) and a control
// model, each NONSTREAM vs STREAM, and prints whether tool_calls materialise.
// You can also point it at the LiteLLM passthrough (LLM-style) endpoint — any
// OpenAI-compatible /chat/completions base works; just pass the matching SCW_MODEL.

let BASE = process.env.SCW_URL
const KEY = process.env.SCW_KEY
let MODEL = process.env.SCW_MODEL
const CONTROL = process.env.SCW_CONTROL
if (!BASE || !KEY) { console.error('Set SCW_URL and SCW_KEY (see header).'); process.exit(1) }
BASE = BASE.replace(/\/chat\/completions\/?$/, '').replace(/\/$/, '')
const H = { 'content-type': 'application/json', authorization: `Bearer ${KEY}` }

const SYSTEM = 'You are a trace evaluator. Use the tools to investigate before answering. Start with getTraceOverview.'
const USER = 'pourquoi la conversation a été interrompue ?'
const mkTool = (name) => ({ type: 'function', function: { name, description: `Tool ${name} for trace exploration.`, parameters: { type: 'object', properties: { index: { type: 'number' } }, required: [] } } })
const TOOLS = ['getTraceOverview', 'getTraceEntry', 'getSessionConfig', 'readArchitectureDoc'].map(mkTool)
const CHAT = `${BASE}/chat/completions`

async function discover () {
  const r = await fetch(`${BASE}/models`, { headers: H })
  const j = await r.json()
  const ids = (j?.data ?? []).map(m => m.id)
  return { ids, glm: ids.find(id => /glm/i.test(id)) }
}

async function call (model, doStream) {
  const body = { model, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: USER }], tools: TOOLS, tool_choice: 'auto', stream: doStream }
  if (doStream) body.stream_options = { include_usage: true }
  const r = await fetch(CHAT, { method: 'POST', headers: H, body: JSON.stringify(body) })
  if (r.status !== 200) return { http: r.status, err: (await r.text()).slice(0, 160) }
  if (!doStream) {
    const j = await r.json(); const m = j?.choices?.[0]?.message ?? {}
    return { http: 200, finish: j?.choices?.[0]?.finish_reason, toolCalls: m.tool_calls?.length ?? 0, names: (m.tool_calls ?? []).map(c => c.function?.name).join(',') }
  }
  const rd = r.body.getReader(); const dec = new TextDecoder()
  let buf = '', finish, names = new Set(), frags = 0
  for (;;) {
    const { done, value } = await rd.read(); if (done) break
    buf += dec.decode(value, { stream: true }); const ls = buf.split('\n'); buf = ls.pop()
    for (const line of ls) {
      const s = line.trim(); if (!s.startsWith('data:')) continue
      const d = s.slice(5).trim(); if (d === '[DONE]') continue
      let j; try { j = JSON.parse(d) } catch { continue }
      const dl = j?.choices?.[0]?.delta ?? {}; const fr = j?.choices?.[0]?.finish_reason
      if (fr) finish = fr
      if (Array.isArray(dl.tool_calls)) for (const tc of dl.tool_calls) { frags++; if (tc.function?.name) names.add(tc.function.name) }
    }
  }
  return { http: 200, finish, toolCalls: names.size, frags, names: [...names].join(',') }
}

async function report (label, model) {
  const ns = await call(model, false)
  const st = await call(model, true)
  console.log(`\n[${label}] ${model}`)
  console.log(`  NONSTREAM http=${ns.http} finish=${String(ns.finish).padEnd(11)} toolCalls=${ns.toolCalls ?? '-'} [${ns.names ?? ''}] ${ns.err ? 'ERR:' + ns.err : ''}`)
  console.log(`  STREAM    http=${st.http} finish=${String(st.finish).padEnd(11)} toolCalls=${st.toolCalls ?? '-'} [${st.names ?? ''}] frags=${st.frags ?? '-'} ${st.err ? 'ERR:' + st.err : ''}`)
  const broken = (ns.toolCalls ?? 0) > 0 && (st.toolCalls ?? 0) === 0
  console.log(`  => streamed tool calls ${broken ? 'BROKEN (NONSTREAM works, STREAM does not)' : 'OK'}`)
  return broken
}

const { ids, glm } = await discover()
if (!MODEL) MODEL = glm
if (!MODEL) { console.error('No GLM model found; pass SCW_MODEL explicitly. Available:\n', ids.join(', ')); process.exit(1) }
console.log('available models:', ids.join(', '))
const targetBroken = await report('target', MODEL)
if (CONTROL) await report('control', CONTROL)
console.log(`\nVERDICT: glm streamed tool-calls are ${targetBroken ? 'STILL BROKEN — keep streamedToolCallsBroken() workaround.' : 'FIXED — you can remove the streamedToolCallsBroken() workaround in api/src/models/operations.ts.'}`)

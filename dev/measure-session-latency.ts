/**
 * Measure what the agent session design ADDS: the server's wait for a contextual tool call.
 *
 * §7 of `docs/superpowers/specs/2026-10-01-one-server-loop-prototype-design.md` fixes this as one of
 * the criteria the prototype is judged on, so it is a script rather than a test — a reading, repeatable
 * before and after, not an assertion.
 *
 * WHAT IT MEASURES, precisely: the time from the server deciding to call a page tool to the answer
 * arriving, as timed on the server. It excludes the triggering endpoint's own HTTP overhead, and it
 * excludes the page tool's execution time (the client here answers immediately), because neither is
 * what this design changes.
 *
 * WHAT IT DOES NOT MEASURE, and must not be read as: the deployed cost. Both ends are on localhost, so
 * the client-to-server round trip is ~0 here. The number below is therefore the FIXED OVERHEAD — proxy,
 * framing, event loop — and a real deployment adds one genuine client-to-server RTT per tool call on
 * top of it. That added RTT is the design's real latency cost, and it is a property of where the user
 * is rather than of this code.
 *
 * The baseline it should be compared against is NOT a function call. Today a contextual tool goes
 * through an MCP client over BroadcastChannel/postMessage to the page's own WebMCP server, which is
 * itself a round trip — measuring that needs a browser, so it is noted here rather than guessed.
 *
 * Usage: node dev/measure-session-latency.ts [samples]
 */

import { readFileSync } from 'node:fs'
import WebSocket from 'ws'

const SAMPLES = Number(process.argv[2] ?? 200)

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter(line => line.includes('=') && !line.trim().startsWith('#'))
    .map(line => {
      const index = line.indexOf('=')
      return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^["']|["']$/g, '')]
    })
)
const base = `http://localhost:${env.NGINX_PORT}/agents`

const percentile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]

const main = async () => {
  const ws = new WebSocket(`ws://localhost:${env.NGINX_PORT}/agents/api/agent-session`)
  const pendingFrames: any[] = []
  const waiters: Array<(frame: any) => void> = []
  ws.on('message', raw => {
    const frame = JSON.parse(raw.toString())
    const waiter = waiters.shift()
    if (waiter) waiter(frame)
    else pendingFrames.push(frame)
  })
  const nextFrame = async (): Promise<any> => {
    const buffered = pendingFrames.shift()
    if (buffered) return buffered
    return await new Promise(resolve => waiters.push(resolve))
  }

  await new Promise<void>((resolve, reject) => { ws.once('open', () => resolve()); ws.once('error', reject) })

  // Answer every tool-call the moment it arrives, so the measurement is transport only.
  ;(async () => {
    for (;;) {
      const frame = await nextFrame()
      if (frame.type === 'tool-call') ws.send(JSON.stringify({ type: 'tool-result', callId: frame.callId, result: 'ok' }))
    }
  })().catch(() => {})

  ws.send(JSON.stringify({ type: 'hello', tools: [{ name: 'measure_me', description: 'answers at once' }] }))
  await new Promise(resolve => setTimeout(resolve, 200))

  const samples: number[] = []
  for (let i = 0; i < SAMPLES; i++) {
    const response = await fetch(`${base}/api/test-env/agent-session-call`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'measure_me', input: { i } })
    })
    const body = await response.json() as { ok: boolean, durationMs: number, error?: string }
    if (!body.ok) throw new Error(`call ${i} failed: ${body.error}`)
    samples.push(body.durationMs)
  }
  ws.close()

  const sorted = [...samples].sort((a, b) => a - b)
  const mean = samples.reduce((total, value) => total + value, 0) / samples.length
  console.log(`contextual tool round trip, server-side wait, ${samples.length} samples, localhost`)
  console.log(`  mean   ${mean.toFixed(2)} ms`)
  console.log(`  p50    ${percentile(sorted, 0.5).toFixed(2)} ms`)
  console.log(`  p90    ${percentile(sorted, 0.9).toFixed(2)} ms`)
  console.log(`  p99    ${percentile(sorted, 0.99).toFixed(2)} ms`)
  console.log(`  max    ${sorted[sorted.length - 1].toFixed(2)} ms`)
  console.log('')
  console.log('This is FIXED OVERHEAD only: both ends are on localhost. A deployment adds one real')
  console.log('client-to-server RTT per contextual tool call on top of it.')
}

main().catch(err => { console.error(err); process.exit(1) })

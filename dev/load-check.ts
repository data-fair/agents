/**
 * Load check for the server-held loop: how the running dev API copes with many live agent sessions.
 *
 * Not a benchmark — dev-api runs under nodemon in development mode, against the mock provider — but
 * enough to see the shape of the costs the loop moved onto the server: memory per held session,
 * what concurrent streaming turns do to the API's responsiveness, and whether anything is left
 * behind when the sockets go away.
 *
 * Run it (dev env must be up — `bash dev/status.sh`):
 *   npm run dev-load-check -- [--idle 300] [--turns 10,50,100,200] [--signed-in 50]
 *
 * It drives ANONYMOUS sessions (no login per socket, and the anonymous path now runs the same
 * executor) against organization/test1, whose settings it overwrites — the test suites rewrite them
 * on every run anyway. Plus one signed-in batch, which adds the HTTP create and the ownership checks.
 */
import { readFileSync, readlinkSync, readdirSync } from 'node:fs'
import { MongoClient } from 'mongodb'
import { superAdmin, axiosAuth, getAnonymousActionToken, directoryUrl, defaultQuotas } from '../tests/support/axios.ts'
import { putSettings } from '../tests/support/settings.ts'
import { openAgentSession, type AgentSessionClient } from '../tests/support/ws.ts'

const arg = (name: string, fallback: string) => {
  const at = process.argv.indexOf(`--${name}`)
  return at !== -1 ? process.argv[at + 1] : fallback
}
const IDLE = Number(arg('idle', '300'))
const TURN_LEVELS = arg('turns', '10,50,100,200').split(',').map(Number)
const SIGNED_IN = Number(arg('signed-in', '50'))
// Profile the API's CPU during each turns level, and print where the time went.
const PROFILE = process.argv.includes('--profile')
const PROFILE_MS = Number(arg('profile-ms', '0'))
const devApi = `http://localhost:${process.env.DEV_API_PORT}`

/** Where a profile's samples landed: self time per package (or api/shared file) and per function. */
const summariseProfile = (profile: any, top = 15) => {
  const byNode = new Map<number, any>(profile.nodes.map((n: any) => [n.id, n]))
  const self = new Map<number, number>()
  const deltas: number[] = profile.timeDeltas
  profile.samples.forEach((id: number, i: number) => self.set(id, (self.get(id) ?? 0) + (deltas[i] ?? 0) / 1000))
  const total = [...self.values()].reduce((a, b) => a + b, 0)
  const bucket = (url: string) => {
    if (!url) return '(native / idle / gc)'
    const nm = url.lastIndexOf('node_modules/')
    if (nm !== -1) {
      const rest = url.slice(nm + 'node_modules/'.length).split('/')
      return rest[0].startsWith('@') ? `${rest[0]}/${rest[1]}` : rest[0]
    }
    const m = /(api\/src|shared|tests)\/.*$/.exec(url)
    return m ? m[0] : url.replace(/^.*\//, '')
  }
  const byBucket = new Map<string, number>()
  const byFn = new Map<string, number>()
  for (const [id, t] of self) {
    const { callFrame } = byNode.get(id)
    const b = bucket(callFrame.url)
    byBucket.set(b, (byBucket.get(b) ?? 0) + t)
    const fn = `${callFrame.functionName || '(anonymous)'} ${b}:${callFrame.lineNumber + 1}`
    byFn.set(fn, (byFn.get(fn) ?? 0) + t)
  }
  const show = (m: Map<string, number>) => [...m].sort((a, b) => b[1] - a[1]).slice(0, top)
    .map(([k, v]) => `    ${(v / total * 100).toFixed(1).padStart(5)}%  ${Math.round(v)}ms  ${k}`).join('\n')
  console.log(`  profile: ${Math.round(total)}ms sampled\n  by package:\n${show(byBucket)}\n  by function:\n${show(byFn)}`)
}

/** The API's heap after a full collection: what is actually retained. */
const retainedHeapMb = async () => {
  const res = await fetch(`${devApi}/api/test-env/heap?gc`)
  const body = await res.json() as any
  return `heap used ${(body.heapUsed / 1048576).toFixed(0)}MB / total ${(body.heapTotal / 1048576).toFixed(0)}MB, external ${(body.external / 1048576).toFixed(0)}MB, rss ${(body.rss / 1048576).toFixed(0)}MB`
}
const OWNER = { type: 'organization', id: 'test1' } as const
const nginx = `http://localhost:${process.env.NGINX_PORT}/agents`

/** The dev-api node process of THIS worktree: the one running index.ts from its api/ directory. */
const apiPid = () => {
  const apiDir = new URL('../api', import.meta.url).pathname
  for (const pid of readdirSync('/proc').filter(name => /^\d+$/.test(name))) {
    try {
      if (readlinkSync(`/proc/${pid}/cwd`) !== apiDir) continue
      const cmd = readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0')
      // `node index.ts` exactly: nodemon's own command line names index.ts too.
      if (cmd[0].endsWith('node') && cmd[1] === 'index.ts') return pid
    } catch { /* gone, or not ours */ }
  }
  throw new Error('dev-api process not found — is it running?')
}
const rssMb = (pid: string) => Number(/VmRSS:\s+(\d+)/.exec(readFileSync(`/proc/${pid}/status`, 'utf8'))![1]) / 1024

const pct = (values: number[], p: number) => {
  if (!values.length) return NaN
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(p / 100 * sorted.length))]
}
const ms = (n: number) => `${Math.round(n)}ms`
const summary = (values: number[]) => `p50 ${ms(pct(values, 50))} p95 ${ms(pct(values, 95))} max ${ms(Math.max(...values))}`

/** Ping the API every 100ms while `during` runs: the event loop's latency, as any other request sees it. */
const probing = async <T>(during: () => Promise<T>) => {
  const latencies: number[] = []
  let running = true
  const loop = (async () => {
    while (running) {
      const started = performance.now()
      await fetch(`${nginx}/api/ping`).catch(() => {})
      latencies.push(performance.now() - started)
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  })()
  try {
    return { result: await during(), latencies }
  } finally {
    running = false
    await loop
  }
}

/** Sample the API's memory while `during` runs; the peak is what matters. */
const sampling = async <T>(pid: string, during: () => Promise<T>) => {
  let peak = rssMb(pid)
  const timer = setInterval(() => { peak = Math.max(peak, rssMb(pid)) }, 50)
  try {
    return { result: await during(), peak }
  } finally {
    clearInterval(timer)
  }
}

const settle = async (socket: AgentSessionClient, done: (frame: any) => boolean, timeoutMs = 60_000) => {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const frame = await socket.next(Math.max(1, deadline - Date.now()))
    if (frame.type === 'error') throw new Error(frame.message)
    if (done(frame)) return frame
  }
}

let token = ''
const anonymousHello = (socket: AgentSessionClient) =>
  socket.send({ type: 'hello', tools: [], account: OWNER, anonymousToken: token })

/** One streaming turn on a fresh socket: attach time, time to first token, whole turn, token count. */
const oneTurn = async (open: () => Promise<{ socket: AgentSessionClient, hello: () => void }>) => {
  const started = performance.now()
  const { socket, hello } = await open()
  try {
    hello()
    socket.send({ type: 'prompt', content: 'long answer' })
    await settle(socket, f => f.type === 'attached')
    const attachedAt = performance.now()
    let firstDelta = 0
    let deltas = 0
    await settle(socket, f => {
      if (f.type === 'delta') { deltas++; if (!firstDelta) firstDelta = performance.now() }
      return f.type === 'turn-end'
    })
    return { attach: attachedAt - started, firstToken: firstDelta - started, turn: performance.now() - started, deltas }
  } finally {
    socket.close()
  }
}

const anonymousOpen = async () => {
  const socket = await openAgentSession()
  return { socket, hello: () => anonymousHello(socket) }
}

/** The mongo server's operation counters: what a turn costs the database, read without touching it. */
const opcounters = async (mongo: MongoClient) => {
  const status = await mongo.db('admin').command({ serverStatus: 1 })
  const { insert, query, update, delete: del, getmore, command } = status.opcounters
  return { insert, query, update, delete: del, getmore, command }
}
const perTurn = (before: Record<string, number>, after: Record<string, number>, turns: number) =>
  Object.keys(before).map(k => `${k} ${((after[k] - before[k]) / turns).toFixed(1)}`).join(', ')

const leftoverAnonymous = async (mongo: MongoClient) =>
  await mongo.db().collection('conversations').countDocuments({ anonymous: true })

const main = async () => {
  const admin = await superAdmin
  await putSettings(admin, `${OWNER.type}/${OWNER.id}`, {
    providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
    models: [{
      model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
      usage: ['assistant', 'tools', 'summarizer'],
      inputPricePerMillion: 0,
      outputPricePerMillion: 0
    }],
    modelMapping: { assistant: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' } },
    quotas: { ...defaultQuotas, contrib: { unlimited: true, monthlyLimit: 0 }, anonymous: { unlimited: true, monthlyLimit: 0 } }
  })
  token = await getAnonymousActionToken()
  const mongo = await MongoClient.connect(`mongodb://localhost:${process.env.MONGO_PORT}/data-fair-agents-development`)
  const pid = apiPid()
  const leftBefore = await leftoverAnonymous(mongo)
  console.log(`dev-api pid ${pid}, rss ${rssMb(pid).toFixed(0)}MB, anonymous threads before: ${leftBefore}\n`)

  // 1. HELD SESSIONS. What a connected-but-quiet browser costs: each one holds a socket, a session,
  //    a host-event store and — anonymous — a stored thread.
  if (IDLE > 0) {
    const before = rssMb(pid)
    const sockets: AgentSessionClient[] = []
    const attach: number[] = []
    const { latencies } = await probing(async () => {
      for (let i = 0; i < IDLE; i++) {
        const started = performance.now()
        const socket = await openAgentSession()
        sockets.push(socket)
        anonymousHello(socket)
        await settle(socket, f => f.type === 'attached')
        attach.push(performance.now() - started)
      }
    })
    await new Promise(resolve => setTimeout(resolve, 2000))
    const held = rssMb(pid)
    const live = await (await fetch(`${nginx}/api/ping`)).text()
    console.log(`held ${IDLE} idle sessions: rss ${before.toFixed(0)} -> ${held.toFixed(0)}MB ` +
      `(~${((held - before) * 1024 / IDLE).toFixed(0)}KB each), attach ${summary(attach)}, ping while opening ${summary(latencies)} (${live})`)
    for (const socket of sockets) socket.close()
    await new Promise(resolve => setTimeout(resolve, 3000))
    console.log(`  closed: rss ${rssMb(pid).toFixed(0)}MB, anonymous threads left: ${await leftoverAnonymous(mongo) - leftBefore}\n`)
  }

  // 2. CONCURRENT STREAMING TURNS. Every socket prompts at once; the mock streams ~450 characters, one
  //    delta each, over ~4.5s — so a level of N is N turns overlapping almost entirely.
  for (const n of TURN_LEVELS) {
    const before = rssMb(pid)
    const opsBefore = await opcounters(mongo)
    // Started just before the turns, and long enough to cover their setup burst and their streaming.
    const profiling = PROFILE ? fetch(`${devApi}/api/test-env/cpu-profile?ms=${PROFILE_MS || Math.min(60_000, 5000 + n * 40)}`, { method: 'POST' }).then(r => r.json()) : undefined
    if (profiling) await new Promise(resolve => setTimeout(resolve, 200))
    const { result: { result: outcomes, peak }, latencies } = await probing(() =>
      sampling(pid, () => Promise.allSettled(Array.from({ length: n }, () => oneTurn(anonymousOpen)))))
    const ok = outcomes.flatMap(o => o.status === 'fulfilled' ? [o.value] : [])
    const failed = outcomes.flatMap(o => o.status === 'rejected' ? [String(o.reason?.message ?? o.reason)] : [])
    console.log(`${n} concurrent turns: ${ok.length} ok, ${failed.length} failed${failed.length ? ` (${[...new Set(failed)].slice(0, 3).join('; ')})` : ''}`)
    if (ok.length) {
      console.log(`  attach ${summary(ok.map(o => o.attach))}`)
      console.log(`  first token ${summary(ok.map(o => o.firstToken))}`)
      console.log(`  whole turn ${summary(ok.map(o => o.turn))}, deltas/turn p50 ${pct(ok.map(o => o.deltas), 50)}`)
    }
    console.log(`  ping during ${summary(latencies)}; rss ${before.toFixed(0)} -> peak ${peak.toFixed(0)}MB`)
    // Includes this script's own few reads and the other dev processes', so it is an upper bound.
    console.log(`  mongo ops per turn: ${perTurn(opsBefore, await opcounters(mongo), n)}`)
    if (profiling) summariseProfile(await profiling)
    await new Promise(resolve => setTimeout(resolve, 3000))
    console.log(`  after: ${await retainedHeapMb()}, anonymous threads left: ${await leftoverAnonymous(mongo) - leftBefore}\n`)
  }

  // 3. SIGNED-IN BATCH. The same turn, but through the HTTP create and the ownership checks a
  //    person's thread goes through — and leaving stored threads behind, as it should.
  if (SIGNED_IN > 0) {
    const member = await axiosAuth('test1-contrib1', { org: 'test1' })
    const cookie = await member.cookieJar.getCookieString(directoryUrl)
    const signedInOpen = async () => {
      const conversation = (await member.post('/api/conversations/organization/test1', { agentId: 'personal', title: 'load check' })).data
      const socket = await openAgentSession(cookie)
      return { socket, hello: () => socket.send({ type: 'hello', tools: [], conversationId: conversation.id }) }
    }
    const { result: outcomes, latencies } = await probing(() =>
      Promise.allSettled(Array.from({ length: SIGNED_IN }, () => oneTurn(signedInOpen))))
    const ok = outcomes.flatMap(o => o.status === 'fulfilled' ? [o.value] : [])
    const failed = outcomes.flatMap(o => o.status === 'rejected' ? [String(o.reason?.message ?? o.reason)] : [])
    console.log(`${SIGNED_IN} concurrent signed-in turns: ${ok.length} ok, ${failed.length} failed${failed.length ? ` (${[...new Set(failed)].slice(0, 3).join('; ')})` : ''}`)
    if (ok.length) console.log(`  first token ${summary(ok.map(o => o.firstToken))}, whole turn ${summary(ok.map(o => o.turn))}`)
    console.log(`  ping during ${summary(latencies)}\n`)
  }

  await mongo.close()
}

main().then(() => process.exit(0), err => { console.error(err); process.exit(1) })

/**
 * Dev fixtures: seed a few records into the RUNNING dev environment so the
 * activity / trace-review pages and the monitoring histograms have something to
 * show. It imitates the API test helpers (tests/support/axios.ts) but
 * authenticates as a real dev user (alban.mouton@koumoul.com) and targets dev
 * accounts, not test users.
 *
 * Run it (dev env must be up — `bash dev/status.sh`):
 *   npm run dev-fixtures
 *
 * Idempotent-ish: settings are upserted; conversations use stable ids, so a
 * re-run appends more turns to the same conversations rather than duplicating
 * them; usage records are upserted per period from a deterministic seed, so the
 * charts stay comparable between runs. It never deletes anything.
 *
 * The consumption records are display fixtures, but the per-user daily ones are
 * the same documents quota enforcement reads: with non-zero model prices, a
 * seeded member's daily quota starts partly consumed.
 */
import { axiosBuilder } from '@data-fair/lib-node/axios.js'
import { axiosAuth } from '@data-fair/lib-node/axios-auth.js'
import { pathToFileURL } from 'node:url'
import { encodeBreakdownKey } from '../api/src/usage/operations.ts'

const directoryUrl = `http://localhost:${process.env.NGINX_PORT}/simple-directory`
const baseURL = `http://localhost:${process.env.DEV_API_PORT}`
// Like tests/support/axios.ts: the API is addressed directly instead of through
// nginx, so nothing sets the x-forwarded-* headers the session middleware needs
// (superadmin sessions are IP-bound and reqIp throws without them).
const proxyHeaders = { 'x-forwarded-for': '127.0.0.1' }

// Mock-provider settings: the mock model answers "hello" with "world" and needs
// no API key, so the dev env can chat with zero external configuration.
// `providers`/`models` are superadmin-owned (PUT /api/settings/:type/:id); the
// rest is org-admin-owned (PUT /api/settings/:type/:id/org) — see writeSettings below.
const superadminSettingsData = {
  providers: [
    { id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }
  ],
  models: [{
    model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
    usage: ['assistant', 'tools', 'summarizer', 'evaluator', 'moderator'],
    inputPricePerMillion: 0,
    outputPricePerMillion: 0
  }]
}
const orgSettingsData = {
  modelMapping: {
    assistant: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' }
  },
  quotas: {
    admin: { unlimited: true, monthlyLimit: 0 },
    contrib: { unlimited: false, monthlyLimit: 100 },
    user: { unlimited: false, monthlyLimit: 50 },
    external: { unlimited: false, monthlyLimit: 0 },
    anonymous: { unlimited: false, monthlyLimit: 0 },
    untrusted: { unlimited: false, monthlyLimit: 0 }
  },
  // store traces so the seeded conversations show up on the review pages
  storeTraces: true
}

// One stored conversation: its experimental flags (shown as chips on the review
// page) and the per-turn message arrays sent to the gateway. Flags are constant
// per conversation in production, so we set them once per conversation here.
const conversations = [
  {
    ownerType: 'user', ownerId: 'albanm',
    convId: 'dev-fixture-explore',
    flags: { toolExploration: true, subAgents: true, mermaid: false },
    turns: [
      [{ role: 'user', content: 'hello' }],
      [{ role: 'user', content: 'hello' }, { role: 'assistant', content: 'world' }, { role: 'user', content: 'call tool weather {"city":"Paris"}' }]
    ]
  },
  {
    ownerType: 'user', ownerId: 'albanm',
    convId: 'dev-fixture-default',
    flags: { toolExploration: false, subAgents: true, mermaid: false },
    turns: [
      [{ role: 'user', content: 'hello' }]
    ]
  },
  {
    ownerType: 'organization', ownerId: 'dev1',
    convId: 'dev-fixture-mermaid',
    flags: { toolExploration: false, subAgents: false, mermaid: true },
    turns: [
      [{ role: 'user', content: 'hello' }],
      [{ role: 'user', content: 'what is the weather' }]
    ]
  }
]

// ---- consumption fixtures ----
//
// Pseudo usage for the monitoring histograms (account, per-user, platform),
// across every breakdown dimension. Written through the dev-only
// POST /api/test-env/usage endpoint the API tests already use: `usage`
// documents only, no gateway calls, no settings.

const USAGE_DAYS = 30
const USAGE_MONTHS = 12

interface Breakdown {
  modelRole: Record<string, number>
  model: Record<string, number>
  profile: Record<string, number>
  tokenType: Record<string, number>
}

interface UsageOwnerSpec {
  owner: { type: string, id: string }
  /** Average credits per day, spread over members/pool or used directly. */
  dailyBase: number
  /** Organization owners get per-user records for their members. */
  members?: { id: string, name: string, role: string }[]
  /** Profiles used when the owner consumes directly (personal accounts). */
  profiles?: string[]
}

const USAGE_OWNERS: UsageOwnerSpec[] = [
  {
    owner: { type: 'organization', id: 'dev1' },
    dailyBase: 40,
    members: [
      { id: 'dmeadus0', name: 'Danna Meadus', role: 'admin' },
      { id: 'albanm', name: 'Alban Mouton', role: 'admin' },
      { id: 'dev1-contrib1', name: 'Dev1 Contrib', role: 'contrib' },
      { id: 'dev1-user1', name: 'Dev1 User', role: 'user' }
    ]
  },
  { owner: { type: 'user', id: 'albanm' }, dailyBase: 12, profiles: ['admin', 'admin', 'admin', 'external'] },
  { owner: { type: 'user', id: 'dev-standalone1' }, dailyBase: 6, profiles: ['admin', 'external'] },
  { owner: { type: 'user', id: 'dmeadus0' }, dailyBase: 4, profiles: ['admin'] }
]

// Plausible model ids (one with a dot, to exercise the key encoding), mapped
// from the model roles the gateway bills under.
const MODEL_FOR_ROLE: Record<string, string[]> = {
  assistant: ['gpt-4o-mini', 'claude-sonnet-4-5'],
  tools: ['gpt-4o-mini'],
  summarizer: ['mistral-small-2503'],
  evaluator: ['glm-4.6'],
  moderator: ['glm-4.6']
}
const ROLE_WEIGHTS: [string, number][] = [
  ['assistant', 55], ['tools', 15], ['summarizer', 15], ['evaluator', 10], ['moderator', 5]
]

function hashString (value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function usageRng (key: string): () => number {
  let seed = hashString(key)
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickWeighted (weights: [string, number][], rand: () => number): string {
  const total = weights.reduce((sum, [, weight]) => sum + weight, 0)
  let point = rand() * total
  for (const [value, weight] of weights) {
    point -= weight
    if (point <= 0) return value
  }
  return weights[weights.length - 1][0]
}

function pickUniform<T> (values: T[], rand: () => number): T {
  return values[Math.floor(rand() * values.length)]
}

function emptyBreakdown (): Breakdown {
  return { modelRole: {}, model: {}, profile: {}, tokenType: { input: 0, cachedInput: 0, output: 0 } }
}

function addValue (values: Record<string, number>, key: string, value: number): void {
  values[key] = (values[key] ?? 0) + value
}

/** Simulate the calls behind one bucket: full cost per role/model/profile, split by token class. */
function makeBreakdown (cost: number, profiles: string[], rand: () => number): Breakdown {
  const breakdown = emptyBreakdown()
  const calls = 4 + Math.floor(rand() * 6)
  for (let i = 0; i < calls; i++) {
    const share = cost / calls
    const role = pickWeighted(ROLE_WEIGHTS, rand)
    addValue(breakdown.modelRole, role, share)
    addValue(breakdown.model, pickUniform(MODEL_FOR_ROLE[role], rand), share)
    addValue(breakdown.profile, pickUniform(profiles, rand), share)
    // plausible cache-read / fresh-input / output split, summing to the share
    const cachedInput = share * (0.05 + rand() * 0.15)
    const input = share * (0.5 + rand() * 0.15)
    breakdown.tokenType.cachedInput += cachedInput
    breakdown.tokenType.input += input
    breakdown.tokenType.output += share - input - cachedInput
  }
  return breakdown
}

function mergeBreakdown (target: Breakdown, source: Breakdown): void {
  for (const dimension of ['modelRole', 'model', 'profile', 'tokenType'] as const) {
    for (const [key, value] of Object.entries(source[dimension])) addValue(target[dimension], key, value)
  }
}

function encodeBreakdown (breakdown: Breakdown): Breakdown {
  const encoded = emptyBreakdown()
  for (const dimension of ['modelRole', 'model', 'profile', 'tokenType'] as const) {
    for (const [key, value] of Object.entries(breakdown[dimension])) {
      encoded[dimension][encodeBreakdownKey(key)] = value
    }
  }
  return encoded
}

function round2 (value: number): number {
  return Math.round(value * 100) / 100
}

function dailyPeriod (daysAgo: number): string {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
  return `daily:${date.toISOString().slice(0, 10)}`
}

function monthlyPeriod (monthsAgo: number): string {
  const now = new Date()
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1))
  return `monthly:${date.toISOString().slice(0, 7)}`
}

/** Weekends consume less; the current month is prorated to the day of month. */
function dayFactor (daysAgo: number): number {
  const day = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).getUTCDay()
  return day === 0 || day === 6 ? 0.35 : 1
}

function monthFactor (monthsAgo: number): number {
  if (monthsAgo > 0) return 1
  return Math.max(new Date().getUTCDate() / 30, 0.2)
}

interface UsageFixture {
  owner: { type: string, id: string }
  period: string
  cost: number
  breakdown: Breakdown
  userId?: string
  userName?: string
}

export async function seedConsumption (): Promise<void> {
  const ax = axiosBuilder({ baseURL })

  const postUsage = (fixture: UsageFixture) => ax.post('/api/test-env/usage', {
    ...fixture,
    cost: round2(fixture.cost),
    breakdown: encodeBreakdown(fixture.breakdown)
  })

  const seedOwner = async (spec: UsageOwnerSpec): Promise<void> => {
    const key = `${spec.owner.type}/${spec.owner.id}`
    let daily = 0
    let monthly = 0

    for (let daysAgo = 0; daysAgo < USAGE_DAYS; daysAgo++) {
      const rand = usageRng(`${key}|daily|${daysAgo}`)
      const period = dailyPeriod(daysAgo)
      const base = spec.dailyBase * dayFactor(daysAgo)

      if (spec.members && daysAgo < 7) {
        // The 7-day per-user view: members plus the untrusted pool, summed into
        // the account-level record so the global chart matches the per-user one.
        const accountBreakdown = emptyBreakdown()
        let accountCost = 0
        for (const member of spec.members) {
          // round before splitting so the layers sum exactly to the stored cost
          const cost = round2(base / spec.members.length * (0.5 + rand() * 1.2))
          const breakdown = makeBreakdown(cost, [member.role], rand)
          await postUsage({ ...spec, period, userId: member.id, userName: member.name, cost, breakdown })
          mergeBreakdown(accountBreakdown, breakdown)
          accountCost += cost
        }
        const poolCost = round2(base * 0.15 * (0.3 + rand()))
        const poolBreakdown = makeBreakdown(poolCost, ['external', 'anonymous'], rand)
        await postUsage({ ...spec, period, userId: 'pool:untrusted', cost: poolCost, breakdown: poolBreakdown })
        mergeBreakdown(accountBreakdown, poolBreakdown)
        accountCost += poolCost
        await postUsage({ ...spec, period, cost: accountCost, breakdown: accountBreakdown })
      } else {
        const cost = round2(base * (0.6 + rand() * 0.8))
        const profiles = spec.profiles ?? ['admin', 'contrib', 'user', 'external', 'anonymous']
        await postUsage({ ...spec, period, cost, breakdown: makeBreakdown(cost, profiles, rand) })
      }
      daily++
    }

    for (let monthsAgo = 0; monthsAgo < USAGE_MONTHS; monthsAgo++) {
      const rand = usageRng(`${key}|monthly|${monthsAgo}`)
      const cost = round2(spec.dailyBase * 18 * monthFactor(monthsAgo) * (0.7 + rand() * 0.6))
      const profiles = spec.profiles ?? ['admin', 'contrib', 'user', 'external', 'anonymous']
      await postUsage({ ...spec, period: monthlyPeriod(monthsAgo), cost, breakdown: makeBreakdown(cost, profiles, rand) })
      monthly++
    }

    console.log(`usage seeded for ${key}: ${daily} daily, ${monthly} monthly record(s)`)
  }

  for (const spec of USAGE_OWNERS) await seedOwner(spec)
}

async function main () {
  const creds = { email: 'alban.mouton@koumoul.com', password: 'passwd', axiosOpts: { baseURL, headers: proxyHeaders }, directoryUrl }
  // adminMode so the settings PUT (which requires admin mode) is accepted; albanm
  // is a global admin. This session also serves as the gateway caller for the
  // personal account (it is the owner, so role resolves to admin/unlimited).
  const adminAx = await axiosAuth({ ...creds, adminMode: true })
  // A session scoped INTO the dev1 org: the gateway resolves the caller's role
  // from org membership (admin), so quotas apply — an admin-mode personal session
  // would be seen as `external` on someone else's org and blocked.
  const orgAx = await axiosAuth({ ...creds, org: 'dev1' })
  const gatewayAxFor = (ownerType: string) => ownerType === 'organization' ? orgAx : adminAx

  const owners = [...new Set(conversations.map(c => `${c.ownerType}/${c.ownerId}`))]
  for (const owner of owners) {
    await adminAx.put(`/api/settings/${owner}`, superadminSettingsData)
    await adminAx.put(`/api/settings/${owner}/org`, orgSettingsData)
    console.log(`settings written for ${owner}`)
  }

  for (const conv of conversations) {
    const ax = gatewayAxFor(conv.ownerType)
    // The gateway records the agent-chat-flags cookie onto each stored trace.
    // Scope it to the gateway path so the jar sends it only on these calls.
    const flagCookie = `agent-chat-flags=${encodeURIComponent(JSON.stringify(conv.flags))}; Path=/api/gateway; SameSite=Lax`
    await ax.cookieJar.setCookie(flagCookie, baseURL)

    for (let i = 0; i < conv.turns.length; i++) {
      await ax.post(`/api/gateway/${conv.ownerType}/${conv.ownerId}/v1/chat/completions`,
        { model: 'assistant', messages: conv.turns[i] },
        { headers: { 'x-trace-consent': 'yes', 'x-trace-conversation': conv.convId, 'x-trace-ctx': `turn:${conv.convId}-${i}` } })
    }
    console.log(`seeded conversation ${conv.convId} (${conv.ownerType}/${conv.ownerId}, ${conv.turns.length} turn(s))`)
  }

  // Traces are written fire-and-forget; wait until they are queryable so the
  // script's success means the data is really there.
  for (const owner of owners) {
    const expected = conversations.filter(c => `${c.ownerType}/${c.ownerId}` === owner).length
    let count = 0
    for (let i = 0; i < 50 && count < expected; i++) {
      const res = await adminAx.get(`/api/traces/${owner}`)
      count = res.data.results.length
      if (count < expected) await new Promise(resolve => setTimeout(resolve, 100))
    }
    console.log(`${owner}: ${count} stored conversation(s)`)
  }

  await seedConsumption()

  const ui = `http://localhost:${process.env.NGINX_PORT}/agents`
  console.log('\nDone. Browse the seeded data at:')
  for (const owner of owners) console.log(`  activity: ${ui}/${owner}/activity`)
  for (const conv of conversations) console.log(`  review:   ${ui}/traces/${conv.convId}/review`)
  console.log(`  usage:    ${ui}/organization/dev1 (account + per-user), ${ui}/user/albanm, ${ui}/admin (platform)`)
}

// Only run when invoked directly (`npm run dev-fixtures`), so the seeding
// helpers can be imported without side effects.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(() => {
    // Force exit: the authenticated axios clients keep HTTP keep-alive sockets
    // open, which would otherwise keep the event loop alive and hang the process.
    process.exit(0)
  }).catch(err => {
    console.error('fixtures failed:', err?.response?.data ?? err?.message ?? err)
    process.exit(1)
  })
}

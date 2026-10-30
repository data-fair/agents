/**
 * Usage-accounting layout bench: daily + weekly + monthly documents per scope (what the store does),
 * against daily documents only, with the weekly and monthly totals summed when read.
 *
 * Every priced model call writes usage for up to three scopes (the person, the account aggregate, the
 * untrusted pool), and every turn's quota check reads it back. Daily-only writes a third as many
 * documents per call (the stored count barely changes: daily documents dominate the history either
 * way), but the check then reads up to ~37 daily documents per scope (a month, and a week that may
 * start in the previous one) instead of three. This measures both sides at
 * the end of a month, the worst case for the read.
 *
 * Runs in its own database on the dev mongo, dropped at the end:
 *   npx dotenv -- node dev/bench-usage.ts
 */
import { MongoClient } from 'mongodb'

const USERS = 2000
const DAYS = 28 // history already recorded this month: the read's worst case comes at the month's end
const CALLS = 5000
const CHECKS = 5000
const CONCURRENCY = 100
const owner = { type: 'organization', id: 'bench-org' }

// A recorded call's increments: the cost and its per-dimension breakdown, as recordIncrements builds.
const increments = (cost: number) => ({
  cost,
  'byModelRole.assistant': cost,
  'byModel.mock-model': cost,
  'byProfile.contrib': cost,
  'tokenCosts.input': cost * 0.6,
  'tokenCosts.cachedInput': 0,
  'tokenCosts.output': cost * 0.4
})

const day = (d: number) => `daily:2026-10-${String(d).padStart(2, '0')}`
const TODAY = day(DAYS)
// ISO week of 2026-10-28 starts on Monday the 26th; the month on the 1st.
const WEEK_KEY = 'weekly:2026-W44'
const MONTH_KEY = 'monthly:2026-10'
const WEEK_DAYS = [26, 27, 28].map(day)

const client = await MongoClient.connect(`mongodb://localhost:${process.env.MONGO_PORT}/agents-bench-usage`, { maxPoolSize: CONCURRENCY })
const db = client.db()
const admin = client.db('admin')
const wt = async () => {
  const s = await admin.command({ serverStatus: 1 })
  return { journal: Number(s.wiredTiger.log['log bytes written']), checkpoint: Number(s.wiredTiger.cache['bytes written from cache']) }
}
const pct = (values: number[], p: number) => [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(p / 100 * values.length))]
const kb = (bytes: number) => `${(bytes / 1024).toFixed(2)}KB`
const mb = (bytes: number) => `${(bytes / 1048576).toFixed(1)}MB`

/** Run `n` tasks, `CONCURRENCY` at a time; each task's latency, and the wall time. */
const load = async (n: number, task: (i: number) => Promise<unknown>) => {
  const latencies: number[] = []
  let next = 0
  const started = performance.now()
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (next < n) {
      const i = next++
      const t = performance.now()
      await task(i)
      latencies.push(performance.now() - t)
    }
  }))
  return { latencies, wall: performance.now() - started }
}
const report = (label: string, { latencies, wall }: { latencies: number[], wall: number }, n: number) =>
  console.log(`  ${label}: p50 ${pct(latencies, 50).toFixed(2)}ms  p95 ${pct(latencies, 95).toFixed(2)}ms  (${Math.round(n / (wall / 1000))}/s)`)

const scopes = (userId: string) => [{ ...ownerKeys, userId }, { ...ownerKeys, userId: { $exists: false } }]
const ownerKeys = { 'owner.type': owner.type, 'owner.id': owner.id }
const upsert = (scope: any, period: string, cost: number) => ({
  updateOne: {
    filter: { ...scope, period },
    update: { $inc: increments(cost), $set: { updatedAt: new Date().toISOString() }, $setOnInsert: { owner, ...(typeof scope.userId === 'string' ? { userId: scope.userId } : {}), period } },
    upsert: true
  }
})

interface Layout {
  name: string
  periodsWritten: string[]
  seed: (userId: string | undefined) => any[]
  read?: (userId: string) => Promise<number>
}

const seedDoc = (userId: string | undefined, period: string, cost: number) => ({ owner, ...(userId ? { userId } : {}), period, ...Object.fromEntries(Object.entries(increments(cost))) })

const layouts: Array<Layout & { reads: Record<string, (userId: string) => Promise<number>> }> = [
  {
    name: 'A. daily + weekly + monthly (today)',
    periodsWritten: [TODAY, WEEK_KEY, MONTH_KEY],
    seed: userId => [
      ...Array.from({ length: DAYS }, (_, i) => seedDoc(userId, day(i + 1), 1)),
      seedDoc(userId, WEEK_KEY, WEEK_DAYS.length),
      seedDoc(userId, MONTH_KEY, DAYS)
    ],
    reads: {
      'three findOne per scope (today)': async userId => {
        let total = 0
        for (const scope of scopes(userId)) {
          const docs = await Promise.all([TODAY, WEEK_KEY, MONTH_KEY].map(period => db.collection('usage').findOne({ ...scope, period }, { projection: { _id: 0, cost: 1 } })))
          total += docs.reduce((sum, d) => sum + (d?.cost ?? 0), 0)
        }
        return total
      },
      'one $in find per scope': async userId => {
        let total = 0
        for (const scope of scopes(userId)) {
          const docs = await db.collection('usage').find({ ...scope, period: { $in: [TODAY, WEEK_KEY, MONTH_KEY] } }, { projection: { _id: 0, cost: 1 } }).toArray()
          total += docs.reduce((sum, d) => sum + (d.cost ?? 0), 0)
        }
        return total
      }
    }
  },
  {
    name: 'B. daily only, weekly and monthly summed on read',
    periodsWritten: [TODAY],
    seed: userId => Array.from({ length: DAYS }, (_, i) => seedDoc(userId, day(i + 1), 1)),
    reads: {
      'one range find per scope, summed': async userId => {
        let total = 0
        for (const scope of scopes(userId)) {
          // The month's daily documents (and, in general, those of a week begun last month).
          const docs = await db.collection('usage').find({ ...scope, period: { $gte: day(1), $lte: TODAY } }, { projection: { _id: 0, cost: 1, period: 1 } }).toArray()
          total += docs.reduce((sum, d) => sum + (d.cost ?? 0), 0)
        }
        return total
      }
    }
  }
]

const hello = await admin.command({ hello: 1 })
console.log(`mongo ${(await admin.command({ buildInfo: 1 })).version}, ${hello.setName ? 'replica set' : 'standalone (no oplog)'}; ${USERS} users with ${DAYS} days of history, ${CONCURRENCY} concurrent`)
try {
  for (const layout of layouts) {
    await db.dropDatabase()
    const usage = db.collection('usage')
    await usage.createIndex({ 'owner.type': 1, 'owner.id': 1, userId: 1, period: 1 }, { unique: true })
    const users = Array.from({ length: USERS }, (_, i) => `user-${i}`)
    for (let i = 0; i < users.length; i += 100) await usage.insertMany(users.slice(i, i + 100).flatMap(u => layout.seed(u)))
    await usage.insertMany(layout.seed(undefined))
    await admin.command({ fsync: 1 })
    const stats = await db.command({ collStats: 'usage' })
    console.log(`\n${layout.name}: ${stats.count} documents, data ${mb(stats.size)}, indexes ${mb(stats.totalIndexSize)}`)

    // WRITES: one model call by one person — their scope and the account's, every period written.
    const before = await wt()
    const writes = await load(CALLS, i => {
      const userId = users[i % USERS]
      return usage.bulkWrite(scopes(userId).flatMap(scope => layout.periodsWritten.map(period => upsert(scope, period, 1))), { ordered: false })
    })
    await admin.command({ fsync: 1 })
    const after = await wt()
    report(`a call's usage write (${scopes('x').length * layout.periodsWritten.length} upserts, one bulkWrite)`, writes, CALLS)
    console.log(`    journal ${kb((after.journal - before.journal) / CALLS)}/call, checkpoint ${kb((after.checkpoint - before.checkpoint) / CALLS)}/call`)

    // READS: a turn's quota check for one person — their scope and the account's.
    for (const [label, read] of Object.entries(layout.reads)) {
      report(`quota check, ${label}`, await load(CHECKS, i => read(users[i % USERS])), CHECKS)
    }
  }
} finally {
  await db.dropDatabase()
  await client.close()
}

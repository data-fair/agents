/**
 * Storage-side cost of the message granularity: what each layout costs MongoDB itself — data and
 * index size per message, cache, journal and checkpoint bytes per turn — rather than what the API
 * process sees. Companion to dev/bench-granularity.ts, with the REAL index set of each layout.
 *
 * Runs in its own database on the dev mongo, dropped at the end:
 *   npx dotenv -- node dev/bench-storage.ts
 */
import { MongoClient, type Db } from 'mongodb'

const CONVERSATIONS = 5000
const TURNS = 10 // a compaction window's worth: what a conversation holds between two compactions
const NEW_TURNS = 1000

const text = (bytes: number) => 'x'.repeat(bytes)
// Not compressible to nothing: WiredTiger's snappy would make 'xxxx' free, which flatters every
// layout equally but hides the data/index ratio.
const noise = (bytes: number) => { let s = ''; while (s.length < bytes) s += Math.random().toString(36).slice(2); return s.slice(0, bytes) }
const userMessage = () => ({ role: 'user', parts: [{ type: 'text', text: noise(400) }] })
const assistantParts = (i: number) => [
  { type: 'dynamic-tool', toolName: 'query', toolCallId: `c${i}`, state: 'output-available', input: { q: noise(200) }, output: noise(i % 10 === 0 ? 30_000 : 6_000) },
  { type: 'text', text: noise(1500) }
]
const id = () => Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12)

interface Layout {
  name: string
  collection: string
  indexes: Array<[Record<string, 1 | -1>, Record<string, unknown>]>
  seed: (conversationId: string, turns: number) => any[]
  /** One new turn, final write only: what the store gets now for a watched chat. */
  turn: (db: Db, conversationId: string, i: number) => Promise<void>
}

const layouts: Layout[] = [
  {
    name: 'A. document per message (today)',
    collection: 'messages',
    // As in api/src/mongo.ts: version-keys, main-keys, id-keys (+ _id).
    indexes: [[{ conversationId: 1, version: 1 }, {}], [{ conversationId: 1, seq: 1 }, { unique: true }], [{ id: 1 }, { unique: true }]],
    seed: (conversationId, turns) => Array.from({ length: turns }, (_, i) => [
      { id: id(), conversationId, seq: 2 * i + 1, version: 4 * i + 1, ...userMessage() },
      { id: id(), conversationId, seq: 2 * i + 2, version: 4 * i + 3, role: 'assistant', parts: assistantParts(i) }
    ]).flat(),
    turn: async (db, conversationId, i) => {
      const c = db.collection('messages')
      await c.insertOne({ id: id(), conversationId, seq: 2 * i + 1, version: 4 * i + 1, ...userMessage() })
      const messageId = id()
      await c.insertOne({ id: messageId, conversationId, seq: 2 * i + 2, version: 4 * i + 2, role: 'assistant', parts: [], pending: true })
      await c.updateOne({ id: messageId, conversationId }, { $set: { parts: assistantParts(i), pending: false, version: 4 * i + 3 } })
    }
  },
  {
    name: 'B. document per turn',
    collection: 'turns',
    indexes: [[{ conversationId: 1, version: 1 }, {}], [{ conversationId: 1, seq: 1 }, { unique: true }]],
    seed: (conversationId, turns) => Array.from({ length: turns }, (_, i) => (
      { conversationId, seq: i + 1, version: 3 * i + 2, user: userMessage(), assistant: { role: 'assistant', parts: assistantParts(i) } }
    )),
    turn: async (db, conversationId, i) => {
      const c = db.collection('turns')
      await c.insertOne({ conversationId, seq: i + 1, version: 3 * i + 1, user: userMessage(), assistant: { role: 'assistant', parts: [], pending: true } })
      await c.updateOne({ conversationId, seq: i + 1 }, { $set: { 'assistant.parts': assistantParts(i), 'assistant.pending': false, version: 3 * i + 2 } })
    }
  },
  {
    name: 'C. document per compaction segment',
    collection: 'segments',
    indexes: [[{ conversationId: 1 }, { unique: true }]],
    seed: (conversationId, turns) => [{
      conversationId,
      version: 2 * turns,
      messages: Array.from({ length: turns }, (_, i) => [userMessage(), { role: 'assistant', parts: assistantParts(i) }]).flat()
    }],
    turn: async (db, conversationId, i) => {
      const c = db.collection('segments')
      await c.updateOne({ conversationId }, { $push: { messages: { $each: [userMessage(), { role: 'assistant', parts: [], pending: true }] } }, $inc: { version: 1 } } as any)
      const at = 2 * i + 1
      await c.updateOne({ conversationId }, { $set: { [`messages.${at}.parts`]: assistantParts(i), [`messages.${at}.pending`]: false }, $inc: { version: 1 } })
    }
  }
]

const client = await MongoClient.connect(`mongodb://localhost:${process.env.MONGO_PORT}/agents-bench-storage`, { maxPoolSize: 100 })
const db = client.db()
const admin = client.db('admin')

const wt = async () => {
  const s = await admin.command({ serverStatus: 1 })
  return {
    journal: Number(s.wiredTiger.log['log bytes written']),
    checkpoint: Number(s.wiredTiger.cache['bytes written from cache']),
    cache: Number(s.wiredTiger.cache['bytes currently in the cache'])
  }
}
const mb = (bytes: number) => `${(bytes / 1048576).toFixed(1)}MB`
const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)}KB`

const hello = await admin.command({ hello: 1 })
console.log(`mongo ${(await admin.command({ buildInfo: 1 })).version}, ${hello.setName ? `replica set ${hello.setName} (oplog in play)` : 'standalone (no oplog: replica-set write cost is NOT measured here)'}`)

try {
  for (const layout of layouts) {
    await db.dropDatabase()
    const c = db.collection(layout.collection)
    for (const [keys, options] of layout.indexes) await c.createIndex(keys, options)
    const ids = Array.from({ length: CONVERSATIONS }, (_, i) => `conversation-${i}-${id()}`)
    for (let i = 0; i < ids.length; i += 200) {
      await c.insertMany(ids.slice(i, i + 200).flatMap(conversationId => layout.seed(conversationId, TURNS)))
    }
    await admin.command({ fsync: 1 })
    const stats = await db.command({ collStats: layout.collection })
    const messages = CONVERSATIONS * TURNS * 2
    console.log(`\n${layout.name}: ${stats.count} documents for ${messages} messages`)
    console.log(`  data ${mb(stats.size)} (${kb(stats.size / messages)}/message), on disk ${mb(stats.storageSize)} compressed`)
    console.log(`  indexes ${mb(stats.totalIndexSize)} (${(stats.totalIndexSize / messages).toFixed(0)} bytes/message, ${(100 * stats.totalIndexSize / stats.storageSize).toFixed(1)}% of the data on disk): ` +
      Object.entries(stats.indexSizes as Record<string, number>).map(([name, size]) => `${name} ${mb(size)}`).join(', '))

    // New turns on existing conversations, final write only — then a checkpoint, so the bytes it
    // writes are counted too.
    const before = await wt()
    for (let i = 0; i < NEW_TURNS; i += 100) {
      await Promise.all(ids.slice(i, i + 100).map(conversationId => layout.turn(db, conversationId, TURNS)))
    }
    await admin.command({ fsync: 1 })
    const after = await wt()
    console.log(`  per new turn: journal ${kb((after.journal - before.journal) / NEW_TURNS)}, checkpoint ${kb((after.checkpoint - before.checkpoint) / NEW_TURNS)}`)
  }

  // THE CLAIM UNDER TEST, isolated: a small $set on a large document vs on a small one.
  console.log('\nOne small $set (a 5-byte field), 500 times, on documents of different sizes:')
  for (const size of [1_000, 100_000, 600_000]) {
    await db.dropDatabase()
    const c = db.collection('docs')
    await c.insertMany(Array.from({ length: 500 }, (_, i) => ({ _id: i as any, body: noise(size), flag: 'aaaaa' })))
    await admin.command({ fsync: 1 })
    const before = await wt()
    await Promise.all(Array.from({ length: 500 }, (_, i) => c.updateOne({ _id: i as any }, { $set: { flag: 'bbbbb' } })))
    await admin.command({ fsync: 1 })
    const after = await wt()
    console.log(`  ${kb(size).padStart(8)} document: journal ${kb((after.journal - before.journal) / 500)}/update, checkpoint ${kb((after.checkpoint - before.checkpoint) / 500)}/update`)
  }
} finally {
  await db.dropDatabase()
  await client.close()
}

/**
 * Storage granularity bench: one document per message (what the store does), per turn, or per
 * compaction segment (a whole short conversation in one document).
 *
 * The question it answers: does a coarser grain buy a cheaper turn? A turn READS its history (one
 * query, whatever the grain) and WRITES its messages — the person's, then the answer, persisted while it
 * streams (every 2s) and once at the end. A coarser grain trades documents for document SIZE, and
 * MongoDB rewrites a whole document on any update, so the write side is where it should show.
 *
 * Runs in its own database on the dev mongo, dropped at the end:
 *   npx dotenv -- node dev/bench-granularity.ts
 */
import { MongoClient, type Db } from 'mongodb'

const CONVERSATIONS = 100
const LENGTHS = [5, 20, 60] // turns already in the conversation
// 3: a ~6s answer persisted every 2s, then the final write; 0: the final write only.
const PERSIST_MODES = [3, 0]
let PARTIAL_PERSISTS = 3

const text = (bytes: number) => 'x'.repeat(bytes)
const userMessage = () => ({ role: 'user', parts: [{ type: 'text', text: text(400) }] })
/** An answer with a tool call: ~8KB typically, one in ten carries a 30KB tool result. */
const assistantParts = (i: number, progress = 1) => [
  { type: 'dynamic-tool', toolName: 'query', toolCallId: `c${i}`, state: 'output-available', input: { q: text(200) }, output: text(i % 10 === 0 ? 30_000 : 6_000) },
  { type: 'text', text: text(Math.round(1500 * progress)) }
]

interface Layout {
  name: string
  seed: (db: Db, conversationId: string, turns: number) => Promise<void>
  load: (db: Db, conversationId: string) => Promise<unknown[]>
  turn: (db: Db, conversationId: string, turnIndex: number) => Promise<void>
  indexes: (db: Db) => Promise<void>
}

const perMessage: Layout = {
  name: 'A. document per message',
  indexes: async db => { await db.collection('messages').createIndex({ conversationId: 1, seq: 1 }, { unique: true }) },
  seed: async (db, conversationId, turns) => {
    const docs = []
    for (let i = 0; i < turns; i++) {
      docs.push({ conversationId, seq: 2 * i + 1, ...userMessage() })
      docs.push({ conversationId, seq: 2 * i + 2, role: 'assistant', parts: assistantParts(i) })
    }
    if (docs.length) await db.collection('messages').insertMany(docs)
  },
  load: async (db, conversationId) => await db.collection('messages').find({ conversationId }, { projection: { _id: 0, role: 1, parts: 1, seq: 1 } }).sort({ seq: 1 }).toArray(),
  turn: async (db, conversationId, i) => {
    const seq = 2 * i + 1
    await db.collection('messages').insertOne({ conversationId, seq, ...userMessage() })
    await db.collection('messages').insertOne({ conversationId, seq: seq + 1, role: 'assistant', parts: [], pending: true })
    for (let p = 1; p <= PARTIAL_PERSISTS; p++) {
      await db.collection('messages').updateOne({ conversationId, seq: seq + 1 }, { $set: { parts: assistantParts(i, p / (PARTIAL_PERSISTS + 1)) } })
    }
    await db.collection('messages').updateOne({ conversationId, seq: seq + 1 }, { $set: { parts: assistantParts(i), pending: false } })
  }
}

const perTurn: Layout = {
  name: 'B. document per turn',
  indexes: async db => { await db.collection('turns').createIndex({ conversationId: 1, seq: 1 }, { unique: true }) },
  seed: async (db, conversationId, turns) => {
    const docs = []
    for (let i = 0; i < turns; i++) docs.push({ conversationId, seq: i + 1, user: userMessage(), assistant: { role: 'assistant', parts: assistantParts(i) } })
    if (docs.length) await db.collection('turns').insertMany(docs)
  },
  load: async (db, conversationId) => await db.collection('turns').find({ conversationId }, { projection: { _id: 0 } }).sort({ seq: 1 }).toArray(),
  turn: async (db, conversationId, i) => {
    const seq = i + 1
    await db.collection('turns').insertOne({ conversationId, seq, user: userMessage(), assistant: { role: 'assistant', parts: [], pending: true } })
    for (let p = 1; p <= PARTIAL_PERSISTS; p++) {
      await db.collection('turns').updateOne({ conversationId, seq }, { $set: { 'assistant.parts': assistantParts(i, p / (PARTIAL_PERSISTS + 1)) } })
    }
    await db.collection('turns').updateOne({ conversationId, seq }, { $set: { 'assistant.parts': assistantParts(i), 'assistant.pending': false } })
  }
}

const perSegment: Layout = {
  name: 'C. document per compaction segment',
  indexes: async db => { await db.collection('segments').createIndex({ conversationId: 1 }, { unique: true }) },
  seed: async (db, conversationId, turns) => {
    const messages = []
    for (let i = 0; i < turns; i++) messages.push(userMessage(), { role: 'assistant', parts: assistantParts(i) })
    await db.collection('segments').insertOne({ conversationId, messages })
  },
  load: async (db, conversationId) => (await db.collection('segments').findOne({ conversationId }, { projection: { _id: 0, messages: 1 } }))?.messages ?? [],
  turn: async (db, conversationId, i) => {
    // The person's message and the pending answer in one $push; then the answer patched in place by
    // its index, which is the cheapest update this layout allows.
    await db.collection('segments').updateOne({ conversationId }, { $push: { messages: { $each: [userMessage(), { role: 'assistant', parts: [], pending: true }] } } } as any)
    const at = 2 * i + 1
    for (let p = 1; p <= PARTIAL_PERSISTS; p++) {
      await db.collection('segments').updateOne({ conversationId }, { $set: { [`messages.${at}.parts`]: assistantParts(i, p / (PARTIAL_PERSISTS + 1)) } })
    }
    await db.collection('segments').updateOne({ conversationId }, { $set: { [`messages.${at}.parts`]: assistantParts(i), [`messages.${at}.pending`]: false } })
  }
}

const pct = (values: number[], p: number) => [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(p / 100 * values.length))]
const timed = async (fn: () => Promise<unknown>) => { const t = performance.now(); await fn(); return performance.now() - t }

/** Bytes the storage engine wrote, which is where a whole-document rewrite shows up. */
const bytesWritten = async (client: MongoClient) => {
  const status = await client.db('admin').command({ serverStatus: 1 })
  return Number(status.wiredTiger?.cache?.['bytes written from cache'] ?? 0)
}

const client = await MongoClient.connect(`mongodb://localhost:${process.env.MONGO_PORT}/agents-bench-granularity`, { maxPoolSize: 100 })
const db = client.db()
try {
  for (const persists of PERSIST_MODES) for (const turns of LENGTHS) {
    PARTIAL_PERSISTS = persists
    console.log(`\n=== ${persists ? `${persists} streaming persists + final` : 'final write only'}, conversations of ${turns} turns (${CONVERSATIONS} of them, all concurrently) ===`)
    for (const layout of [perMessage, perTurn, perSegment]) {
      await db.dropDatabase()
      await layout.indexes(db)
      const ids = Array.from({ length: CONVERSATIONS }, (_, i) => `c${i}`)
      await Promise.all(ids.map(id => layout.seed(db, id, turns)))

      // Warm the cache once, so every layout is measured on the same footing.
      await Promise.all(ids.map(id => layout.load(db, id)))
      const loads = await Promise.all(ids.map(id => timed(() => layout.load(db, id))))

      const before = await bytesWritten(client)
      const started = performance.now()
      const writes = await Promise.all(ids.map(id => timed(() => layout.turn(db, id, turns))))
      const wall = performance.now() - started
      // Give the engine a moment to write the dirty pages out, so the byte count includes them.
      await client.db('admin').command({ fsync: 1 })
      const written = await bytesWritten(client) - before

      const docSize = layout === perSegment
        ? (await db.collection('segments').aggregate([{ $group: { _id: null, avg: { $avg: { $bsonSize: '$$ROOT' } } } }]).toArray())[0]?.avg
        : undefined
      console.log(`${layout.name}${docSize ? ` (segment ~${Math.round(docSize / 1024)}KB)` : ''}`)
      console.log(`  history load  p50 ${pct(loads, 50).toFixed(1)}ms  p95 ${pct(loads, 95).toFixed(1)}ms`)
      console.log(`  a turn's writes  p50 ${pct(writes, 50).toFixed(1)}ms  p95 ${pct(writes, 95).toFixed(1)}ms  (all ${CONVERSATIONS}: ${wall.toFixed(0)}ms)`)
      console.log(`  storage engine wrote ~${(written / 1048576).toFixed(1)}MB for ${CONVERSATIONS} turns`)
    }
  }
} finally {
  await db.dropDatabase()
  await client.close()
}

/**
 * Which collections one chat turn touches, and how: the dev database's profiler switched on around a
 * single anonymous turn, then off again.
 *
 *   npx dotenv -- node dev/mongo-ops.ts
 */
import { MongoClient } from 'mongodb'
import { getAnonymousActionToken } from '../tests/support/axios.ts'
import { openAgentSession } from '../tests/support/ws.ts'

const mongo = await MongoClient.connect(`mongodb://localhost:${process.env.MONGO_PORT}/data-fair-agents-development`)
const db = mongo.db()
await db.command({ profile: 0 })
await db.collection('system.profile').drop().catch(() => {})
const since = new Date()
await db.command({ profile: 2 })
try {
  const socket = await openAgentSession()
  socket.send({ type: 'hello', tools: [], account: { type: 'organization', id: 'test1' }, anonymousToken: await getAnonymousActionToken() })
  socket.send({ type: 'prompt', content: 'hello' })
  for (;;) {
    const frame = await socket.next(20_000)
    if (frame.type === 'error') throw new Error(frame.message)
    if (frame.type === 'turn-end') break
  }
  socket.close()
  await new Promise(resolve => setTimeout(resolve, 1500))
} finally {
  await db.command({ profile: 0 })
}
const ops = await db.collection('system.profile').find({ ts: { $gte: since } }).toArray()
const counts = new Map<string, number>()
for (const op of ops) {
  const kind = op.op === 'command' ? `command:${Object.keys(op.command ?? {})[0]}` : op.op
  const key = `${op.ns.replace(/^[^.]*\./, '')} ${kind}`
  counts.set(key, (counts.get(key) ?? 0) + 1)
}
for (const [key, n] of [...counts].sort((a, b) => b[1] - a[1])) console.log(`${String(n).padStart(4)}  ${key}`)
await mongo.close()
process.exit(0)

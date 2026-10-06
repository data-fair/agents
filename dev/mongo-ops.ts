/**
 * Which mongo operations one chat turn performs, in order: the dev database's profiler switched on
 * around a single turn, then off again.
 *
 *   npx dotenv -- node dev/mongo-ops.ts [--anonymous]
 *
 * Signed in by default (test1-admin1, a thread created over HTTP first, so its creation is not
 * counted); `--anonymous` drives the anonymous path, whose hello creates the thread and whose close
 * purges it — both counted, since they are that path's per-thread cost.
 */
import { MongoClient } from 'mongodb'
import { axiosAuth, getAnonymousActionToken, directoryUrl } from '../tests/support/axios.ts'
import { openAgentSession } from '../tests/support/ws.ts'

const anonymous = process.argv.includes('--anonymous')
const mongo = await MongoClient.connect(`mongodb://localhost:${process.env.MONGO_PORT}/data-fair-agents-development`)
const db = mongo.db()

let cookie: string | undefined
let conversationId: string | undefined
if (!anonymous) {
  const member = await axiosAuth('test1-admin1', { org: 'test1' })
  cookie = await member.cookieJar.getCookieString(directoryUrl)
  conversationId = (await member.post('/api/conversations/organization/test1', { agentId: 'personal', title: 'mongo-ops' })).data.id
}
const token = anonymous ? await getAnonymousActionToken() : undefined
// A warm-up turn on its own thread, so the caches (settings, tool listings) are in the state a
// running server keeps them in: the profile is of a steady-state turn, not a cold one.
{
  const socket = await openAgentSession(cookie)
  socket.send(anonymous
    ? { type: 'hello', tools: [], account: { type: 'organization', id: 'test1' }, anonymousToken: token }
    : { type: 'hello', tools: [], conversationId })
  socket.send({ type: 'prompt', content: 'hello' })
  for (;;) { const f = await socket.next(20_000); if (f.type === 'turn-end') break }
  socket.close()
  await new Promise(resolve => setTimeout(resolve, 500))
}

await db.command({ profile: 0 })
await db.collection('system.profile').drop().catch(() => {})
const since = new Date()
await db.command({ profile: 2 })
try {
  const socket = await openAgentSession(cookie)
  socket.send(anonymous
    ? { type: 'hello', tools: [], account: { type: 'organization', id: 'test1' }, anonymousToken: token }
    : { type: 'hello', tools: [], conversationId })
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

/** A short description of what an operation targeted: its filter's keys, or its update's operators. */
const shape = (op: any) => {
  const cmd = op.command ?? {}
  const filter = cmd.filter ?? cmd.q ?? cmd.query ?? cmd.updates?.[0]?.q ?? cmd.deletes?.[0]?.q ?? (cmd.pipeline ? { pipeline: cmd.pipeline.map((s: any) => Object.keys(s)[0]) } : undefined)
  const update = cmd.update ?? cmd.updates?.[0]?.u
  const keys = filter ? Object.keys(filter).join(',') : ''
  const ops = update && typeof update === 'object' ? Object.keys(update).filter(k => k.startsWith('$')).map(k => `${k}{${Object.keys(update[k]).join(',')}}`).join(' ') : ''
  return [keys && `by ${keys}`, ops].filter(Boolean).join(' ')
}
const ops = await db.collection('system.profile').find({ ts: { $gte: since }, ns: { $not: /system\.profile$/ } }).sort({ ts: 1 }).toArray()
const kind = (op: any) => op.op === 'command' ? Object.keys(op.command ?? {})[0] : op.op
for (const op of ops) console.log(`${op.ns.replace(/^[^.]*\./, '').padEnd(16)} ${String(kind(op)).padEnd(14)} ${shape(op)}`)
const counts = new Map<string, number>()
for (const op of ops) {
  const key = `${op.ns.replace(/^[^.]*\./, '')} ${kind(op)}`
  counts.set(key, (counts.get(key) ?? 0) + 1)
}
console.log(`\n${ops.length} operations:`)
for (const [key, n] of [...counts].sort((a, b) => b[1] - a[1])) console.log(`${String(n).padStart(4)}  ${key}`)
await mongo.close()
process.exit(0)

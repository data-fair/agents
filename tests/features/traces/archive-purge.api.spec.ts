/**
 * stateful API tests: a purge removes the thread AND everything hanging off it.
 *
 * The property a mongo TTL index could not give, and the reason the archive sweep is a sweep: a TTL
 * deletes only the document it indexes, so this thread's messages and runs — which live in their own
 * collections — would be left orphaned and still readable by id. For data that was supposed to have
 * expired that is the whole failure.
 *
 * Asserted against the database the server writes to, because "the route 404s" would also hold if
 * only the conversation document had gone. Driven through the admin erasure, which calls the same
 * `purgeConversation` the sweep does — the sweep itself imports `#config` and so cannot be called
 * from a test; its EXPIRY DECISION is pinned in retention.unit.spec.ts instead.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { MongoClient } from 'mongodb'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putSettings } from '../../support/settings.ts'
import { runTurn, setTraceConsent } from '../../support/turn.ts'

const user = await axiosAuth('test-standalone1')
const admin = await superAdmin
const OWNER = 'user/test-standalone1'

const settingsData = {
  providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
  models: [
    {
      model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
      usage: ['assistant'],
      inputPricePerMillion: 0,
      outputPricePerMillion: 0
    }
  ],
  modelMapping: { assistant: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' } },
  quotas: { admin: { unlimited: true, monthlyLimit: 0 }, contrib: { unlimited: false, monthlyLimit: 0 }, user: { unlimited: false, monthlyLimit: 0 }, external: { unlimited: true, monthlyLimit: 0 }, anonymous: { unlimited: false, monthlyLimit: 0 } },
  storeTraces: true
}

let client: MongoClient
let db: any

const counts = async (conversationId: string) => ({
  conversations: await db.collection('conversations').countDocuments({ id: conversationId }),
  messages: await db.collection('messages').countDocuments({ conversationId }),
  runs: await db.collection('runs').countDocuments({ conversationId })
})

test.describe('Purging a conversation', () => {
  test.beforeAll(async () => {
    // The same database the dev server writes to (api/config/development.js).
    client = new MongoClient(`mongodb://localhost:${process.env.MONGO_PORT}/data-fair-agents-development`)
    await client.connect()
    db = client.db()
  })
  test.afterAll(async () => { await client?.close() })

  test.beforeEach(async () => {
    await clean()
    await putSettings(admin, OWNER, settingsData)
    await setTraceConsent(user, true)
  })

  test('removes the thread, its messages and its runs', async () => {
    const { conversationId } = await runTurn(user, OWNER)

    const before = await counts(conversationId)
    assert.equal(before.conversations, 1)
    assert.ok(before.messages >= 2, 'the exchange is stored')
    assert.ok(before.runs >= 1, 'and so is its run')

    await admin.delete(`/api/review/${OWNER}/${conversationId}`)

    assert.deepEqual(await counts(conversationId), { conversations: 0, messages: 0, runs: 0 })
  })

  test('an ARCHIVED thread purges the same way, leaving nothing behind', async () => {
    // The sweep's case: the person deleted it, so it is archived, and when its window closes it has
    // to go completely rather than leaving its messages addressable.
    const { conversationId } = await runTurn(user, OWNER)
    await user.delete(`/api/conversations/${OWNER}/${conversationId}`)
    assert.equal((await counts(conversationId)).conversations, 1, 'archived, not deleted')
    assert.ok((await counts(conversationId)).messages >= 2, 'with its messages retained for review')

    await admin.delete(`/api/review/${OWNER}/${conversationId}`)
    assert.deepEqual(await counts(conversationId), { conversations: 0, messages: 0, runs: 0 })
  })

  test('a per-user erasure leaves nothing behind either', async () => {
    // The GDPR path, which must be at least as thorough as the others.
    const { conversationId } = await runTurn(user, OWNER)
    await user.delete(`/api/conversations/${OWNER}/${conversationId}`)

    await admin.delete(`/api/review/${OWNER}?userId=test-standalone1`)
    assert.deepEqual(await counts(conversationId), { conversations: 0, messages: 0, runs: 0 })
  })
})

/**
 * stateful API tests: the cleanup of a test sub-space (DELETE /api/test-env?prefix=).
 *
 * A suite owns the accounts whose ids start with its prefix (test_agents_ here, see
 * tests/support/sd-fixtures.ts) and cleans what they own without touching the other sub-spaces —
 * the dev world test_demo_ of dev/resources/demo-world.json above all, which a human may be
 * reviewing while the suite runs.
 *
 * Asserted against the database the server writes to: the documents are inserted there directly,
 * so the test does not depend on the routes that would create them.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { MongoClient, type Db } from 'mongodb'
import { nanoid } from 'nanoid'
import { anonymousAx } from '../../support/axios.ts'
import { prefix } from '../../support/sd-fixtures.ts'
import { devMongoUrl } from '../../support/mongo-url.ts'

const testEnvUrl = `http://localhost:${process.env.DEV_API_PORT}/api/test-env`

const own = { type: 'organization', id: `${prefix}org1`, name: 'Test Organization 1' }
const neighbour = { type: 'organization', id: 'test_demo_org', name: 'Fixtures Demo' }

let client: MongoClient
let db: Db

const conversation = (owner: typeof own) => ({
  id: nanoid(),
  owner,
  userId: 'clean-probe',
  title: 'clean probe',
  createdAt: new Date().toISOString(),
  lastMessageAt: new Date().toISOString()
})

test.describe('Cleanup of a test sub-space', () => {
  test.beforeAll(async () => {
    // The same database the dev server writes to (api/config/development.js).
    client = new MongoClient(devMongoUrl)
    await client.connect()
    db = client.db()
  })
  test.afterAll(async () => { await client?.close() })

  test('prefixed clean leaves the other sub-spaces', async () => {
    const ownConversation = conversation(own)
    const neighbourConversation = conversation(neighbour)
    // an earlier spec may have left settings to this owner: matched by its keys, not the whole sub-document
    await db.collection('settings').updateOne({ 'owner.type': own.type, 'owner.id': own.id }, { $setOnInsert: { owner: own } }, { upsert: true })
    // The dev world may hold real settings for its organization: they are kept as they are, and a
    // probe inserted here is removed afterwards.
    const { upsertedCount } = await db.collection('settings').updateOne({ 'owner.type': neighbour.type, 'owner.id': neighbour.id }, { $setOnInsert: { owner: neighbour } }, { upsert: true })
    await db.collection('conversations').insertMany([ownConversation, neighbourConversation])
    try {
      const res = await anonymousAx.delete(testEnvUrl, { params: { prefix } })
      assert.equal(res.status, 204)

      assert.equal(await db.collection('settings').countDocuments({ 'owner.id': own.id }), 0)
      assert.equal(await db.collection('conversations').countDocuments({ id: ownConversation.id }), 0)
      assert.equal(await db.collection('settings').countDocuments({ 'owner.type': neighbour.type, 'owner.id': neighbour.id }), 1)
      assert.equal(await db.collection('conversations').countDocuments({ id: neighbourConversation.id }), 1)
    } finally {
      await db.collection('conversations').deleteOne({ id: neighbourConversation.id })
      if (upsertedCount) await db.collection('settings').deleteOne({ 'owner.type': neighbour.type, 'owner.id': neighbour.id })
    }
  })

  test('invalid prefixes are refused', async () => {
    for (const params of [{}, { prefix: 'test_' }, { prefix: 'test_A_' }]) {
      await assert.rejects(anonymousAx.delete(testEnvUrl, { params }), { status: 400 }, `prefix ${JSON.stringify(params)}`)
    }
  })
})

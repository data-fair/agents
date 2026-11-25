/**
 * stateful API tests: the cleanup of a test sub-space (DELETE /api/test-env?prefix=).
 *
 * A suite owns the accounts whose ids start with its prefix (test_agents_ here, see
 * tests/support/sd-fixtures.ts) and cleans what they own without touching the other sub-spaces —
 * dev data under another prefix above all, which a human may be reviewing while the suite runs.
 *
 * Asserted against the database the server writes to: the documents are inserted there directly,
 * so the test does not depend on the routes that would create them.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { MongoClient, type Db } from 'mongodb'
import { nanoid } from 'nanoid'
import { anonymousAx, superAdmin } from '../../support/axios.ts'
import { prefix } from '../../support/sd-fixtures.ts'
import { devMongoUrl } from '../../support/mongo-url.ts'

const testEnvUrl = `http://localhost:${process.env.DEV_API_PORT}/api/test-env`

const own = { type: 'organization', id: `${prefix}org1`, name: 'Test Organization 1' }
const neighbour = { type: 'organization', id: 'test_other_org', name: 'Other Organization' }

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
    // Dev data may hold real settings for this organization: they are kept as they are, and a
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

  // The seams' choice of data-fair's built-in server is in-process, keyed by agent: a later spec (or a
  // simulation) re-creating the same agent id must get the deployment's server, not the forgotten spec's.
  test('a prefixed clean forgets the platform url choices of its agents', async () => {
    const admin = await superAdmin
    const home = `http://${process.env.DEV_HOST}:${process.env.NGINX_PORT}`
    const tools = `/api/autonomous-agents/organization/${own.id}/test-fixture/tools`
    // the stand-in's plain endpoint (dev/mcp-server.ts): its unprefixed tools are served by no deployment's data-fair
    const { data: agent } = await admin.post('/api/test-env/autonomous-agent', {
      id: 'test-fixture', // the agent the fixture identity pins (tests/support/sd-fixtures.ts)
      owner: { type: own.type, id: own.id },
      clientId: `${own.id}_agent_nhi`,
      siteUrl: home,
      issuer: `${home}/agents/api/nhi`,
      platformMcpUrl: `http://localhost:${process.env.DEV_MCP_PORT}/mcp`,
      autonomousAgent: { title: 'Clean probe', persona: 'x', mcpServers: [], enabled: true }
    })
    const dataFairEcho = async () => (await admin.get(tools)).data.results.some((t: any) => t.server === 'data-fair' && t.name === 'echo')
    assert.ok(await dataFairEcho(), 'the chosen server is the built-in one before the clean')

    const res = await anonymousAx.delete(testEnvUrl, { params: { prefix } })
    assert.equal(res.status, 204)
    // the same agent again, written without the seam: it gets the deployment's server
    await db.collection('autonomous-agents').insertOne({ ...agent })
    try {
      assert.equal(await dataFairEcho(), false)
    } finally {
      await anonymousAx.delete(testEnvUrl, { params: { prefix } })
    }
  })

  test('invalid prefixes are refused', async () => {
    for (const params of [{}, { prefix: 'test_' }, { prefix: 'test_A_' }]) {
      await assert.rejects(anonymousAx.delete(testEnvUrl, { params }), { status: 400 }, `prefix ${JSON.stringify(params)}`)
    }
  })
})

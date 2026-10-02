/**
 * stateful API tests: deleting a thread the organization may review.
 *
 * This exists because of a consequence of making the conversation the review material. Review used to
 * read a SEPARATE copy with its own retention, so what the person did with their chat could not touch
 * it. The two are one document now, and an unconditional delete would let anyone erase the record of
 * a conversation their organization was entitled to see — which is the one thing an audit trail
 * cannot allow.
 *
 * So a reviewable thread is ARCHIVED: gone for the person, retained for review until the window
 * closes, then purged whole. Everything these tests assert is a line in that sentence.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putSettings } from '../../support/settings.ts'
import { runTurn, setTraceConsent } from '../../support/turn.ts'

const user = await axiosAuth('test-standalone1')
const admin = await superAdmin
const OWNER = 'user/test-standalone1'

const settingsData = (storeTraces: boolean) => ({
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
  storeTraces
})

const chat = async (storeTraces: boolean, consented: boolean) => {
  await putSettings(admin, OWNER, settingsData(storeTraces))
  await setTraceConsent(user, consented)
  const { conversationId } = await runTurn(user, OWNER)
  return conversationId
}

const mineList = async () =>
  (await user.get(`/api/conversations/${OWNER}?agentId=personal`)).data.results

test.describe('Deleting a reviewable conversation', () => {
  test.beforeEach(async () => { await clean() })

  test('a consented thread is ARCHIVED: gone for the person, still there for review', async () => {
    const conversationId = await chat(true, true)
    assert.equal((await mineList()).length, 1)

    await user.delete(`/api/conversations/${OWNER}/${conversationId}`)

    // Gone for them, on every route that reads a thread — the list, the read, and posting to it.
    assert.deepEqual(await mineList(), [], 'it must disappear from their list')
    const read = await user.get(`/api/conversations/${OWNER}/${conversationId}/messages`).catch((err: any) => err.response ?? err)
    assert.equal(read.status, 404, 'and not be readable')
    const post = await user.post(`/api/conversations/${OWNER}/${conversationId}/messages`, { content: 'more' }).catch((err: any) => err.response ?? err)
    assert.equal(post.status, 404, 'and not be continuable')

    // Still there for review, flagged so an admin knows the person deleted their side.
    const review = await admin.get(`/api/review/${OWNER}`)
    assert.equal(review.data.count, 1, 'the organization keeps what it was entitled to review')
    assert.ok(review.data.results[0].archivedAt, 'and can see the person deleted it')

    // And its content survives, not just its row.
    const detail = await admin.get(`/api/review/${OWNER}/${conversationId}`)
    assert.equal(detail.data.messages.length, 2)
  })

  test('a thread nobody may review is PURGED, not archived', async () => {
    // Nothing to retain: without consent no admin may read it, so keeping it would be retention for
    // its own sake.
    const conversationId = await chat(true, false)
    await user.delete(`/api/conversations/${OWNER}/${conversationId}`)

    const detail = await admin.get(`/api/review/${OWNER}/${conversationId}`).catch((err: any) => err.response ?? err)
    assert.equal(detail.status, 404)
    // The messages go with it rather than being orphaned in their own collection.
    const read = await user.get(`/api/conversations/${OWNER}/${conversationId}/messages`).catch((err: any) => err.response ?? err)
    assert.equal(read.status, 404)
  })

  test('a thread is purged when the ORGANIZATION never enabled review either', async () => {
    const conversationId = await chat(false, true)
    await user.delete(`/api/conversations/${OWNER}/${conversationId}`)
    // storeTraces off makes the whole review surface 403, so assert on the person's side.
    const read = await user.get(`/api/conversations/${OWNER}/${conversationId}/messages`).catch((err: any) => err.response ?? err)
    assert.equal(read.status, 404)
  })

  test('an admin erasure reaches an ARCHIVED thread', async () => {
    // The archive stops the PERSON from erasing review material. It must not stop an admin acting on
    // a GDPR request, which is the one instruction that outranks retention.
    const conversationId = await chat(true, true)
    await user.delete(`/api/conversations/${OWNER}/${conversationId}`)
    assert.equal((await admin.get(`/api/review/${OWNER}`)).data.count, 1, 'archived and visible')

    await admin.delete(`/api/review/${OWNER}/${conversationId}`)
    assert.equal((await admin.get(`/api/review/${OWNER}`)).data.count, 0, 'and erasable by an admin')
  })

  test('withdrawing consent then deleting purges, because nothing may be reviewed', async () => {
    // The two gates compose. A person who withdraws consent has made the thread unreviewable, so the
    // delete that follows has nothing to preserve.
    const conversationId = await chat(true, true)
    await setTraceConsent(user, false)
    await runTurn(user, OWNER, 'again', { conversationId })
    assert.equal((await admin.get(`/api/review/${OWNER}`)).data.count, 0, 'no longer reviewable')

    await user.delete(`/api/conversations/${OWNER}/${conversationId}`)
    const read = await user.get(`/api/conversations/${OWNER}/${conversationId}/messages`).catch((err: any) => err.response ?? err)
    assert.equal(read.status, 404)
  })

  test('deleting twice is not an error', async () => {
    // The second call cannot find it — archived threads are excluded from the lookup behind every
    // route that reads a thread — so it reads as already gone rather than as a failure.
    const conversationId = await chat(true, true)
    await user.delete(`/api/conversations/${OWNER}/${conversationId}`)
    const again = await user.delete(`/api/conversations/${OWNER}/${conversationId}`).catch((err: any) => err.response ?? err)
    assert.equal(again.status, 404)
  })
})

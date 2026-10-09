/**
 * stateful API tests: which sites an autonomous agent acts on, and as whom.
 *
 * The organization test1 gets a second domain, dev1 gets one too. The agent's account is its
 * enrolment site plus test1's domains: dev1's is outside it.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { superAdmin, clean } from '../../support/axios.ts'
import { createSite, deleteSite, portalHost } from '../../support/sites.ts'

const admin = await superAdmin
const PORT = process.env.NGINX_PORT
const home = `http://localhost:${PORT}`
const issuer = `${home}/agents/api/nhi`
const ownPortal = portalHost('test1-portal')
const foreignPortal = portalHost('dev1-portal')
const AGENT = '/api/autonomous-agents/organization/test1/test-fixture'

const enrol = async (siteUrl = home, over: any = {}) => await admin.post('/api/test-env/autonomous-agent', {
  id: 'test-fixture',
  owner: { type: 'organization', id: 'test1' },
  clientId: 'test-autonomous-agent-nhi',
  siteUrl,
  issuer,
  autonomousAgent: { title: 'Site probe', persona: 'x', mcpServers: [], enabled: true, ...over }
})

test.describe('Sites of an autonomous agent', () => {
  const siteIds: string[] = []
  test.beforeAll(async () => {
    siteIds.push(await createSite(ownPortal, { type: 'organization', id: 'test1', name: 'Test 1' }))
    siteIds.push(await createSite(foreignPortal, { type: 'organization', id: 'dev1', name: 'Dev 1' }))
  })
  test.afterAll(async () => { for (const id of siteIds) await deleteSite(id) })
  test.beforeEach(async () => { await clean() })

  test('its account is its enrolment site and its organization\'s sites, not another organization\'s', async () => {
    await enrol()
    const { data } = await admin.get(`${AGENT}/session`)
    assert.deepEqual(data.accountSites, [home, `http://${ownPortal}`])
  })

  test('enrolled from one of its organization\'s portals, it still sees the whole account', async () => {
    await enrol(`http://${ownPortal}`)
    const { data } = await admin.get(`${AGENT}/session`)
    assert.deepEqual(data.accountSites, [`http://${ownPortal}`])
  })
})

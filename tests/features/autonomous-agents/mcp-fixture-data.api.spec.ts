/**
 * The one fixture tool that returns DATA, tested directly over MCP.
 *
 * `list_road_closures` exists so a simulation can check whether an autonomous agent really fetches
 * something and quotes it, rather than refusing or inventing. That only works if the tool's ARGUMENT
 * selects the rows: when `district` was merely echoed into the payload and otherwise ignored, every
 * value returned the same three closures, so an agent passing "Bellecour" or "" was indistinguishable
 * from a correct one — and the agent volunteers "let me know if you need another district", which
 * would then have it confidently report a street as closed somewhere it is not.
 *
 * Pinned here rather than left to the simulation, because `npm run dev-mcp` holds the fixture's code
 * for its whole lifetime: a simulation only sees a change after that process is restarted, while every
 * spec starts its own server and sees it immediately.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { startMcpFixture } from '../../support/mcp-fixture.ts'

const port = Number(process.env.NGINX_PORT) + 30

const callListRoadClosures = async (district: unknown) => {
  const res = await fetch(`http://localhost:${port}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'list_road_closures', arguments: { district } }
    })
  })
  const body = await res.text()
  // The stateless transport answers as an SSE frame, so the JSON payload is on a `data:` line.
  const payload = JSON.parse(body.split('\n').find(line => line.startsWith('data:'))?.slice(5) ?? body)
  return JSON.parse(payload.result.content[0].text)
}

test.describe('list_road_closures fixture data', () => {
  let fixture: Awaited<ReturnType<typeof startMcpFixture>>
  test.beforeAll(async () => { fixture = await startMcpFixture(port) })
  test.afterAll(async () => { await fixture.close() })

  test('the district argument selects the rows', async () => {
    const cityCenter = await callListRoadClosures('city-center')
    const riverside = await callListRoadClosures('riverside')
    assert.equal(cityCenter.known, true)
    assert.equal(riverside.known, true)
    assert.deepEqual(cityCenter.closures.map((c: any) => c.street), ['Rue de la Paix', 'Avenue Foch', 'Place du Marche'])
    assert.deepEqual(riverside.closures.map((c: any) => c.street), ['Quai des Chartrons'])
  })

  test('an unknown district returns no closures, so a wrong argument is visible', async () => {
    for (const district of ['Bellecour', '', 'Mars']) {
      const res = await callListRoadClosures(district)
      assert.equal(res.known, false, `${district} should not be a known district`)
      assert.deepEqual(res.closures, [], `${district} should return no closures`)
    }
  })

  test('the dates are current, not a hardcoded month that silently goes stale', async () => {
    // A fixed month expires: an agent asked for "current" closures correctly reported every row as
    // already finished, which sent the run chasing staleness instead of the reporting under test.
    const today = new Date().toISOString().slice(0, 10)
    const { closures } = await callListRoadClosures('city-center')
    assert.ok(closures.some((c: any) => c.from <= today && c.reopens > today), 'one closure should be in progress')
    assert.ok(closures.some((c: any) => c.from > today), 'one closure should be upcoming')
    // `reopens`, not `until`: with `until` the one-day closure rendered as
    // "Closed From X / Reopening X", and the agent had to guess which the fixture meant.
    for (const closure of closures) {
      assert.ok(closure.reopens > closure.from, `${closure.street} must reopen after it closes`)
    }
  })
})

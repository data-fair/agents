/**
 * stateless unit tests of the session broker: how the service spends simple-directory's exchange budget.
 *
 * simple-directory counts every exchange against 5 attempts a minute per caller IP and per client id, gives
 * a success its point back when it ends, and keeps a failure's. Every agent's exchange comes from the same
 * address, so the in-flight ones and the failures of ALL agents share one budget: exchanges are bounded in
 * flight, reused while valid, and a rejected identity is not asked again for a while.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { createSessionBroker } from '../../../api/src/nhi/session-broker.ts'

const key = (agentId = 'a1', site = 'https://portal.test', clientId = 'c1') => ({ agentId, clientId, site })
const rejected = (status: number, error?: string) => Object.assign(new Error(`nhi token request failed: ${status}`), { exchangeStatus: status, ...(error ? { exchangeError: error } : {}) })
const issued = (value: string, ttlSeconds = 300) => ({ value, ttlSeconds })
const tick = () => new Promise(resolve => setImmediate(resolve))

test.describe('the NHI session broker', () => {
  test('a session is reused until it needs renewing, then exchanged again', async () => {
    let now = 0
    let exchanges = 0
    const broker = createSessionBroker({ now: () => now })
    const exchange = async () => issued(`cookie-${++exchanges}`)
    assert.equal(await broker.session(key(), exchange), 'cookie-1')
    now += 200_000
    assert.equal(await broker.session(key(), exchange), 'cookie-1', 'another turn, same session')
    now += 41_000 // 241 s: within the minute before its 300 s expiry
    assert.equal(await broker.session(key(), exchange), 'cookie-2')
  })

  test('a token is renewed from its own expires_in', async () => {
    let now = 0
    let exchanges = 0
    const broker = createSessionBroker({ now: () => now })
    const exchange = async () => issued(`token-${++exchanges}`, 120)
    assert.equal(await broker.session(key(), exchange), 'token-1')
    now += 50_000
    assert.equal(await broker.session(key(), exchange), 'token-1', 'reused well before its 120 s expiry')
    now += 11_000 // 61 s: within the minute before a 120 s expiry, where a 300 s assumption would reuse it
    assert.equal(await broker.session(key(), exchange), 'token-2')
  })

  test('sessions are per agent, site and client id', async () => {
    let exchanges = 0
    const broker = createSessionBroker()
    const exchange = async () => issued(`cookie-${++exchanges}`)
    await broker.session(key('a1'), exchange)
    await broker.session(key('a2'), exchange)
    await broker.session(key('a1', 'https://other.test'), exchange)
    await broker.session(key('a1', 'https://portal.test', 'c2'), exchange)
    assert.equal(exchanges, 4)
  })

  test('concurrent asks for one session share one exchange', async () => {
    let exchanges = 0
    let release!: () => void
    const broker = createSessionBroker()
    const exchange = () => { exchanges++; return new Promise<{ value: string, ttlSeconds: number }>(resolve => { release = () => resolve(issued('cookie')) }) }
    const asks = [broker.session(key(), exchange), broker.session(key(), exchange), broker.session(key(), exchange)]
    await tick()
    release()
    assert.deepEqual(await Promise.all(asks), ['cookie', 'cookie', 'cookie'])
    assert.equal(exchanges, 1)
  })

  test('at most maxInFlight exchanges run at once; the others wait their turn', async () => {
    let inFlight = 0
    let peak = 0
    const releases: (() => void)[] = []
    const broker = createSessionBroker({ maxInFlight: 2 })
    const exchange = () => new Promise<{ value: string, ttlSeconds: number }>(resolve => {
      inFlight++; peak = Math.max(peak, inFlight)
      releases.push(() => { inFlight--; resolve(issued('cookie')) })
    })
    const asks = ['a1', 'a2', 'a3', 'a4', 'a5'].map(agent => broker.session(key(agent), exchange))
    for (let i = 0; i < 5; i++) { await tick(); releases.shift()?.() }
    await Promise.all(asks)
    assert.equal(peak, 2)
  })

  test('a rejected identity is not asked again for a while, and says why', async () => {
    let now = 0
    let exchanges = 0
    const broker = createSessionBroker({ now: () => now })
    const exchange = async () => { exchanges++; throw rejected(400, 'invalid_grant') }
    await assert.rejects(broker.session(key(), exchange), /400/)
    await assert.rejects(broker.session(key('a1', 'https://other.test'), exchange), /400.*not asked again before/s, 'any site of that identity')
    assert.equal(exchanges, 1)
    now += 5 * 60_000
    await assert.rejects(broker.session(key(), exchange), /400/)
    assert.equal(exchanges, 2, 'asked again once the back-off is over')
  })

  test('a refused site is backed off alone: the other sites of the identity are still asked', async () => {
    const asked: string[] = []
    const broker = createSessionBroker()
    const exchangeFor = (site: string) => async () => {
      asked.push(site)
      if (site === 'https://b.test') throw rejected(400, 'invalid_target')
      return issued(`token-${site}`)
    }
    await assert.rejects(broker.session(key('a1', 'https://b.test'), exchangeFor('https://b.test')), /400/)
    await assert.rejects(broker.session(key('a1', 'https://b.test'), exchangeFor('https://b.test')), /not asked again before/)
    assert.equal(await broker.session(key('a1', 'https://a.test'), exchangeFor('https://a.test')), 'token-https://a.test')
    assert.deepEqual(asked, ['https://b.test', 'https://a.test'])
  })

  test('an identity refused by the directory is backed off on every site', async () => {
    let exchanges = 0
    const broker = createSessionBroker()
    const exchange = async () => { exchanges++; throw rejected(400, 'invalid_grant') }
    await assert.rejects(broker.session(key('a1', 'https://a.test'), exchange))
    await assert.rejects(broker.session(key('a1', 'https://b.test'), exchange), /not asked again before/)
    assert.equal(exchanges, 1)
  })

  test('forgetting an agent drops its sessions and its back-off: a changed enrolment is tried at once', async () => {
    let exchanges = 0
    let fail = true
    const broker = createSessionBroker()
    const exchange = async () => { exchanges++; if (fail) throw rejected(403); return issued('cookie') }
    await assert.rejects(broker.session(key(), exchange))
    fail = false
    broker.forget('a1')
    assert.equal(await broker.session(key(), exchange), 'cookie')
    broker.forget('a1')
    await broker.session(key(), exchange)
    assert.equal(exchanges, 3)
  })

  test('a failure that is not a rejection (the directory down) is not remembered', async () => {
    let exchanges = 0
    const broker = createSessionBroker()
    const exchange = async () => { exchanges++; throw new Error('connect ECONNREFUSED') }
    await assert.rejects(broker.session(key(), exchange))
    await assert.rejects(broker.session(key(), exchange))
    assert.equal(exchanges, 2)
  })

  test('a 429 waits and retries rather than failing the turn, a few times at most', async () => {
    let exchanges = 0
    const waits: number[] = []
    const broker = createSessionBroker({ wait: async ms => { waits.push(ms) } })
    const exchange = async () => { if (++exchanges < 3) throw rejected(429); return issued('cookie') }
    assert.equal(await broker.session(key(), exchange), 'cookie')
    assert.equal(waits.length, 2)
    let always = 0
    await assert.rejects(broker.session(key('a2'), async () => { always++; throw rejected(429) }), /429/)
    assert.equal(always, 4, 'the first try and three retries')
  })
})

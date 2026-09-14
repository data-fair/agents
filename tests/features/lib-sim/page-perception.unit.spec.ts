/**
 * The persona's page tools. The exclusion test is the important one: the design
 * deliberately withholds evaluate and raw selectors, because a persona that can
 * run JavaScript verifies what no person could — which would make verdicts
 * wrongly optimistic instead of wrongly pessimistic.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { createPagePerception, truncate, SNAPSHOT_CAP, MCP_SERVER_NAME } from '../../../lib-sim/page-perception.ts'

const fakeRoot = (snapshot: string, log: string[] = []) => ({
  locator: (sel: string) => ({ ariaSnapshot: async () => snapshot, click: async () => { log.push('click ' + sel) }, fill: async (t: string) => { log.push('fill ' + t) } }),
  getByRole: (role: string, opts: { name: string }) => ({ first: () => ({ click: async () => { log.push(`click ${role}:${opts.name}`) }, fill: async (t: string) => { log.push(`fill ${role}:${opts.name}=${t}`) }, count: async () => 1 }) }),
  getByText: (name: string) => ({ first: () => ({ click: async () => { log.push('clickText:' + name) }, count: async () => 1 }) }),
  getByLabel: (name: string) => ({ first: () => ({ fill: async (t: string) => { log.push(`fillLabel:${name}=${t}`) }, count: async () => 1 }) })
})

test.describe('the tool set', () => {
  test('exposes exactly look, click and type', () => {
    const p = createPagePerception([{ label: 'page', root: fakeRoot('- button "Send"') as any }])
    assert.deepEqual(p.toolNames.sort(), ['click', 'look', 'type'])
  })

  test('exposes no escape hatch that a person would not have', () => {
    // Guard on the design's core exclusion. If someone adds `evaluate`, a raw
    // selector tool, or DOM access as a convenience, this must fail.
    const p = createPagePerception([{ label: 'page', root: fakeRoot('') as any }])
    for (const banned of ['evaluate', 'eval', 'query', 'querySelector', 'selector', 'dom', 'html', 'script']) {
      assert.ok(!p.toolNames.some(n => n.toLowerCase().includes(banned)), `tool set must not expose "${banned}"`)
    }
  })

  test('names the mcp server so allowedTools can be derived', () => {
    assert.equal(MCP_SERVER_NAME, 'page')
  })
})

test.describe('snapshot truncation', () => {
  test('leaves a short snapshot alone', () => {
    assert.equal(truncate('- button "Send"'), '- button "Send"')
  })

  test('caps a long one and says it did', () => {
    const long = 'x'.repeat(SNAPSHOT_CAP + 500)
    const out = truncate(long)
    assert.ok(out.length < long.length)
    assert.ok(out.endsWith('…[truncated]'), 'a reader must be able to tell the snapshot was cut')
  })
})

test.describe('observations', () => {
  test('records every call with the turn the runner stamped', async () => {
    const p = createPagePerception([{ label: 'page', root: fakeRoot('- button "Send"') as any }])
    p.setTurn(3)
    await p.call('look', {})
    assert.equal(p.observations.length, 1)
    assert.equal(p.observations[0].turn, 3)
    assert.equal(p.observations[0].tool, 'look')
    assert.ok(p.observations[0].result.includes('button "Send"'))
  })

  test('look spans every root, labelled, so a framed page is visible too', async () => {
    const p = createPagePerception([
      { label: 'page', root: fakeRoot('- heading "Host"') as any },
      { label: 'chat frame', root: fakeRoot('- button "Send"') as any }
    ])
    const out = await p.call('look', {})
    assert.ok(out.includes('Host'))
    assert.ok(out.includes('Send'))
    assert.ok(out.includes('chat frame'), 'each root is labelled so the persona knows what it is looking at')
  })

  test('a failed action is recorded, not thrown, so the persona can react', async () => {
    const empty = {
      ...fakeRoot(''),
      getByRole: () => ({ first: () => ({ count: async () => 0, click: async () => { throw new Error('nope') } }) }),
      getByText: () => ({ first: () => ({ count: async () => 0 }) })
    }
    const p = createPagePerception([{ label: 'page', root: empty as any }])
    const out = await p.call('click', { name: 'Nothing' })
    assert.ok(/not find|no element/i.test(out), 'the persona is told it could not click, in words it can act on')
    assert.equal(p.observations.at(-1)?.tool, 'click')
  })
})

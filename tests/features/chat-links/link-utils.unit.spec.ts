/**
 * stateless unit tests for the agent chat link resolver
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { resolveAgentLink, decideAgentNavigation, type AgentNavRouter } from '../../../lib-vuetify/link-utils.ts'

const ORIGIN = 'https://koumoul.com'
const BASE = '/data-fair/'

/** Build a minimal router stub; `matched` controls whether a path resolves to a route. */
const stubRouter = (base: string, matched: boolean): AgentNavRouter => ({
  options: { history: { base } },
  resolve: () => ({ matched: matched ? [{}] : [] })
})

test.describe('resolveAgentLink', () => {
  test('keeps a full same-origin URL, stripping the base to a router path', () => {
    assert.deepEqual(
      resolveAgentLink('https://koumoul.com/data-fair/dataset/abc/table', ORIGIN, BASE),
      { external: false, path: '/dataset/abc/table', url: 'https://koumoul.com/data-fair/dataset/abc/table' }
    )
  })

  test('preserves query and hash', () => {
    const r = resolveAgentLink('https://koumoul.com/data-fair/dataset/abc/table?ville_eq=Paris#x', ORIGIN, BASE)
    assert.equal(r.external, false)
    assert.equal(r.path, '/dataset/abc/table?ville_eq=Paris#x')
  })

  test('rescues an app-relative path that omits the base (leading slash)', () => {
    assert.deepEqual(
      resolveAgentLink('/dataset/abc/table', ORIGIN, BASE),
      { external: false, path: '/dataset/abc/table', url: 'https://koumoul.com/dataset/abc/table' }
    )
  })

  test('rescues a bare relative path with no leading slash', () => {
    const r = resolveAgentLink('dataset/abc/table?montant_total_eq=0', ORIGIN, BASE)
    assert.equal(r.external, false)
    assert.equal(r.path, '/dataset/abc/table?montant_total_eq=0')
  })

  test('strips a base-prefixed path', () => {
    assert.equal(resolveAgentLink('/data-fair/dataset/abc', ORIGIN, BASE).path, '/dataset/abc')
  })

  test('handles an upstream site path in the base', () => {
    assert.equal(resolveAgentLink('https://koumoul.com/site/data-fair/dataset/abc', ORIGIN, '/site/data-fair/').path, '/dataset/abc')
  })

  test('flags a different origin as external (full navigation, no rewrite)', () => {
    assert.deepEqual(
      resolveAgentLink('https://example.org/some/page', ORIGIN, BASE),
      { external: true, path: '', url: 'https://example.org/some/page' }
    )
  })

  test('maps the base root to "/"', () => {
    assert.equal(resolveAgentLink('https://koumoul.com/data-fair', ORIGIN, BASE).path, '/')
  })
})

test.describe('decideAgentNavigation', () => {
  test('navigates in-SPA when the link maps to a known route', () => {
    assert.deepEqual(
      decideAgentNavigation('/data-fair/dataset/abc/table', ORIGIN, stubRouter(BASE, true)),
      { spa: true, path: '/dataset/abc/table', url: 'https://koumoul.com/data-fair/dataset/abc/table' }
    )
  })

  test('falls back to full navigation when the route is unmatched', () => {
    const d = decideAgentNavigation('/data-fair/unknown', ORIGIN, stubRouter(BASE, false))
    assert.equal(d.spa, false)
    assert.equal(d.url, 'https://koumoul.com/data-fair/unknown')
  })

  test('falls back to full navigation for an external link', () => {
    const d = decideAgentNavigation('https://example.org/page', ORIGIN, stubRouter(BASE, true))
    assert.deepEqual(d, { spa: false, path: '', url: 'https://example.org/page' })
  })

  test('without a router, falls back to a full navigation instead of throwing', () => {
    // Reproduces the crash: the singleton was created outside a setup context so
    // useRouter() yielded undefined. The handler must degrade, not read .options of undefined.
    const d = decideAgentNavigation('/data-fair/dataset/abc/table', ORIGIN, undefined)
    assert.equal(d.spa, false)
    assert.equal(d.url, 'https://koumoul.com/data-fair/dataset/abc/table')
  })
})

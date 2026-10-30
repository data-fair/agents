/**
 * stateless unit tests for the agent chat link resolver
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { resolveAgentLink, decideAgentNavigation, type AgentNavRouter } from '../../../lib-vuetify/link-utils.ts'
import { resolveAgentChatUrl } from '../../../lib-vuetify/useAgentChatBase.ts'

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
      { safe: true, external: false, path: '/dataset/abc/table', url: 'https://koumoul.com/data-fair/dataset/abc/table' }
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
      { safe: true, external: false, path: '/dataset/abc/table', url: 'https://koumoul.com/dataset/abc/table' }
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
      { safe: true, external: true, path: '', url: 'https://example.org/some/page' }
    )
  })

  test('maps the base root to "/"', () => {
    assert.equal(resolveAgentLink('https://koumoul.com/data-fair', ORIGIN, BASE).path, '/')
  })

  test('flags anything but an http(s) URL as unsafe', () => {
    for (const raw of ['javascript:alert(document.cookie)', 'JavaScript:alert(1)', ' javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:x', 'http://[bad']) {
      assert.equal(resolveAgentLink(raw, ORIGIN, BASE).safe, false, raw)
    }
  })
})

test.describe('resolveAgentChatUrl', () => {
  // The builder reads window.location.origin; these run in node, which has no window.
  const withWindow = (origin: string, fn: () => void) => {
    const previous = (globalThis as any).window
    ;(globalThis as any).window = { location: { origin } }
    try { fn() } finally { (globalThis as any).window = previous }
  }

  test('the account chat route, with init config and no agent switcher by default', () => {
    withWindow('https://koumoul.com', () => {
      assert.equal(
        resolveAgentChatUrl({ accountType: 'organization', accountId: 'abc' }, 'drawer'),
        'https://koumoul.com/agents/organization/abc/chat?initConfig=drawer'
      )
    })
  })

  test('the agents flag asks the back-office for the switcher and history', () => {
    withWindow('https://koumoul.com', () => {
      const url = new URL(resolveAgentChatUrl({ accountType: 'organization', accountId: 'abc', agents: true }, 'drawer'))
      assert.equal(url.searchParams.get('agents'), '1')
      // The init-config key must survive the rewrite: dropping it would send the chat to the personal
      // assistant whatever agent its host had named.
      assert.equal(url.searchParams.get('initConfig'), 'drawer')
    })
  })

  test('a custom src keeps its own query string', () => {
    withWindow('https://koumoul.com', () => {
      const url = new URL(resolveAgentChatUrl({ src: 'https://other.example/chat?title=x', agents: true }))
      assert.equal(url.searchParams.get('title'), 'x')
      assert.equal(url.searchParams.get('agents'), '1')
    })
  })
})

test.describe('decideAgentNavigation', () => {
  test('navigates in-SPA when the link maps to a known route', () => {
    assert.deepEqual(
      decideAgentNavigation('/data-fair/dataset/abc/table', ORIGIN, stubRouter(BASE, true)),
      { action: 'spa', path: '/dataset/abc/table', url: 'https://koumoul.com/data-fair/dataset/abc/table' }
    )
  })

  test('falls back to full navigation when the route is unmatched', () => {
    const d = decideAgentNavigation('/data-fair/unknown', ORIGIN, stubRouter(BASE, false))
    assert.equal(d.action, 'page')
    assert.equal(d.url, 'https://koumoul.com/data-fair/unknown')
  })

  test('opens an external link in a new tab, never in place of the host page', () => {
    const d = decideAgentNavigation('https://example.org/page', ORIGIN, stubRouter(BASE, true))
    assert.deepEqual(d, { action: 'new-tab', path: '', url: 'https://example.org/page' })
  })

  test('ignores a javascript: or data: link, with or without a router', () => {
    for (const router of [stubRouter(BASE, true), undefined]) {
      assert.equal(decideAgentNavigation('javascript:alert(1)', ORIGIN, router).action, 'ignore')
      assert.equal(decideAgentNavigation('data:text/html,x', ORIGIN, router).action, 'ignore')
    }
  })

  test('without a router, falls back to a full navigation instead of throwing', () => {
    // Reproduces the crash: the singleton was created outside a setup context so
    // useRouter() yielded undefined. The handler must degrade, not read .options of undefined.
    const d = decideAgentNavigation('/data-fair/dataset/abc/table', ORIGIN, undefined)
    assert.equal(d.action, 'page')
    assert.equal(d.url, 'https://koumoul.com/data-fair/dataset/abc/table')
  })
})

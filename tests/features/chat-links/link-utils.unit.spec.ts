/**
 * stateless unit tests for the agent chat link resolver
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { resolveAgentLink } from '../../../lib-vuetify/link-utils.ts'

const ORIGIN = 'https://koumoul.com'
const BASE = '/data-fair/'

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

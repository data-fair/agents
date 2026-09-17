/**
 * The location every host was writing for itself.
 *
 * The absolute `url` is the point. A judged data-fair run had the assistant hand
 * the person a relative path, which the chat rendered as inert plain text — not
 * even a broken link — while the absolute URL sat unused in the host-state block
 * of that very same request. Deriving it here means a host cannot publish a
 * location that the model can only turn into a dead end.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { buildAgentLocation, AGENT_LOCATION_KEY } from '../../../lib-vue/agent-location.ts'

const ORIGIN = 'https://example.org'

test.describe('buildAgentLocation', () => {
  test('publishes under the one key the chat retains locations on', () => {
    assert.equal(AGENT_LOCATION_KEY, 'location')
  })

  test('derives an absolute url from the path', () => {
    const l = buildAgentLocation({ path: '/datasets' }, ORIGIN)
    assert.equal(l.url, 'https://example.org/datasets')
    assert.equal(l.path, '/datasets')
  })

  test('keeps an absolute url the host supplies itself', () => {
    // A host behind a path prefix or a different public origin knows better.
    const l = buildAgentLocation({ path: '/datasets', url: 'https://public.example/data-fair/datasets' }, ORIGIN)
    assert.equal(l.url, 'https://public.example/data-fair/datasets')
  })

  test('carries the human page name when there is one', () => {
    assert.equal(buildAgentLocation({ path: '/x', name: 'Jeux de données' }, ORIGIN).name, 'Jeux de données')
  })

  test('drops empty extras rather than publishing noise', () => {
    const l = buildAgentLocation({ path: '/x', name: '  ', params: {}, query: {}, breadcrumbs: [] }, ORIGIN)
    assert.deepEqual(Object.keys(l).sort(), ['path', 'url'])
  })

  test('keeps params and query when they carry something', () => {
    const l = buildAgentLocation({ path: '/dataset/abc', params: { id: 'abc' }, query: { capacite_gt: '500' } }, ORIGIN)
    assert.deepEqual(l.params, { id: 'abc' })
    assert.deepEqual(l.query, { capacite_gt: '500' })
  })

  test('trims breadcrumbs to their text and drops the blanks', () => {
    const l = buildAgentLocation({ path: '/x', breadcrumbs: [' Accueil ', '', 'Jeux de données'] }, ORIGIN)
    assert.deepEqual(l.breadcrumbs, ['Accueil', 'Jeux de données'])
  })

  test('survives a path that is already absolute', () => {
    const l = buildAgentLocation({ path: 'https://example.org/x' }, ORIGIN)
    assert.equal(l.url, 'https://example.org/x')
  })

  test('reports the path unchanged even when the origin is unknown', () => {
    // Server-side render, or a test: no window to resolve against.
    const l = buildAgentLocation({ path: '/datasets' }, undefined)
    assert.equal(l.path, '/datasets')
    assert.equal(l.url, undefined)
  })
})

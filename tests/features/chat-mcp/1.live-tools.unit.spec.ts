/**
 * Unit tests for the live tool set (ui/src/composables/live-tools.ts).
 *
 * The tool map handed to `streamText` must keep a STABLE OBJECT IDENTITY for the whole
 * turn, because the AI SDK dereferences that same object at every step boundary (both to
 * advertise tools to the model and to look up the tool to execute). Reconciling into it
 * in place is what makes a tool registered mid-turn — the page the agent just navigated
 * to mounting its own components — callable in the same turn instead of the next one.
 *
 * Replacing the object (`mainLLMTools = {...}`) would silently lose that property, so the
 * identity assertion below is the one that guards the whole design.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { tool, jsonSchema } from 'ai'
import { reconcileTools } from '../../../ui/src/composables/live-tools.ts'

const fakeTool = (name: string) => tool({
  description: name,
  inputSchema: jsonSchema({ type: 'object', properties: {}, additionalProperties: false }),
  execute: async () => name
})

test.describe('reconcileTools', () => {
  test('mutates the target in place rather than returning a new object', () => {
    // The property the whole design rests on: streamText holds this exact reference.
    const target: Record<string, any> = { search: fakeTool('search') }
    const identity = target

    reconcileTools(target, { search: fakeTool('search'), set_display: fakeTool('set_display') })

    assert.equal(target, identity)
    assert.deepEqual(Object.keys(target).sort(), ['search', 'set_display'])
  })

  test('adds tools that appeared', () => {
    const target: Record<string, any> = { navigate: fakeTool('navigate') }

    const { added } = reconcileTools(target, {
      navigate: fakeTool('navigate'),
      set_display: fakeTool('set_display'),
      filter_data: fakeTool('filter_data')
    })

    assert.deepEqual(added, ['filter_data', 'set_display'])
    assert.ok(target.set_display)
  })

  test('removes tools that disappeared', () => {
    // A frame unmounting or an MCP server disconnecting drops its tools; leaving them
    // advertised would make the model call something that no longer exists.
    const target: Record<string, any> = { navigate: fakeTool('navigate'), stale: fakeTool('stale') }

    const { removed } = reconcileTools(target, { navigate: fakeTool('navigate') })

    assert.deepEqual(removed, ['stale'])
    assert.equal('stale' in target, false)
  })

  test('replaces the value of a tool whose name is unchanged', () => {
    // The aggregator rebuilds its wrappers on every re-merge, so a same-named tool still
    // carries a fresh closure bound to the live MCP client — keeping the old one would
    // dispatch to a dead transport.
    const target: Record<string, any> = { search: fakeTool('search') }
    const fresh = fakeTool('search')

    reconcileTools(target, { search: fresh })

    assert.equal(target.search, fresh)
  })

  test('reports no change when the names are the same', () => {
    // Drives the "should we announce / log" decision: identity churn alone is not news.
    const target: Record<string, any> = { a: fakeTool('a'), b: fakeTool('b') }

    const { added, removed } = reconcileTools(target, { b: fakeTool('b'), a: fakeTool('a') })

    assert.deepEqual(added, [])
    assert.deepEqual(removed, [])
  })

  test('reconciles an empty target from nothing', () => {
    const target: Record<string, any> = {}

    const { added, removed } = reconcileTools(target, { only: fakeTool('only') })

    assert.deepEqual(added, ['only'])
    assert.deepEqual(removed, [])
    assert.deepEqual(Object.keys(target), ['only'])
  })
})

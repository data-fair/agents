/**
 * stateless unit tests for the claude-bridge MCP tool server
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { listToolsFor, createToolServer, TOOL_TIMEOUT_MS } from '../../../lib-sim/bridge/tool-server.ts'
import type { OpenAIToolDef } from '../../../lib-sim/bridge/openai.ts'

const TOOLS: OpenAIToolDef[] = [{
  type: 'function',
  function: {
    name: 'get_weather',
    description: 'Get the weather',
    parameters: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] }
  }
}]

test.describe('tool listing', () => {
  test('passes the JSON Schema through verbatim', () => {
    const listed = listToolsFor(TOOLS)
    assert.equal(listed.length, 1)
    assert.equal(listed[0].name, 'get_weather')
    assert.equal(listed[0].description, 'Get the weather')
    assert.deepEqual(listed[0].inputSchema, TOOLS[0].function.parameters)
  })

  test('supplies an empty object schema when a tool declares no parameters', () => {
    const listed = listToolsFor([{ type: 'function', function: { name: 'ping' } }])
    assert.deepEqual(listed[0].inputSchema, { type: 'object', properties: {} })
  })

  test('tolerates a missing description', () => {
    const listed = listToolsFor([{ type: 'function', function: { name: 'ping' } }])
    assert.equal(typeof listed[0].description, 'string')
  })
})

test.describe('tool server config', () => {
  test('is an sdk server that always loads, with a long timeout', () => {
    const cfg = createToolServer(TOOLS, async () => 'ok')
    assert.equal(cfg.type, 'sdk')
    assert.equal(cfg.name, 'bridge')
    assert.equal(cfg.alwaysLoad, true)
    assert.equal(cfg.timeout, TOOL_TIMEOUT_MS)
    assert.ok(cfg.instance)
  })

  test('the timeout is long enough for a human-driven tool call', () => {
    assert.ok(TOOL_TIMEOUT_MS >= 600000, 'a suspended handler must outlive a slow client turn')
  })
})

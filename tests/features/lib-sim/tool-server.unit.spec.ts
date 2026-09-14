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
  test('is an sdk server that always loads', () => {
    const cfg = createToolServer(TOOLS, async () => 'ok')
    assert.equal(cfg.type, 'sdk')
    // MCP_SERVER_NAME, not a re-import of it: the name is half of the
    // `mcp__bridge__` tool namespace the bridge's allowedTools depend on, so
    // the literal is the contract.
    assert.equal(cfg.name, 'bridge')
    assert.equal(cfg.alwaysLoad, true)
    assert.ok(cfg.instance)
  })

  test('the configured timeout outlives a human-driven tool call', () => {
    // Asserted against a floor, not against TOOL_TIMEOUT_MS: comparing the
    // config to the same constant the config is built from restates the
    // implementation and cannot fail. A suspended handler waits for a person to
    // press a button, so anything under ten minutes cuts off a legitimate turn.
    const cfg = createToolServer(TOOLS, async () => 'ok')
    assert.ok(
      cfg.timeout >= 600000,
      `tool server timeout ${cfg.timeout}ms is below the ten-minute floor a suspended handler needs`
    )
    assert.equal(cfg.timeout, TOOL_TIMEOUT_MS, 'the exported constant must describe the configured value')
  })
})

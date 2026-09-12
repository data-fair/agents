import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { personaSystemPrompt, personaPrompt, DONE } from '../../../simulations/runner/persona.ts'
import { cases } from '../../../simulations/cases/index.ts'

const c = cases[0]

test.describe('persona prompting', () => {
  test('the system prompt carries the persona and the goal', () => {
    const p = personaSystemPrompt(c)
    assert.ok(p.includes(c.persona))
    assert.ok(p.includes(c.goal))
  })

  test('the system prompt never mentions the product or its internals', () => {
    const p = personaSystemPrompt(c).toLowerCase()
    for (const leak of ['data-fair', 'webmcp', 'vjsf', 'mcp', 'tool call', 'json schema']) {
      assert.ok(!p.includes(leak), `persona prompt leaks "${leak}"`)
    }
  })

  test('the first turn asks for an opening message with no transcript', () => {
    const p = personaPrompt([], 5)
    assert.ok(p.includes('first message'))
  })

  test('later turns carry the conversation so far', () => {
    const p = personaPrompt([{ role: 'user', text: 'hello' }, { role: 'assistant', text: 'how can I help' }], 3)
    assert.ok(p.includes('how can I help'))
    assert.ok(p.includes(DONE))
  })

  test('warns the persona when it is nearly out of turns', () => {
    assert.ok(personaPrompt([{ role: 'assistant', text: 'x' }], 1).includes('last'))
  })

  test('importing the module has no side effects (no filesystem I/O at module scope)', () => {
    // Reading the module source to verify createNeutralCwd is not called at module scope.
    // If the module calls createNeutralCwd outside of a function body (at module load time),
    // it creates a temporary directory leak every time npm test runs.
    const sourceFile = resolve('simulations/runner/persona.ts')
    const source = readFileSync(sourceFile, 'utf-8')

    // Extract the code at module scope (lines before first function/export function)
    // Look for any direct call to createNeutralCwd() outside of function bodies
    const lines = source.split('\n')
    let inFunctionBody = false
    let functionDepth = 0

    for (const line of lines) {
      // Track function boundaries
      if (line.match(/^\s*(export\s+)?(async\s+)?function|^\s*(export\s+)?const.*=\s*\(|^\s*for\s*await/)) {
        inFunctionBody = true
        functionDepth++
      }
      if (line.includes('{') && inFunctionBody) functionDepth++
      if (line.includes('}') && inFunctionBody) functionDepth--
      if (functionDepth === 0 && inFunctionBody) inFunctionBody = false

      // At module scope (not in function), createNeutralCwd() must not be called
      if (!inFunctionBody && line.includes('createNeutralCwd()')) {
        assert.fail(
          'createNeutralCwd is called at module scope. This leaks a temporary directory at import time. ' +
          'Move the call inside nextUserMessage using lazy initialization (neutralCwd ??= createNeutralCwd()).'
        )
      }
    }

    // Verify the lazy pattern exists in nextUserMessage
    assert.ok(
      source.includes('neutralCwd ??= createNeutralCwd()'),
      'nextUserMessage must use lazy initialization: neutralCwd ??= createNeutralCwd()'
    )
  })
})

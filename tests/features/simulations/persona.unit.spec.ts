import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { personaSystemPrompt, personaPrompt, DONE, isDone } from '../../../simulations/runner/persona.ts'
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

  test('importing the module has no side effects (no temp dir created at import time)', async () => {
    // Count temp dirs with "bridge-" prefix before import
    const beforeCount = readdirSync(tmpdir()).filter(name => name.startsWith('bridge-')).length

    // Force a fresh module evaluation with cache-busting query parameter
    // Node.js treats the same module path with different query strings as different entries
    await import('../../../simulations/runner/persona.ts?fresh=' + Date.now())

    // Count again — should be unchanged
    const afterCount = readdirSync(tmpdir()).filter(name => name.startsWith('bridge-')).length

    assert.equal(
      afterCount,
      beforeCount,
      'Importing persona.ts must not create a temp directory. ' +
      'The unit suite imports this module, so any import-time side effect would leak a directory per test run. ' +
      'Use lazy initialization: neutralCwd ??= createNeutralCwd() inside nextUserMessage().'
    )
  })
})

test.describe('isDone', () => {
  test('matches exact DONE', () => {
    assert.ok(isDone('DONE'))
  })

  test('matches DONE with trailing period', () => {
    assert.ok(isDone('DONE.'))
  })

  test('matches quoted DONE', () => {
    assert.ok(isDone('"DONE"'))
  })

  test('matches done in lowercase (case-insensitive)', () => {
    assert.ok(isDone('done'))
  })

  test('returns false for a sentence containing done (not the terminator)', () => {
    assert.ok(!isDone('I am done looking, but this is not the terminator'))
    assert.ok(!isDone("That's done, but the panel is still empty"))
  })

  test('returns false for empty string', () => {
    assert.ok(!isDone(''))
  })
})

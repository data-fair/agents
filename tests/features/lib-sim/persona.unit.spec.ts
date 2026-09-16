import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { personaSystemPrompt, personaPrompt, DONE, isDone, nextUserMessage, PERSONA_MAX_TURNS, type PersonaQuery } from '../../../lib-sim/persona.ts'
import type { PagePerception } from '../../../lib-sim/page-perception.ts'
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

  test('the perception instructions tell it to look before claiming', () => {
    const p = personaSystemPrompt(cases[0], true)
    assert.ok(p.includes('look'), 'the persona must be told it can look')
    assert.ok(/never claim you cannot see/i.test(p))
  })

  test('a blind persona keeps its original prompt', () => {
    // Consumers on 0.2.0 must behave exactly as before.
    assert.equal(personaSystemPrompt(cases[0], false), personaSystemPrompt(cases[0]))
  })

  test('with perception but no offLimits, the prompt does not promise a composer refusal', () => {
    // createPagePerception(roots) with no offLimits refuses nothing — a prompt
    // claiming otherwise sends the persona straight at the composer, which then
    // double-sends its message. See lib-sim/README.md, "Give the persona eyes".
    const p = personaSystemPrompt(cases[0], true, false)
    assert.ok(!/refuse you/i.test(p), 'no offLimits configured, so no refusal is real')
  })

  test('with perception and offLimits, the prompt promises the composer refusal', () => {
    const p = personaSystemPrompt(cases[0], true, true)
    assert.ok(/refuse you/i.test(p))
  })

  test('importing the module has no side effects (no temp dir created at import time)', async () => {
    // Count temp dirs with "bridge-" prefix before import
    const beforeCount = readdirSync(tmpdir()).filter(name => name.startsWith('bridge-')).length

    // Force a fresh module evaluation with cache-busting query parameter
    // Node.js treats the same module path with different query strings as different entries
    await import('../../../lib-sim/persona.ts?fresh=' + Date.now())

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

test.describe('nextUserMessage MCP wiring', () => {
  // A minimal fake of what createPagePerception(...) returns — only the shape
  // nextUserMessage actually reads.
  const fakePerception: PagePerception = {
    server: { type: 'sdk', name: 'page', instance: {}, alwaysLoad: true },
    observations: [],
    setTurn: () => {},
    toolNames: ['look', 'click', 'type'],
    call: async () => '',
    offLimits: []
  }

  async function * fakeReply (text: string) {
    yield { type: 'assistant', message: { content: [{ type: 'text', text }] } } as any
  }

  function captureOptions (): { query: PersonaQuery, captured: () => any } {
    let captured: any
    const query: PersonaQuery = ((args: any) => {
      captured = args.options
      return fakeReply('ok')
    }) as unknown as PersonaQuery
    return { query, captured: () => captured }
  }

  test('wires mcpServers, allowedTools, maxTurns and isolation when perception is given', async () => {
    const { query, captured } = captureOptions()
    await nextUserMessage(c, [], 5, { perception: fakePerception, query })
    const options = captured()

    assert.deepEqual(Object.keys(options.mcpServers), ['page'])
    assert.deepEqual(options.allowedTools, ['mcp__page__look', 'mcp__page__click', 'mcp__page__type'])
    assert.equal(options.maxTurns, PERSONA_MAX_TURNS)
    assert.deepEqual(options.tools, [])
    assert.deepEqual(options.settingSources, [])
    assert.equal(options.strictMcpConfig, true)
  })

  test('without perception there is no mcp wiring', async () => {
    const { query, captured } = captureOptions()
    await nextUserMessage(c, [], 5, { query })
    const options = captured()

    assert.equal(options.mcpServers, undefined)
    assert.equal(options.allowedTools, undefined)
  })

  test('the system prompt promises the composer refusal only when offLimits is non-empty', async () => {
    const { query, captured } = captureOptions()
    await nextUserMessage(c, [], 5, { perception: { ...fakePerception, offLimits: ['Send'] }, query })
    assert.ok(/refuse you/i.test(captured().systemPrompt))
  })

  test('the system prompt does not promise a composer refusal when offLimits is empty', async () => {
    const { query, captured } = captureOptions()
    await nextUserMessage(c, [], 5, { perception: fakePerception, query })
    assert.ok(!/refuse you/i.test(captured().systemPrompt))
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

test.describe('nextUserMessage assembles the reply', () => {
  // With perception wired in, the SDK emits one assistant message per reasoning
  // step between tool calls and then the real reply. Concatenating them all sent
  // the persona's inner monologue to the assistant as if it were what the person
  // typed — including, in one recorded run, the name of the tool the assistant
  // should call, and in another the DONE sentinel welded onto a sentence, which
  // made isDone() miss it and cost the run an extra turn and a 124s wait.
  const stream = (...messages: Array<string[]>) => (async function * () {
    for (const texts of messages) {
      yield { type: 'assistant', message: { content: texts.map(text => ({ type: 'text', text })) } } as any
    }
  })()

  test('keeps only the last assistant message, not the thinking that preceded it', async () => {
    const query = (() => stream(
      ['I can see the panel is open. Let me put some text in there.'],
      ['The Display textbox is readonly, so the assistant must do it.'],
      ['Put "Welcome to the panel!" in the display.']
    )) as unknown as PersonaQuery
    const out = await nextUserMessage(cases[0], [], 3, { query })
    assert.equal(out, 'Put "Welcome to the panel!" in the display.')
  })

  test('leaves a lone DONE recognisable, so the run actually stops', async () => {
    const query = (() => stream(
      ['I clicked the path and nothing happened. I am not getting the list.'],
      [DONE]
    )) as unknown as PersonaQuery
    assert.equal(isDone(await nextUserMessage(cases[0], [], 3, { query })), true)
  })

  test('joins several text blocks within one message, which are one utterance', async () => {
    const query = (() => stream(['Hello. ', 'Can you help?'])) as unknown as PersonaQuery
    assert.equal(await nextUserMessage(cases[0], [], 3, { query }), 'Hello. Can you help?')
  })

  test('falls back to the last message that had text when the final one is tool-only', async () => {
    const query = (() => (async function * () {
      yield { type: 'assistant', message: { content: [{ type: 'text', text: 'Where is the list?' }] } } as any
      yield { type: 'assistant', message: { content: [{ type: 'tool_use', name: 'look' }] } } as any
    })()) as unknown as PersonaQuery
    assert.equal(await nextUserMessage(cases[0], [], 3, { query }), 'Where is the list?')
  })
})

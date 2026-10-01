/**
 * stateless unit tests for sub-agents server-side: config discovery, the partition, and the delegation.
 *
 * The partition is the part worth testing hardest. A lead that can still reach a worker's reserved tool
 * calls it directly instead of delegating, and the context reduction the whole pattern exists for —
 * the lead sees a summary, not the worker's trace — silently never happens.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { tool, jsonSchema, type Tool } from 'ai'
import { parseSubAgentConfig, partitionSubAgents, SUBAGENT_PREFIX } from '../../../api/src/agent-session/sub-agents.ts'

/** A tool whose execute returns a fixed value, standing in for a page tool over the socket. */
const fake = (returns: unknown): Tool => tool({
  description: 'a tool',
  inputSchema: jsonSchema({ type: 'object', properties: {} } as any),
  execute: async () => returns
})

const subAgentTool = (config: unknown): Tool => fake(typeof config === 'string' ? config : JSON.stringify(config))

/** A worker builder that records what it was handed, instead of running a model. */
const recordingBuilder = () => {
  const built: Array<{ name: string, tools: string[], prompt: string }> = []
  const build = (name: string, config: any, workerTools: Record<string, Tool>) => {
    built.push({ name, tools: Object.keys(workerTools), prompt: config.prompt })
    return fake(`delegated to ${name}`)
  }
  return { built, build }
}

test.describe('parseSubAgentConfig', () => {
  test('reads the JSON a page\'s subagent tool returns', () => {
    assert.deepEqual(
      parseSubAgentConfig(JSON.stringify({ prompt: 'You analyse.', tools: ['query_data'], model: 'tools' })),
      { prompt: 'You analyse.', tools: ['query_data'], model: 'tools' }
    )
  })

  test('accepts an object as well as a string, since only the wire stringifies it', () => {
    assert.deepEqual(parseSubAgentConfig({ prompt: 'p', tools: [] }), { prompt: 'p', tools: [] })
  })

  test('refuses anything that is not a config, rather than throwing', () => {
    // A `subagent_*` tool whose payload is not a config is a page bug. Returning undefined leaves it as
    // an ordinary tool; throwing would fail the whole turn over one bad declaration.
    assert.equal(parseSubAgentConfig('not json'), undefined)
    assert.equal(parseSubAgentConfig(JSON.stringify({ tools: [] })), undefined, 'no prompt')
    assert.equal(parseSubAgentConfig(JSON.stringify({ prompt: '', tools: [] })), undefined, 'empty prompt')
    assert.equal(parseSubAgentConfig(JSON.stringify({ prompt: 'p' })), undefined, 'no tools')
    assert.equal(parseSubAgentConfig(JSON.stringify({ prompt: 'p', tools: [1] })), undefined, 'tool names must be strings')
    assert.equal(parseSubAgentConfig(null), undefined)
  })
})

test.describe('partitionSubAgents', () => {
  const toolSet = () => ({
    set_display: fake('displayed'),
    query_data: fake('rows'),
    get_schema: fake('{}'),
    [`${SUBAGENT_PREFIX}analyst`]: subAgentTool({ prompt: 'You analyse.', tools: ['query_data', 'get_schema'], model: 'tools' })
  })

  test('removes a worker\'s reserved tools from the main set', async () => {
    const { build } = recordingBuilder()
    const { mainTools, reserved } = await partitionSubAgents(toolSet(), build)
    assert.deepEqual(Object.keys(mainTools).sort(), ['set_display', 'subagent_analyst'])
    assert.deepEqual(reserved.sort(), ['get_schema', 'query_data'])
  })

  test('hands the worker exactly its declared tools', async () => {
    const { built, build } = recordingBuilder()
    await partitionSubAgents(toolSet(), build)
    assert.equal(built.length, 1)
    assert.deepEqual(built[0].tools.sort(), ['get_schema', 'query_data'])
    assert.equal(built[0].prompt, 'You analyse.')
  })

  test('a config naming a tool the page never registered does not break the worker', async () => {
    // The page's declaration and its registrations can disagree — a component removed, a name typed
    // wrong. The worker is built with what exists rather than being unbuildable.
    const { built, build } = recordingBuilder()
    const tools = {
      query_data: fake('rows'),
      [`${SUBAGENT_PREFIX}analyst`]: subAgentTool({ prompt: 'p', tools: ['query_data', 'nonexistent'] })
    }
    await partitionSubAgents(tools, build)
    assert.deepEqual(built[0].tools, ['query_data'])
  })

  test('a subagent tool returning nonsense is left as an ordinary tool', async () => {
    const { built, build } = recordingBuilder()
    const tools = { [`${SUBAGENT_PREFIX}broken`]: fake('not a config'), keep_me: fake('x') }
    const { mainTools, configs } = await partitionSubAgents(tools, build)
    assert.deepEqual(configs, {})
    assert.equal(built.length, 0)
    // Still absent from the main set: a `subagent_*` tool whose config could not be read would
    // otherwise hand the model a config blob as if it were a result.
    assert.deepEqual(Object.keys(mainTools), ['keep_me'])
  })

  test('a subagent tool that throws while being read is skipped, not fatal', async () => {
    const { build } = recordingBuilder()
    const tools = {
      [`${SUBAGENT_PREFIX}gone`]: tool({
        description: 'x',
        inputSchema: jsonSchema({ type: 'object', properties: {} } as any),
        // Return type annotated: an execute that only throws infers `never`, which does not satisfy
        // tool()'s overloads.
        execute: async (): Promise<string> => { throw new Error('the page went away') }
      }),
      keep_me: fake('x')
    }
    const { mainTools } = await partitionSubAgents(tools, build)
    assert.deepEqual(Object.keys(mainTools), ['keep_me'])
  })

  test('two workers can reserve different tools, and both are removed', async () => {
    const { built, build } = recordingBuilder()
    const tools = {
      query_data: fake('rows'),
      format_text: fake('formatted'),
      set_display: fake('displayed'),
      [`${SUBAGENT_PREFIX}analyst`]: subAgentTool({ prompt: 'a', tools: ['query_data'] }),
      [`${SUBAGENT_PREFIX}writer`]: subAgentTool({ prompt: 'w', tools: ['format_text'] })
    }
    const { mainTools, reserved } = await partitionSubAgents(tools, build)
    assert.deepEqual(Object.keys(mainTools).sort(), ['set_display', 'subagent_analyst', 'subagent_writer'])
    assert.deepEqual(reserved.sort(), ['format_text', 'query_data'])
    assert.equal(built.length, 2)
  })

  test('a tool reserved by two workers is given to both and removed once', async () => {
    const { built, build } = recordingBuilder()
    const tools = {
      query_data: fake('rows'),
      [`${SUBAGENT_PREFIX}a`]: subAgentTool({ prompt: 'a', tools: ['query_data'] }),
      [`${SUBAGENT_PREFIX}b`]: subAgentTool({ prompt: 'b', tools: ['query_data'] })
    }
    const { mainTools } = await partitionSubAgents(tools, build)
    assert.deepEqual(Object.keys(mainTools).sort(), ['subagent_a', 'subagent_b'])
    assert.deepEqual(built.map(b => b.tools), [['query_data'], ['query_data']])
  })

  test('a tool set with no sub-agents is passed through unchanged', async () => {
    const { build } = recordingBuilder()
    const tools = { a: fake('1'), b: fake('2') }
    const { mainTools, reserved, configs } = await partitionSubAgents(tools, build)
    assert.deepEqual(Object.keys(mainTools).sort(), ['a', 'b'])
    assert.deepEqual(reserved, [])
    assert.deepEqual(configs, {})
  })
})

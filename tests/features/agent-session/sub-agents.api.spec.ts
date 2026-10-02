/**
 * stateful API tests: a delegation actually RUNS a worker, streams its transcript, and is billed.
 *
 * This exists because the whole mechanism was dead and the suite said otherwise.
 * `api/src/agent-session/sub-agents.ts` was fully unit-tested — `partitionSubAgents`,
 * `subAgentDelegation`, the reserved-tool removal, the step-limit reporting — and had NO IMPORTER:
 * the executor assembled its tool set without partitioning, so a `subagent_*` page tool reached the
 * model as an ordinary tool, the model called it, the page answered with the sub-agent's JSON CONFIG,
 * and the lead treated that config as the result. No worker ever ran. The unit tests passed because
 * they test the module; the e2e tests that would have caught it sat behind an alphabetically earlier
 * failure in a `--max-failures=1` suite.
 *
 * So the assertions here are deliberately about the SEAM, not the module:
 *  - the config call happens, and the reserved tools do NOT reach the lead
 *  - the worker's own tool calls come back over the same socket (it really looped)
 *  - `subagent` frames carry its transcript while it works
 *  - the lead receives a SUMMARY, not the config
 *  - every worker step is billed: a `tools`-role entry in the run's telemetry, and credits on the run
 *
 * The last one is the point of the whole file. A worker is a model loop spending the deployment's
 * provider keys from inside a tool's `execute`, where the executor's own accounting cannot see it.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean, directoryUrl } from '../../support/axios.ts'
import { putMockSettings, mockProvider } from '../../support/settings.ts'
import { openAgentSession, type AgentSessionClient } from '../../support/ws.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })

const cookieOf = async (ax: any) => await ax.cookieJar.getCookieString(directoryUrl)

const provider = { type: 'mock', name: 'Mock Provider', id: 'mock-provider' }

/**
 * Two seats, two models: the lead answers on `mock-model`, the worker on `mock-tools` — whose canned
 * behaviour chains get_schema → query_data → a summary, which is what makes "the worker looped" an
 * observable fact rather than an inference.
 */
const settings = {
  providers: [mockProvider],
  models: [
    { model: { id: 'mock-model', name: 'Mock Model', provider }, usage: ['assistant'], inputPricePerMillion: 0, outputPricePerMillion: 0 },
    // Priced NON-ZERO, deliberately: at 0 the credit total is 0, `if (total > 0)` skips the usage
    // record, and a billing assertion would pass on a worker that was never charged for anything.
    { model: { id: 'mock-tools', name: 'Mock Tools Model', provider }, usage: ['tools'], inputPricePerMillion: 400000, outputPricePerMillion: 400000 }
  ],
  modelMapping: {
    assistant: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' },
    tools: { provider: 'mock-provider', id: 'mock-tools', name: 'Mock Tools Model' }
  }
}

/** The page's declared tools: the sub-agent, plus the two tools it reserves. */
const pageTools = [
  { name: 'subagent_data_analyst', description: 'the data analyst sub-agent', inputSchema: { type: 'object' } },
  { name: 'get_schema', description: 'returns a dataset schema', inputSchema: { type: 'object', properties: { dataset: { type: 'string' } } } },
  { name: 'query_data', description: 'queries a dataset', inputSchema: { type: 'object', properties: { dataset: { type: 'string' } } } }
]

const SUB_AGENT_CONFIG = JSON.stringify({
  prompt: 'You are a data analyst. Use your tools, then report what you found.',
  tools: ['get_schema', 'query_data']
})

test.describe('A delegation over the agent session', () => {
  const sockets: AgentSessionClient[] = []

  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1', settings)
  })
  test.afterEach(() => { for (const socket of sockets.splice(0)) socket.close() })

  const open = async () => {
    const socket = await openAgentSession(await cookieOf(orgAdmin))
    sockets.push(socket)
    return socket
  }

  /**
   * Drive one turn, answering every tool call the way the page would: the sub-agent tool returns its
   * CONFIG (that is the protocol — a config, not a result), its reserved tools return data.
   *
   * Returns every frame seen, plus the tool names that were asked for, in order.
   */
  const runDelegation = async (socket: AgentSessionClient, prompt: string) => {
    const conversation = (await orgAdmin.post('/api/conversations/organization/test1', {
      agentId: 'personal', title: 'delegation'
    })).data
    socket.send({ type: 'hello', conversationId: conversation.id, tools: pageTools })
    socket.send({ type: 'prompt', content: prompt })

    const frames: any[] = []
    const asked: string[] = []
    for (;;) {
      const frame = await socket.next(20000)
      frames.push(frame)
      if (frame.type === 'tool-call') {
        asked.push(frame.name)
        const result = frame.name === 'subagent_data_analyst'
          ? SUB_AGENT_CONFIG
          : frame.name === 'get_schema'
            ? '{"columns":["city","closures"]}'
            : '{"rows":[{"city":"Lyon","closures":3}]}'
        socket.send({ type: 'tool-result', callId: frame.callId, result })
      }
      if (frame.type === 'turn-end') break
    }
    return { conversation, frames, asked }
  }

  test('the worker runs, its transcript streams, and the lead gets a summary', async () => {
    const socket = await open()
    const { conversation, frames, asked } = await runDelegation(socket, 'call tool subagent_data_analyst {"task":"analyze the closures"}')

    // The config read: the partition calls the sub-agent tool once per turn to learn what it is.
    assert.ok(asked.includes('subagent_data_analyst'), 'the sub-agent tool was called for its config')

    // THE WORKER REALLY LOOPED. These two are its tools, not the lead's — the lead cannot call them
    // (see the next test), so their presence here can only come from a worker running.
    assert.ok(asked.includes('get_schema'), 'the worker called its first tool')
    assert.ok(asked.includes('query_data'), 'and then its second')

    // Its transcript reached the browser while it worked, which is what fills the panel. This frame
    // type is declared in the protocol and handled by the client; nothing produced it before.
    const subAgentFrames = frames.filter(frame => frame.type === 'subagent')
    assert.ok(subAgentFrames.length > 0, 'at least one subagent frame')
    assert.equal(subAgentFrames[0].name, 'subagent_data_analyst')
    assert.ok(subAgentFrames.at(-1).parts.length > 0, 'the last frame carries the worker transcript')
    assert.equal(subAgentFrames.at(-1).pending, false, 'and the final one says it is settled')
    const workerToolParts = subAgentFrames.at(-1).parts.filter((part: any) => part.type === 'dynamic-tool')
    assert.ok(workerToolParts.length >= 2, 'the transcript shows the worker own tool calls')

    // The LEAD got a summary, not the config it would have got before. This is the assertion that
    // fails on the old behaviour: the config's text would be sitting in the tool output.
    const messages = (await orgAdmin.get(`/api/conversations/organization/test1/${conversation.id}/messages`)).data
    const outputs = messages.results
      .flatMap((message: any) => message.parts ?? [])
      .filter((part: any) => part.type === 'dynamic-tool' && part.toolName === 'subagent_data_analyst')
      .map((part: any) => JSON.stringify(part.output ?? ''))
      .join(' ')
    assert.ok(outputs.length > 0, 'the delegation produced an output')
    assert.ok(!outputs.includes('You are a data analyst'), 'the lead was NOT handed the sub-agent config')
    assert.ok(/Analysis complete|task completed/i.test(outputs), 'the lead was handed the worker answer')
  })

  test('a reserved tool is not reachable by the lead', async () => {
    // The partition's whole purpose: a lead that could call `query_data` itself would, and the context
    // reduction the pattern exists for would never happen.
    const socket = await open()
    const { frames } = await runDelegation(socket, 'call tool query_data {"dataset":"test"}')

    // The lead asked for a tool it does not have, so the turn carries an error rather than a result —
    // what matters is that the page was never asked to run it on the LEAD's behalf.
    const leadCalls = frames.filter(frame => frame.type === 'tool-call' && frame.name === 'query_data')
    assert.equal(leadCalls.length, 0, 'the page was never asked to run a reserved tool for the lead')
  })

  test('every worker step is billed, on the tools seat', async () => {
    const socket = await open()
    const { conversation } = await runDelegation(socket, 'call tool subagent_data_analyst {"task":"analyze the closures"}')

    const runs = (await orgAdmin.get(`/api/conversations/organization/test1/${conversation.id}/runs`)).data
    const run = runs.results[0]
    const workerCalls = (run.calls ?? []).filter((call: any) => call.modelRole === 'tools')
    assert.ok(workerCalls.length > 0, 'the worker calls are recorded in the run telemetry')
    assert.equal(workerCalls[0].model, 'mock-tools', 'on the tools seat, not the assistant one')
    assert.ok(workerCalls.every((call: any) => call.credits > 0), 'each one costs what it spent')

    // And the run's own total covers them: the budget that stops a greedy turn has to see this spend,
    // or a delegated turn could spend without limit.
    const workerCredits = workerCalls.reduce((sum: number, call: any) => sum + call.credits, 0)
    assert.ok(run.credits >= workerCredits, `run credits ${run.credits} should cover the worker's ${workerCredits}`)

    // The usage histogram too, under the tools role — otherwise the spend is invisible to an admin
    // looking at where the account's credits went. Read the same way usage.api.spec.ts reads it.
    const today = new Date().toISOString().slice(0, 10)
    const history = (await orgAdmin.get('/api/usage/organization/test1/history?scope=account-daily&days=7&dimension=modelRole')).data
    const byRole = history.entries.find((entry: any) => entry.label === today)?.breakdown ?? {}
    assert.ok((byRole.tools ?? 0) > 0, `tools-role usage should be recorded, got ${JSON.stringify(byRole)}`)
  })
})

/**
 * stateful API tests: an agent with memory gets the `memory` tool and sees its memory in the prompt.
 *
 * The mock model's `call tool <name> <json>` seam makes the model call the tool with exactly those
 * arguments, so these tests drive the real executor, the real tool and the real store.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { axiosAuth, superAdmin, clean } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin
const orgAdmin = await axiosAuth('test1-admin1', { org: 'test1' })

const createAgent = async (memory?: { enabled: boolean }) => {
  const agent = (await admin.post('/api/autonomous-agents/organization/test1', {
    title: 'Mem', persona: 'You answer briefly.', mcpServers: [], enabled: true, ...(memory ? { memory } : {})
  })).data
  await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
  return agent
}

const turn = async (conversationId: string, content: string) => {
  const { runId } = (await orgAdmin.post(`/api/conversations/organization/test1/${conversationId}/messages`, { content })).data
  let run: any
  for (let i = 0; i < 100; i++) {
    run = (await orgAdmin.get(`/api/runs/organization/test1/${runId}`)).data
    if (run.status !== 'running') break
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  const messages = (await orgAdmin.get(`/api/conversations/organization/test1/${conversationId}/messages`)).data.results
  return { run, assistant: messages.find((m: any) => m.role === 'assistant' && m.runId === runId) }
}
const thread = async (agentId: string) => (await orgAdmin.post('/api/conversations/organization/test1', { agentId, title: 't' })).data.id as string
const call = (args: object) => `call tool memory ${JSON.stringify(args)}`

test.describe('The memory tool', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test1')
  })

  test('a write lands in the store with the run as its provenance', async () => {
    const agent = await createAgent({ enabled: true })
    const conversationId = await thread(agent.id)
    const { run, assistant } = await turn(conversationId, call({ command: 'create', path: '/memories/MEMORY.md', description: 'Core facts', file_text: '- prefers French' }))
    assert.equal(run.status, 'done')
    const part = assistant.parts.find((p: any) => p.type === 'dynamic-tool' && p.toolName === 'memory')
    assert.equal(part.state, 'output-available')
    assert.equal(part.toolMetadata.serverId, 'agent-memory')
    assert.match(part.output, /<tool-result server="agent-memory" tool="memory">/)

    const memory = (await orgAdmin.get(`/api/memory/organization/test1/${agent.id}`)).data
    assert.equal(memory.documents[0].path, 'MEMORY.md')
    const versions = (await orgAdmin.get(`/api/memory/organization/test1/${agent.id}/versions`)).data
    assert.deepEqual(
      { kind: versions.results[0].author.kind, runId: versions.results[0].author.runId, conversationId: versions.results[0].author.conversationId },
      { kind: 'agent', runId: run.id, conversationId }
    )
    assert.ok(versions.results[0].author.toolCallId)
  })

  test('a refused write is a failed call the model is told about', async () => {
    const agent = await createAgent({ enabled: true })
    const { assistant } = await turn(await thread(agent.id), call({ command: 'str_replace', path: 'nope.md', old_str: 'a', new_str: 'b' }))
    const part = assistant.parts.find((p: any) => p.type === 'dynamic-tool' && p.toolName === 'memory')
    assert.equal(part.state, 'output-error')
    assert.match(part.errorText, /does not exist/)
  })

  test('the NEXT run sees the memory in its recorded system prompt; the writing run does not', async () => {
    const agent = await createAgent({ enabled: true })
    const conversationId = await thread(agent.id)
    const first = await turn(conversationId, call({ command: 'create', path: 'MEMORY.md', description: 'Core', file_text: '- the sales dataset is ventes' }))
    const second = await turn(conversationId, 'hello')
    const review = (await orgAdmin.get(`/api/review/organization/test1/${conversationId}`)).data
    const prompts = Object.fromEntries(review.runs.map((r: any) => [r.id, r.systemPrompt]))
    assert.match(prompts[first.run.id], /Your memory is empty/)
    assert.match(prompts[second.run.id], /the sales dataset is ventes/)
  })

  test('memory spans conversations: written in one, shown in another', async () => {
    const agent = await createAgent({ enabled: true })
    await turn(await thread(agent.id), call({ command: 'create', path: 'MEMORY.md', description: 'Core', file_text: '- shared fact' }))
    const other = await thread(agent.id)
    const { run } = await turn(other, 'hello')
    const review = (await orgAdmin.get(`/api/review/organization/test1/${other}`)).data
    assert.match(review.runs.find((r: any) => r.id === run.id).systemPrompt, /shared fact/)
  })

  test('an agent without memory gets neither the tool nor the block', async () => {
    const agent = await createAgent()
    const conversationId = await thread(agent.id)
    const { run, assistant } = await turn(conversationId, call({ command: 'view' }))
    const part = assistant.parts.find((p: any) => p.type === 'dynamic-tool')
    // the model asked for a tool the turn does not offer
    assert.notEqual(part?.state, 'output-available')
    const review = (await orgAdmin.get(`/api/review/organization/test1/${conversationId}`)).data
    assert.doesNotMatch(review.runs.find((r: any) => r.id === run.id).systemPrompt, /agent-memory/)
  })

  test('turning memory off keeps the thread working', async () => {
    // Review Focus 3: history holds memory calls the next turn no longer offers.
    const agent = await createAgent({ enabled: true })
    const conversationId = await thread(agent.id)
    await turn(conversationId, call({ command: 'create', path: 'MEMORY.md', description: 'Core', file_text: '- x' }))
    // No `nhi` in the body (the PUT replaces the document and would otherwise un-enrol or re-exchange):
    // enrol again right after, as runtime.api.spec.ts does.
    await admin.put(`/api/autonomous-agents/organization/test1/${agent.id}`, { title: 'Mem', persona: 'You answer briefly.', mcpServers: [], enabled: true, memory: { enabled: false } })
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
    const { run } = await turn(conversationId, 'hello')
    assert.equal(run.status, 'done')
    assert.equal(run.stopReason, 'completed')
  })
})

/**
 * The simulation driver against the real chat, on the mock model: what the runner relies on to let the
 * person decide an approval, and to open a second conversation. Without this, a broken selector shows
 * up only as a judged simulation gone wrong — after spending a subscription on it.
 */
import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { createChatDriver } from '../../../lib-sim/chat-driver.ts'

const admin = await superAdmin

test.describe('Simulation chat driver', () => {
  let fixture: McpFixture
  let agentId: string
  test.beforeAll(async () => { fixture = await startMcpFixture(Number(process.env.NGINX_PORT) + 30) })
  test.afterAll(async () => { await fixture.close() })
  test.beforeEach(async () => {
    await clean()
    fixture.resetInvokedTools()
    await putMockSettings(admin, 'organization/test1')
    agentId = (await admin.post('/api/autonomous-agents/organization/test1', {
      title: 'Driver probe', persona: 'You answer briefly.', mcpServers: [{ serverId: 'dev-public-mcp' }], enabled: true
    })).data.id
    await admin.post('/api/test-env/enrol-autonomous-agent', { agentId })
  })

  // The judged run that found this: the API restarted (a deploy, here a dev reload) while the person
  // read the answer to their approval, and their next message was queued behind a socket that never
  // opened again — Stop on screen for ten minutes, nothing on the server. The server closing the
  // socket is played by the route; everything else is the real stack.
  test('a message sent after the server closed the socket is answered, in the same conversation', async ({ page, goToWithAuth }) => {
    const sockets: Array<{ close: () => Promise<void> }> = []
    await page.routeWebSocket(/\/agent-session$/, ws => {
      ws.connectToServer()
      sockets.push(ws)
    })
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agentId}`, 'test1-admin1', { org: 'test1' })
    const chat = createChatDriver(page)
    await chat.prepare()
    await chat.sendMessage('call tool wipe_everything {}')
    expect(await chat.waitForTurn()).toBe('approval')
    // As the persona's `click` reaches it: a button, by its visible name. Not 'ended' above: the runner
    // would otherwise type the person's next words over the continuation.
    await page.getByRole('button', { name: 'Approve' }).first().click()
    expect(await chat.waitForTurn()).toBe('ended')
    await expect.poll(() => fixture.invokedTools()).toEqual(['wipe_everything'])
    const before = (await chat.readConversation()).length

    await sockets[sockets.length - 1].close()
    await chat.sendMessage('hello')
    expect(await chat.waitForTurn(15000)).toBe('ended')
    const after = await chat.readConversation()
    // The thread's history replayed into the transcript it already had, not appended a second time.
    expect(after.length).toBe(before + 2)
    expect(after.slice(-2)).toEqual([{ role: 'user', text: 'hello' }, { role: 'assistant', text: 'world' }])

    // One conversation, holding the message: not a second thread started by the reopened socket.
    const listed = (await admin.get('/api/review/organization/test1?size=10')).data.results
    expect(listed.filter((c: any) => c.agentId === agentId)).toHaveLength(1)
  })

  test('a new conversation empties the chat and takes the next message as its first', async ({ page, goToWithAuth }) => {
    await goToWithAuth(`/agents/organization/test1/chat?agentId=${agentId}`, 'test1-admin1', { org: 'test1' })
    const chat = createChatDriver(page)
    await chat.prepare()
    await chat.sendMessage('hello')
    expect(await chat.waitForTurn()).toBe('ended')
    expect((await chat.readConversation()).length).toBe(2)

    await chat.newConversation()
    expect(await chat.readConversation()).toEqual([])
    await chat.sendMessage('hello')
    expect(await chat.waitForTurn()).toBe('ended')
    expect((await chat.readConversation()).map(m => m.role)).toEqual(['user', 'assistant'])

    // Two threads on the server, not one thread shown twice.
    const listed = (await admin.get('/api/review/organization/test1?size=10')).data.results
    expect(listed.filter((c: any) => c.agentId === agentId)).toHaveLength(2)
  })
})

/**
 * Host events end to end, on the _dev/chat-workflow page with the mock model:
 * retained state at activation, events in the next turn, events appended to the causing
 * tool's result, and wait_for_user_action resuming the same turn on the next event.
 */
// WHAT MOVED DOWN TO api, and why (§10.7 of the one-server-loop review):
//
// Six tests were removed from this file. Four of them asserted the browser loop's ACTIVATION model —
// retained state sent only on turns where the model had no history to integrate from, with keyed
// events deduped against it. The server sends state on every turn and drains events: simpler by a
// whole concept, and `host-context.api.spec.ts` asserts that contract in ~1s per case against ~17s
// here. The other two (a coalesced action between turns, a wait resumed by a click) are covered by
// `host-context.api.spec.ts` and `wait-tool.api.spec.ts`.
//
// What stays here is what genuinely needs a browser: the PAGE emitting events — a dialog opening, a
// navigation, a click — and the chat rendering the result. The loop's half does not.

import { expect } from '@playwright/test'
import assert from 'node:assert/strict'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { createChatDriver } from '../../../lib-sim/chat-driver.ts'
import { mockProvider, mockModelRef, putMockSettings } from '../../support/settings.ts'

// The dedicated mock summarizer is mapped explicitly so the compaction round-trip
// (used by the compaction-dedupe test below) actually runs instead of failing for
// want of a summarizer model.
const summarizerModelRef = {
  id: 'mock-summarizer',
  name: 'Mock Summarizer',
  provider: { type: 'mock', name: mockProvider.name, id: mockProvider.id }
}

const settingsOverrides = {
  models: [
    { model: mockModelRef, usage: ['assistant', 'tools', 'moderator'], inputPricePerMillion: 0, outputPricePerMillion: 0 },
    { model: summarizerModelRef, usage: ['summarizer'], inputPricePerMillion: 0, outputPricePerMillion: 0 }
  ],
  modelMapping: {
    summarizer: { provider: mockProvider.id, id: summarizerModelRef.id, name: summarizerModelRef.name }
  }
}

const USER = 'test-standalone1'

test.describe('Host events', () => {
  test.beforeEach(async () => {
    await clean()
    const admin = await superAdmin
    await putMockSettings(admin, `user/${USER}`, settingsOverrides)
  })

  async function open (page: any, goToWithAuth: any) {
    await goToWithAuth('/agents/_dev/chat-workflow', USER)
    // Discovery is asynchronous; a turn sent before the page tools land would be built
    // with an empty tool set (same guard as 3.live-tools.e2e.spec.ts).
    await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
    await page.getByRole('tab', { name: 'Info' }).click()
    await expect(page.getByRole('button', { name: 'select_type' })).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /Close|Fermer/ }).click()
  }

  async function send (page: any, text: string) {
    await page.getByPlaceholder('Type your message...').fill(text)
    await page.getByRole('button', { name: 'Send' }).click()
  }

  const lastAnswer = (page: any) => page.locator('.assistant-content').last()

  async function reachConfirmation (page: any) {
    await page.getByRole('button', { name: 'Note', exact: true }).click()
    await page.getByLabel('Title').fill('Weekly groceries')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible()
  }

  test('events caused by a tool call ride in that tool result', async ({ page, goToWithAuth }) => {
    await open(page, goToWithAuth)
    await send(page, 'select note')
    // The mock echoes the tool result verbatim, and a result now arrives inside the provenance
    // envelope with the host-event block appended — so the answer contains the tool's own words and
    // the event it caused, with the envelope's notice between them. Asserted as two substrings rather
    // than as one line: the exact framing is the envelope's business (and it changed when the loop
    // moved server-side), while what must be true is that BOTH reached the model.
    await expect(lastAnswer(page)).toContainText('Type set to note.', { timeout: 15000 })
    await expect(lastAnswer(page)).toContainText('wizard: {"step":"title","type":"note","title":""}')
  })

  test('a keyed refresh during a wait is context, not the answer', async ({ page, goToWithAuth }) => {
    // The wizard publishes keyed state (step, type, title). Typing in its Title field
    // changes that state — the page catching up, not the person doing the thing the
    // wait is for. Before the rule, the first such refresh resolved the wait ("You did:
    // wizard: …"), the model retried, and the retry ate the full timeout: a judged run
    // spent two thirds of itself that way. Only the transition may resolve it, with the
    // refreshes riding along as followers.
    await open(page, goToWithAuth)
    await page.getByRole('button', { name: 'Note', exact: true }).click()
    await send(page, 'wait for me')
    await expect(page.getByTestId('chat-activity')).toContainText('Waiting for', { timeout: 15000 })

    await page.getByLabel('Title').fill('Weekly groceries')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible()
    // Two keyed refreshes have arrived (title, then step) and the wait is still armed.
    await expect(page.getByTestId('chat-activity')).toContainText('Waiting for')
    await expect(lastAnswer(page)).not.toContainText('You did:')

    await page.getByRole('button', { name: 'Create' }).click()
    await expect(lastAnswer(page)).toContainText('You did:', { timeout: 15000 })
    await expect(lastAnswer(page)).toContainText('item-created')
    // …and the state the page reached meanwhile is delivered with it, not lost.
    await expect(lastAnswer(page)).toContainText('"title":"Weekly groceries"')
  })

  test('a wait resolves with the departure when the user leaves the page', async ({ page, goToWithAuth }) => {
    await open(page, goToWithAuth)
    await reachConfirmation(page)
    await send(page, 'wait for me')
    await expect(page.getByTestId('chat-activity')).toContainText('Waiting for', { timeout: 15000 })
    await page.getByRole('button', { name: 'Leave page' }).click()
    await expect(lastAnswer(page)).toContainText('You did:', { timeout: 15000 })
    await expect(lastAnswer(page)).toContainText('"path":"/elsewhere"')
    await expect(page.getByPlaceholder('Type your message...')).toBeEditable()
  })

  test('a wait times out with the plain text and the turn ends', async ({ page, goToWithAuth }) => {
    await open(page, goToWithAuth)
    await reachConfirmation(page)
    await send(page, 'wait briefly')
    await expect(lastAnswer(page)).toContainText('No user action within 1 seconds', { timeout: 15000 })
    await expect(page.getByTestId('chat-activity')).toHaveCount(0)
  })

  test('the idle watchdog does not fire while a wait is pending', async ({ page, goToWithAuth }) => {
    await open(page, goToWithAuth)
    await reachConfirmation(page)
    // Shrink the idle watchdog well below how long we're about to sit in the wait
    // (the default wait timeout is two minutes). A pending wait produces no stream
    // parts by design, so if the watchdog were still armed during it — the bug this
    // guards against — it would fire during the pause below and abort the whole
    // turn with the generic timeout error instead of leaving the wait pending.
    await page.evaluate(() => sessionStorage.setItem('agent-chat-idle-timeout', '1000'))
    await send(page, 'wait for me')
    await expect(page.getByTestId('chat-activity')).toContainText('Waiting for: you to click Create', { timeout: 15000 })
    // Sit well past the shrunk idle timeout while the wait is still pending.
    await page.waitForTimeout(2500)
    // Still waiting, no timeout error alert: the watchdog did not fire during the pause.
    await expect(page.getByTestId('chat-activity')).toContainText('Waiting for: you to click Create')
    await expect(page.locator('.v-alert')).toHaveCount(0)
    // The wait still resolves normally afterwards.
    await page.getByRole('button', { name: 'Create' }).click()
    await expect(lastAnswer(page)).toContainText('You did:', { timeout: 15000 })
  })

  test('the simulation driver reads an armed wait as the turn handing control back', async ({ page, goToWithAuth }) => {
    // The harness runs the simulated person only BETWEEN turns, so a driver that
    // waited for the Stop button alone could never let them act on a wait: every
    // declared wait ran its whole window and was then recorded as a wedged turn.
    // A wait is the assistant standing still and handing control back, which is
    // exactly a turn boundary as far as the person is concerned.
    await open(page, goToWithAuth)
    await reachConfirmation(page)
    const chat = createChatDriver(page as any)

    await send(page, 'wait for me')
    const started = Date.now()
    // A generous ceiling: what is under test is that this returns on the wait
    // rather than running to the end of it.
    const outcome = await chat.waitForTurn(60_000)
    assert.equal(outcome, 'waiting')
    assert.ok(Date.now() - started < 30_000, 'the driver sat through the wait instead of reporting it')

    // And control really is with the person: their click resolves the wait, the
    // assistant finishes, and the same driver then reports an ordinary end.
    await page.getByRole('button', { name: 'Create' }).click()
    assert.equal(await chat.waitForTurn(60_000), 'ended')
    await expect(lastAnswer(page)).toContainText('You did:')
  })

  test('a message typed during a wait is not lost when the wait resolves first', async ({ page, goToWithAuth }) => {
    // The composer offers Send only while a wait is armed, so this is the one
    // moment a person can send into a turn that is still open — and the flag can
    // flip between the button being found and the click landing. Both send guards
    // used to `return` silently there: the message went nowhere, and nothing in
    // the composer, the transcript or the console said so. A judged simulation
    // lost six of its nine turns to it. The parent queues now, so whichever way
    // the race falls the message is delivered.
    await open(page, goToWithAuth)
    await reachConfirmation(page)
    await send(page, 'wait for me')
    await expect(page.getByTestId('chat-activity')).toContainText('Waiting for', { timeout: 15000 })

    await page.getByPlaceholder('Type your message...').fill('actually, never mind')
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()

    // Resolve the wait from the page, then send: the turn is resuming underneath.
    await page.getByRole('button', { name: 'Create' }).click()
    await page.getByRole('button', { name: 'Send' }).click()

    // Delivered, whichever way the race fell — and the composer let it go.
    await expect(page.locator('.agent-chat__user-bubble').last()).toContainText('actually, never mind', { timeout: 30000 })
    await expect(page.getByPlaceholder('Type your message...')).toHaveValue('')
  })

  test('Stop cancels a pending wait', async ({ page, goToWithAuth }) => {
    await open(page, goToWithAuth)
    await reachConfirmation(page)
    await send(page, 'wait for me')
    await expect(page.getByTestId('chat-activity')).toContainText('Waiting for', { timeout: 15000 })
    await page.getByRole('button', { name: /Stop|Arrêter/ }).click()
    await expect(page.getByTestId('chat-activity')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()
  })

  test('the person can speak during a wait, and their message takes the turn back', async ({ page, goToWithAuth }) => {
    // A pending wait is the assistant standing still by its own choice. Before
    // this, the composer refused input for the whole turn — minutes, at the wait's
    // default — so someone who wanted to say "actually, never mind" had no way to, short
    // of finding the Stop button. The wait is what made that reachable in normal
    // use: an ordinary turn is genuinely working and still refuses input.
    await open(page, goToWithAuth)
    await reachConfirmation(page)
    await send(page, 'wait for me')
    await expect(page.getByTestId('chat-activity')).toContainText('Waiting for', { timeout: 15000 })

    // Typing turns the Stop button back into Send: both gestures stay reachable,
    // Stop while there is nothing to say, Send the moment there is.
    await page.getByPlaceholder('Type your message...').fill('hello')
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()
    await page.getByRole('button', { name: 'Send' }).click()

    // The message is delivered and answered, rather than swallowed.
    await expect(page.locator('.assistant-content').last()).toContainText('world', { timeout: 15000 })
    // And the wait it interrupted is gone, not still armed behind the new turn.
    await expect(page.getByTestId('chat-activity')).toHaveCount(0)
  })

  test('speaking during a wait that follows a tool step leaves no empty-answer bubble', async ({ page, goToWithAuth }) => {
    // The AI SDK ends an aborted stream cleanly — an `abort` part, no throw — so the
    // interrupted turn used to run its normal ending: its last finished step called a
    // tool, which reads as an empty answer, and « I wasn't able to produce a
    // response » landed right under the person's message. A real session got it on
    // exactly this shape: open the add-line dialog, wait, "it's already open".
    await open(page, goToWithAuth)
    await send(page, 'select then wait')
    await expect(page.getByTestId('chat-activity')).toContainText('Waiting for', { timeout: 15000 })

    await page.getByPlaceholder('Type your message...').fill('hello')
    await page.getByRole('button', { name: 'Send' }).click()

    await expect(lastAnswer(page)).toContainText('world', { timeout: 15000 })
    await expect(page.getByTestId('chat-activity')).toHaveCount(0)
    await expect(page.getByText("I wasn't able to produce a response")).toHaveCount(0)
  })

  test('the waiting activity clears once the wait resolves (drives the host\'s waiting-user/working signal)', async ({ page, goToWithAuth }) => {
    // AgentChat.vue posts `agent-status: waiting-user` / `working` to the embedding host
    // purely off `chat.activity.value?.kind === 'waiting'` — but `sendDFrameMessage` only
    // posts when the page is actually embedded in an iframe (`window.parent !== window`),
    // and this dev page, opened directly by goToWithAuth, is not. So there is no
    // postMessage to intercept here; instead this pins the one flag that drives that
    // signal, which is the same thing the host would see either way.
    //
    // Resolved via timeout rather than clicking Create: clicking Create also unmounts
    // WorkflowWizard (swapped for WorkflowDetail), which unregisters that component's
    // page tools at essentially the same instant the wait resolves. Investigating an
    // intermittent failure of this assertion on that path (reproduces on unmodified
    // `use-agent-chat.ts` too, so it predates and is independent of this fix wave)
    // traced it to that unregister racing the wait's own resolution — a pre-existing
    // issue outside this fix wave's scope, worth a separate look. Timing out has no
    // such side effect, so it exercises the same onDone-clears-the-flag behaviour
    // without that unrelated race.
    await open(page, goToWithAuth)
    await reachConfirmation(page)
    await send(page, 'wait briefly')
    await expect(page.getByTestId('chat-activity')).toContainText('Waiting for: you to click Create', { timeout: 15000 })
    await expect(page.getByTestId('chat-activity')).toHaveCount(0, { timeout: 15000 })
    await expect(lastAnswer(page)).toContainText('No user action within 1 seconds', { timeout: 15000 })
  })
})

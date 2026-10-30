/**
 * stateful E2E tests: how the chat shows a turn's steps — reasoning folded where it happened, calls named
 * and stated, and the activity line gone once the answer is written.
 *
 * The mock answers "preface and call tool <name> <args>" with a step that reasons ("Planning the call."),
 * says "Let me check." and calls, then a step that reasons ("Reading the result.") and quotes the result
 * (see api/src/models/mock-model.ts).
 */

import { expect } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'
import { waitForPageTools } from '../../support/page-tools.ts'

const admin = await superAdmin

const follows = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)

test.describe('The steps of a turn, as the chat shows them', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'user/test-standalone1')
  })

  test('each step\'s reasoning is a folded line where it happened, and nothing is left running', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-mcp', 'test-standalone1')
    await waitForPageTools(page, 'set_data')

    await page.getByPlaceholder('Type your message...').fill('preface and call tool set_data {"data":"Hello"}')
    await page.getByRole('button', { name: 'Send' }).click()

    const answer = page.locator('.assistant-content').filter({ hasText: 'Tool said' })
    await expect(answer).toBeVisible({ timeout: 15000 })
    const reasoning = page.getByTestId('reasoning')
    await expect(reasoning).toHaveCount(2)

    // In the order it happened: reasoning, text, the call, reasoning, the answer.
    const preface = page.locator('.assistant-content').filter({ hasText: 'Let me check.' })
    const chip = page.getByTestId('tool-chip').filter({ hasText: 'Data' })
    await expect(chip).toHaveAttribute('data-state', 'done')
    const order = [reasoning.nth(0), preface, chip, reasoning.nth(1), answer]
    const handles = await Promise.all(order.map(l => l.elementHandle()))
    for (let i = 1; i < handles.length; i++) {
      expect(await handles[i - 1]!.evaluate(follows, handles[i]), `block ${i - 1} comes before block ${i}`).toBe(true)
    }

    // Folded until asked: its words are one click away, not on the page.
    await expect(page.getByText('Planning the call.')).toHaveCount(0)
    await reasoning.nth(0).getByRole('button').click()
    await expect(page.getByText('Planning the call.')).toBeVisible()
    await expect(page.getByText('Reading the result.')).toHaveCount(0)

    // The turn is over: no label is left saying the assistant is still at work.
    await expect(page.getByTestId('chat-activity')).toHaveCount(0)
  })

  test('a call that failed says so on its chip', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/_dev/chat-mcp', 'test-standalone1')
    await waitForPageTools(page, 'set_data')

    // A tool nobody offers: the call fails, the model is told, and the chip used to turn green anyway.
    await page.getByPlaceholder('Type your message...').fill('preface and call tool no_such_tool')
    await page.getByRole('button', { name: 'Send' }).click()

    const chip = page.getByTestId('tool-chip').filter({ hasText: 'no_such_tool' })
    await expect(chip).toHaveAttribute('data-state', 'failed', { timeout: 15000 })
    await expect(chip).toHaveClass(/text-error/)
  })
})

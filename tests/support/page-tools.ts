import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Whether the chat has DISCOVERED the page's tools (the aggregate its `hello` and `tools-changed`
 * frames carry), read where a person reads it: the page's group of the debug dialog's available tools.
 * Discovery is asynchronous — BroadcastChannel plus an MCP connect and listTools — and a turn sent
 * before it lands is built with a tool set missing them.
 */
const withDialog = async (page: Page, check: (dialog: Locator) => Promise<void>) => {
  await page.getByRole('button', { name: /Settings|Paramètres/ }).click()
  await page.getByRole('tab', { name: 'Tools' }).click()
  try {
    await check(page.locator('.v-dialog .v-window-item--active'))
  } finally {
    await page.getByRole('button', { name: /Close|Fermer/ }).click()
  }
}

const pageGroup = (dialog: Locator) => dialog.getByTestId('available-tools').locator('[data-kind="page"]')

export const waitForPageTools = async (page: Page, ...names: string[]) => {
  await withDialog(page, async dialog => {
    for (const name of names) {
      await expect(pageGroup(dialog).getByText(name, { exact: true }).first()).toBeVisible({ timeout: 10000 })
    }
  })
}

/** The inverse: the tool is no longer part of the aggregate. */
export const expectNoPageTool = async (page: Page, name: string) => {
  await withDialog(page, async dialog => {
    await expect(pageGroup(dialog).getByText(name, { exact: true })).toHaveCount(0, { timeout: 5000 })
  })
}

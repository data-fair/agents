import { expect, type Page } from '@playwright/test'

/**
 * Wait until the chat has DISCOVERED these page tools (the aggregate its `hello` and `tools` frames
 * carry). Discovery is asynchronous — BroadcastChannel plus an MCP connect and listTools — and a turn
 * sent before it lands is built with a tool set missing them. The chat exposes the sorted names it
 * holds as `data-page-tools`.
 */
const toolPattern = (name: string) => new RegExp(`(^|,)${name}(,|$)`)

export const waitForPageTools = async (page: Page, ...names: string[]) => {
  for (const name of names) {
    await expect(page.getByTestId('agent-chat')).toHaveAttribute('data-page-tools', toolPattern(name), { timeout: 10000 })
  }
}

/** The inverse: the tool is no longer part of the aggregate. */
export const expectNoPageTool = async (page: Page, name: string) => {
  await expect(page.getByTestId('agent-chat')).not.toHaveAttribute('data-page-tools', toolPattern(name), { timeout: 5000 })
}

import { expect, type Frame, type Page } from '@playwright/test'

/**
 * Helpers for the specs that drive the chat as an embedding component renders it: inside an iframe
 * (drawer, menu, block, action), or with its render flags pinned before the app boots.
 */

// The iframe URL carries an `?initConfig=<key>` param, so match on the pathname — which also avoids
// matching the parent `/_dev/chat-<component>` page.
const isChatFrameUrl = (url: string): boolean => {
  try {
    return new URL(url).pathname.endsWith('/_dev/chat')
  } catch {
    return false
  }
}

/** The chat iframe, once it is attached — whatever it ends up showing. */
export async function findChatFrame (page: Page): Promise<Frame> {
  let frame: Frame | undefined
  await expect(() => {
    frame = page.frames().find(f => isChatFrameUrl(f.url()))
    expect(frame).toBeTruthy()
  }).toPass({ timeout: 10000 })
  return frame!
}

/** The chat iframe, once its composer is on screen. */
export async function waitForChatFrame (page: Page): Promise<Frame> {
  const frame = await findChatFrame(page)
  await expect(frame.getByPlaceholder('Type your message...')).toBeVisible({ timeout: 15000 })
  return frame
}

/**
 * Seed the `agent-chat-flags` cookie readFlags() consumes (ui/src/utils/agent-flags.ts) before the app
 * boots. Path '/' keeps it readable by the UI page. goToWithAuth reuses a cached browser context, so a
 * cookie set by one test leaks into the next: a test that depends on a flag must seed it explicitly.
 * Flags left out take their default; `mermaid` is off unless given.
 */
export const seedFlagsCookie = (page: Page, flags: { mermaid?: boolean, simpleSubAgents?: boolean, showReasoning?: boolean }) =>
  page.addInitScript((f) => {
    document.cookie = `agent-chat-flags=${encodeURIComponent(JSON.stringify(f))}; path=/`
  }, { mermaid: false, ...flags })

/**
 * stateful E2E: an admin reads, edits and restores an agent's memory.
 */
import { expect, type Page } from '@playwright/test'
import { test } from '../../fixtures/login.ts'
import { clean, superAdmin } from '../../support/axios.ts'
import { putMockSettings } from '../../support/settings.ts'

const admin = await superAdmin

// The content is edited in the markdown editor (EasyMDE, on CodeMirror 5): read its value from the
// editor instance, type into it as a person does.
const markdownEditor = (page: Page) => page.getByTestId('memory-content').locator('.CodeMirror')
const editorValue = (page: Page) => markdownEditor(page).evaluate((el: any) => el.CodeMirror.getValue())
const typeInEditor = async (page: Page, text: string) => {
  await markdownEditor(page).click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type(text)
}

test.describe('Agent memory dialog', () => {
  test.beforeEach(async () => {
    await clean()
    await putMockSettings(admin, 'organization/test_agents_org1')
  })

  test('view, edit, then restore the previous version', async ({ page, goToWithAuth }) => {
    const agent = (await admin.post('/api/autonomous-agents/organization/test_agents_org1', { title: 'Mem agent', persona: 'x', mcpServers: [], enabled: true, memory: { enabled: true } })).data
    await admin.put(`/api/memory/organization/test_agents_org1/${agent.id}/document`, { description: 'Core facts', content: '- first fact' }, { params: { path: 'MEMORY.md' } })

    await goToWithAuth(`/agents/organization/test_agents_org1/agents/${agent.id}?config=memory`, 'test_agents_superadmin', { adminMode: true })
    await page.getByTestId('autonomous-agent-config-tab-memory').click({ timeout: 20000 })
    await page.getByTestId('memory-document-MEMORY.md').click()
    await expect.poll(() => editorValue(page)).toBe('- first fact')

    await typeInEditor(page, '- second fact')
    await page.getByTestId('memory-save').click()
    await expect(page.getByTestId('memory-document-MEMORY.md')).toContainText('MEMORY.md')

    // the document's history shows the change, not a second copy of the text
    await page.getByTestId('memory-history-open').click()
    const rows = page.getByTestId('memory-history').getByTestId('memory-version')
    await expect(rows).toHaveCount(2)
    await expect(rows.nth(0).locator('.memory-diff-removed')).toHaveText('- - first fact')
    await expect(rows.nth(0).locator('.memory-diff-added')).toHaveText('+ - second fact')
    await rows.nth(1).click()
    await rows.nth(1).getByTestId('memory-version-restore').click()
    await expect(rows).toHaveCount(3)
    await page.getByTestId('memory-history').getByRole('button', { name: 'Close' }).click()

    await expect.poll(() => editorValue(page)).toBe('- first fact')
  })

  test('the editor preview renders memory text sanitized: HTML in it does not run', async ({ page, goToWithAuth }) => {
    // Memory text can come from tool output: the preview must not be EasyMDE's unsanitized renderer.
    const agent = (await admin.post('/api/autonomous-agents/organization/test_agents_org1', { title: 'Mem agent', persona: 'x', mcpServers: [], enabled: true, memory: { enabled: true } })).data
    await admin.put(`/api/memory/organization/test_agents_org1/${agent.id}/document`, { description: 'Notes', content: '**bold** <img src="https://images.example.com/x.png" onerror="window.__memoryXss = 1">' }, { params: { path: 'notes.md' } })

    await goToWithAuth(`/agents/organization/test_agents_org1/agents/${agent.id}?config=memory`, 'test_agents_superadmin', { adminMode: true })
    await page.getByTestId('autonomous-agent-config-tab-memory').click({ timeout: 20000 })
    await page.getByTestId('memory-document-notes.md').click()
    await page.getByTestId('memory-content').locator('.editor-toolbar button.preview').click()
    const preview = page.getByTestId('memory-content').locator('.editor-preview')
    await expect(preview.locator('strong')).toHaveText('bold')
    await expect(preview.locator('img')).toHaveCount(0) // another site's image becomes a link
    await expect(preview.locator('[onerror]')).toHaveCount(0)
    expect(await page.evaluate(() => (window as any).__memoryXss)).toBeUndefined()
  })

  test('a deleted document is listed and restored from its history', async ({ page, goToWithAuth }) => {
    const agent = (await admin.post('/api/autonomous-agents/organization/test_agents_org1', { title: 'Mem agent', persona: 'x', mcpServers: [], enabled: true, memory: { enabled: true } })).data
    const url = `/api/memory/organization/test_agents_org1/${agent.id}/document`
    await admin.put(url, { description: 'Notes', content: '- keep me' }, { params: { path: 'notes.md' } })
    await admin.delete(url, { params: { path: 'notes.md', version: 1 } })

    await goToWithAuth(`/agents/organization/test_agents_org1/agents/${agent.id}?config=memory`, 'test_agents_superadmin', { adminMode: true })
    await page.getByTestId('autonomous-agent-config-tab-memory').click({ timeout: 20000 })
    await page.getByTestId('memory-deleted-notes.md').click()
    const rows = page.getByTestId('memory-history').getByTestId('memory-version')
    await expect(rows).toHaveCount(2)
    await rows.nth(1).click()
    await rows.nth(1).getByTestId('memory-version-restore').click()
    await page.getByTestId('memory-history').getByRole('button', { name: 'Close' }).click()

    await expect(page.getByTestId('memory-document-notes.md')).toBeVisible()
    await expect(page.getByTestId('memory-deleted-notes.md')).toBeHidden()
    await expect.poll(() => editorValue(page)).toBe('- keep me')
  })

  test('a save over a document changed underneath is refused and says so', async ({ page, goToWithAuth }) => {
    const agent = (await admin.post('/api/autonomous-agents/organization/test_agents_org1', { title: 'Mem agent', persona: 'x', mcpServers: [], enabled: true, memory: { enabled: true } })).data
    const url = `/api/memory/organization/test_agents_org1/${agent.id}/document`
    const created = (await admin.put(url, { description: 'Core facts', content: '- first fact' }, { params: { path: 'MEMORY.md' } })).data

    await goToWithAuth(`/agents/organization/test_agents_org1/agents/${agent.id}?config=memory`, 'test_agents_superadmin', { adminMode: true })
    await page.getByTestId('autonomous-agent-config-tab-memory').click({ timeout: 20000 })
    await page.getByTestId('memory-document-MEMORY.md').click()
    await expect.poll(() => editorValue(page)).toBe('- first fact')

    await admin.put(url, { description: 'Core facts', content: '- changed elsewhere', version: created.version }, { params: { path: 'MEMORY.md' } })
    await typeInEditor(page, '- my edit')
    await page.getByTestId('memory-save').click()

    // the refusal is shown, and the dialog re-reads the document instead of pretending it saved
    await expect(page.locator('.ui-notif')).toContainText('was changed since it was loaded')
    await expect.poll(() => editorValue(page)).toBe('- changed elsewhere')
  })

  test('the memory stays reachable for an autonomous agent with memory off, and says so', async ({ page, goToWithAuth }) => {
    const agent = (await admin.post('/api/autonomous-agents/organization/test_agents_org1', { title: 'Mem agent', persona: 'x', mcpServers: [], enabled: true })).data
    await goToWithAuth(`/agents/organization/test_agents_org1/agents/${agent.id}?config=memory`, 'test_agents_superadmin', { adminMode: true })
    await page.getByTestId('autonomous-agent-config-tab-memory').click({ timeout: 20000 })
    await expect(page.getByText('Memory is turned off for this agent')).toBeVisible()
  })

  test('enabling memory in the tab and saving removes the "turned off" notice without a reload', async ({ page, goToWithAuth }) => {
    const agent = (await admin.post('/api/autonomous-agents/organization/test_agents_org1', { title: 'Mem agent', persona: 'x', mcpServers: [], enabled: true })).data
    await goToWithAuth(`/agents/organization/test_agents_org1/agents/${agent.id}?config=memory`, 'test_agents_superadmin', { adminMode: true })
    await page.getByTestId('autonomous-agent-config-tab-memory').click({ timeout: 20000 })
    await expect(page.getByText('Memory is turned off for this agent')).toBeVisible()
    await page.getByRole('checkbox', { name: 'Keep a memory across conversations' }).check()
    await page.locator('#autonomous-agent-configuration .v-card').getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Memory is turned off for this agent')).toBeHidden({ timeout: 10000 })
  })

  // The memory switch of the create form: autonomous-agents.e2e.spec.ts, on its journey test.
})

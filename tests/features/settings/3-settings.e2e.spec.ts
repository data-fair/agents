/**
 * stateful E2E tests, validate UI using playwright pages
 */

import { test } from '../../fixtures/login.ts'
import { clean } from '../../support/axios.ts'

// E2E block: use full playwright capabilities to test the UI and indirectly the API
test.describe('Settings UI', () => {
  test.beforeEach(async () => {
    await clean()
  })
  test('Authenticated user can use settings form', async ({ page, goToWithAuth }) => {
    await goToWithAuth('/agents/settings', 'test-standalone1')
    // TODO: check settings form
  })
})

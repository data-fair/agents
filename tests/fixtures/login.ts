// tests/fixtures/auth-fixture.ts
import { test as base } from '@playwright/test'
import { withQuery } from 'ufo'

export const test = base.extend<{
  goToWithAuth: (url: string, user: string) => Promise<void>
}>({
      page: async ({ page, context }, use) => {
        await context.addCookies([{
          name: 'i18n_lang',
          value: 'en',
          domain: 'localhost',
          path: '/',
        }])
        await use(page)
      },
      goToWithAuth: async ({ page }, use) => {
        await use(async (url: string, user: string) => {
          await page.goto(withQuery('/simple-directory/login', { redirect: 'http://localhost:' + process.env.NGINX_PORT + url }))
          await page.fill('input[name="email"]', user + '@test.com')
          await page.fill('input[name="password"]', 'passwd')
          await page.getByText('login', { exact: true }).click()
          // Verify login success before returning control to the test
          await page.waitForURL(url)
        })
      },
    })

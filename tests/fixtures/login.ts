// tests/fixtures/auth-fixture.ts
import { test as base } from '@playwright/test'
import { withQuery } from 'ufo'

const cookieCache = new Map<string, Awaited<ReturnType<import('@playwright/test').BrowserContext['cookies']>>>()

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
      goToWithAuth: async ({ page, context }, use) => {
        await use(async (url: string, user: string) => {
          const cached = cookieCache.get(user)
          if (cached) {
            await context.addCookies(cached)
            await page.goto(url)
          } else {
            await page.goto(withQuery('/simple-directory/login', { redirect: 'http://localhost:' + process.env.NGINX_PORT + url }))
            await page.fill('input[name="email"]', user + '@test.com')
            await page.fill('input[name="password"]', 'passwd')
            await page.getByText('login', { exact: true }).click()
            await page.waitForURL(url)
            const cookies = await context.cookies()
            cookieCache.set(user, cookies)
          }
        })
      },
    })

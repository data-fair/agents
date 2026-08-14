// tests/fixtures/auth-fixture.ts
import { test as base } from '@playwright/test'
import { withQuery } from 'ufo'

const cookieCache = new Map<string, Awaited<ReturnType<import('@playwright/test').BrowserContext['cookies']>>>()

export const test = base.extend<{
  goToWithAuth: (url: string, user: string, opts?: { adminMode?: boolean, org?: string }) => Promise<void>
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
        await use(async (url: string, user: string, opts?: { adminMode?: boolean, org?: string }) => {
          const cacheKey = user + (opts?.adminMode ? ':adminMode' : '') + (opts?.org ? ':org:' + opts.org : '')
          const cached = cookieCache.get(cacheKey)
          if (cached) {
            await context.addCookies(cached)
            await page.goto(url)
          } else {
            const query: Record<string, string> = { redirect: 'http://localhost:' + process.env.NGINX_PORT + url }
            if (opts?.adminMode) query.adminMode = 'true'
            // log straight into the organization account: pages scoped to an org
            // check the role of the session's CURRENT account (getAccountRole
            // without allAccounts), so a member still on their personal account
            // would be treated as a non-admin visitor.
            if (opts?.org) query.org = opts.org
            await page.goto(withQuery('/simple-directory/login', query))
            await page.fill('input[name="email"]', user + '@test.com')
            await page.fill('input[name="password"]', 'passwd')
            await page.getByText('login', { exact: true }).click()
            await page.waitForURL(url)
            const cookies = await context.cookies()
            cookieCache.set(cacheKey, cookies)
          }
        })
      },
    })

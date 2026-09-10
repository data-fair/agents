// tests/fixtures/auth-fixture.ts
import { test as base } from '@playwright/test'
import { withQuery } from 'ufo'

const cookieCache = new Map<string, Awaited<ReturnType<import('@playwright/test').BrowserContext['cookies']>>>()

// Only what the simple-directory login itself produces. context.cookies() returns
// everything the context holds, so caching it wholesale also captures the app-level
// cookies a test sets for itself (agent-chat-flags, agent-chat-trace-consent, …) and
// replays them into later tests reusing that login. That leak acts at a distance: a
// test seeding toolExploration:true silently turns exploration on for a later test
// that expects the default.
// id_token_ex has to stay in this list — a keepalive without it is refused outright
// (sd.auth.keepalive.fail, "a user without a valid echange token") — but it is also the
// one cookie here that does not hold still: simple-directory rotates it on every
// keepalive and treats a second presentation of a spent one as token theft
// (sd.auth.keepalive.reuse), destroying the session. So the snapshot has to be kept
// current; see refreshCache below.
const SESSION_COOKIE = /^id_token(_sign|_org|_dep|_role|_ex)?$/

export const test = base.extend<{
  goToWithAuth: (url: string, user: string, opts?: { adminMode?: boolean }) => Promise<void>
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
        // The key this context last authenticated as, so its teardown knows which entry
        // the rotated exchange token belongs to.
        let lastKey: string | null = null
        const refreshCache = async () => {
          if (!lastKey || !cookieCache.has(lastKey)) return
          cookieCache.set(lastKey, (await context.cookies()).filter(c => SESSION_COOKIE.test(c.name)))
        }
        await use(async (url: string, user: string, opts?: { adminMode?: boolean }) => {
          const cacheKey = opts?.adminMode ? user + ':adminMode' : user
          lastKey = cacheKey
          const cached = cookieCache.get(cacheKey)
          if (cached) {
            await context.addCookies(cached)
            await page.goto(url)
          } else {
            const query: Record<string, string> = { redirect: 'http://localhost:' + process.env.NGINX_PORT + url }
            if (opts?.adminMode) query.adminMode = 'true'
            await page.goto(withQuery('/simple-directory/login', query))
            await page.fill('input[name="email"]', user + '@test.com')
            await page.fill('input[name="password"]', 'passwd')
            await page.getByText('login', { exact: true }).click()
            await page.waitForURL(url)
            // Simple-directory keeps a server-side session reference per user and drops
            // the old one when a newer login supersedes it, so every entry cached before
            // this login is now stale. Replaying a stale entry is silently destructive:
            // the app's first keepalive gets a 401, simple-directory clears the id_token
            // cookies, and every later request in that test is anonymous — which shows
            // up much later, and far from here, as "You do not have permission to use
            // this model". Keeping only the most recent login makes the cache always
            // hold a session the server still recognises; runs of tests reusing the same
            // user still hit it.
            cookieCache.clear()
            cookieCache.set(cacheKey, (await context.cookies()).filter(c => SESSION_COOKIE.test(c.name)))
          }
        })
        // Teardown: re-snapshot the session now that the test is over. The app rotates
        // id_token_ex on every keepalive, so the copy taken at login is spent as soon as
        // this context uses it; handing the next test that stale copy is what trips
        // simple-directory's theft detection. The context is still open here and no other
        // one is running (workers: 1, fullyParallel: false), so its cookies are the
        // freshest the server has issued — and nothing else can spend them in between.
        await refreshCache()
      },
    })

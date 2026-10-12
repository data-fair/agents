/**
 * The Playwright config of a host's simulations. They run from their own config,
 * never from playwright.config.ts: a bare `playwright test` runs every project in
 * its config, so a simulation project there would make `npm test` spend Claude
 * plan quota.
 */
import { defineConfig, devices } from '@playwright/test'

export type SimConfigOptions = {
  baseURL: string
  /** Defaults to headless unless SIM_HEADED is set: the trace records every step anyway. */
  headless?: boolean
  /** The browser's language, which the chat follows. Defaults to 'fr-FR'. */
  locale?: string
}

export function defineSimConfig ({ baseURL, headless = !process.env.SIM_HEADED, locale = 'fr-FR' }: SimConfigOptions) {
  return defineConfig({
    testDir: './simulations',
    testMatch: /.*\.sim\.spec\.ts/,
    workers: 1,
    fullyParallel: false,
    // A judged scenario is many model turns, each of which can be a slow first
    // token. The budget must exceed maxTurns × the per-turn ceiling (TURN_CEILING_MS),
    // so the driver's own diagnosable timeout always fires first. A test timeout is
    // the bad order — it aborts the body without running the catch, so the run's
    // evidence is never written (see runSimulation's pessimistic sidecar).
    timeout: 45 * 60 * 1000,
    reporter: 'list',

    use: {
      baseURL,
      headless,
      // 'on', not 'retain-on-failure': most of a simulation is a model thinking,
      // so the trace's per-action DOM snapshots are a better record than watching
      // live, and a satisfied-but-odd run is exactly the one worth replaying.
      trace: 'on',
      // A missing element should fail in seconds with a diagnosis, not hang for
      // the whole test timeout. 30s: the dev stack is doing real work during a
      // simulation and the drawer's iframe boots an entire SPA.
      actionTimeout: 30_000,
      navigationTimeout: 30_000,
    },

    projects: [
      // The host's default suite readiness poll and log tailing, reused unmodified.
      // testDir points back at ./tests because this config's own testDir is ./simulations.
      {
        name: 'state-setup',
        testDir: './tests',
        testMatch: /state-setup\.ts/,
        teardown: 'state-teardown',
      },
      {
        name: 'state-teardown',
        testDir: './tests',
        testMatch: /state-teardown\.ts/,
      },
      {
        name: 'simulate',
        dependencies: ['state-setup'],
        use: {
          ...devices['Desktop Chrome'],
          // 1920×1080, not Desktop Chrome's 1280×720. The data-fair shell keeps the
          // chat drawer `temporary` below Vuetify's xl breakpoint (1920px), and a
          // temporary drawer lays a scrim over the whole app — so at 1280 the persona
          // could not click anything behind the chat. That is the product's real
          // behaviour at that width, but not the layout the assistant is designed
          // around. A narrow-viewport case would be a separate, deliberate one.
          viewport: { width: 1920, height: 1080 },
          // The chat follows the browser's language, and Playwright's default is
          // en-US: a French case once rendered an English chat and died waiting for
          // "Tapez votre message...".
          locale,
        },
      },
    ],
  })
}

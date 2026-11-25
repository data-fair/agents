/**
 * In development, the real-clock jobs (task scheduler, memory consolidation, run recovery) leave alone the owners
 * whose clock is driven elsewhere:
 * - the test suites' sub-space (test_agents_): the api specs drive those owners' scheduler and consolidation passes
 *   through the test-env seams, with an injected clock, and a real pass would claim their slots first;
 * - the scenario simulations' contexts (test_sim_): a run is judged on what its runner did (its task runs, its
 *   consolidations), and a weekly task or a sweep left on the real clock would run on a real model later, unasked.
 * The dev world's owners (test_demo_ included) keep the real clock.
 */
export const realClockScope = (nodeEnv: string | undefined): Record<string, unknown> =>
  nodeEnv === 'development' ? { 'owner.id': { $not: /^test_(agents|sim)_/ } } : {}

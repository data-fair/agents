/**
 * Runs one turn of an autonomous agent, in this process, asynchronously.
 *
 * Deliberately not resumable: a restart marks an in-flight run `interrupted` rather than
 * trying to continue it. The spec chose this over distributed run leasing until
 * concurrency demands otherwise.
 */

import type { AutonomousAgentRun } from '#types'
import { finishRun } from './service.ts'

/**
 * Kick a turn. Callers do NOT await this — the message route returns as soon as the user
 * message is persisted, and the run document is how the caller follows along.
 *
 * The model loop lands in the next task; for now a run completes immediately so the
 * lifecycle is exercised end to end without a provider in the picture.
 */
export const startRun = async (run: AutonomousAgentRun): Promise<void> => {
  await finishRun(run.id, { status: 'done', stopReason: 'completed', steps: 0, credits: 0 })
}

/**
 * Evidence files, split in two on purpose.
 *
 * The transcript is what the judge reads. The sidecar records whether the run
 * was VALID — a case that fails to dispatch must report `not run` rather than
 * silently re-reporting the previous run's verdict, which is why both are
 * deleted before a suite and only rewritten by a case that actually executes.
 */
import fs from 'node:fs'
import path from 'node:path'
import type { GatewayExchange } from './gateway-capture.ts'

export const evidenceDir = path.join(process.cwd(), 'simulations', 'tmp')

export type Transcript = {
  case: string
  goal: string
  persona: string
  route: string
  conversation: Array<{ role: string, text: string }>
  gateway: GatewayExchange[]
  consoleErrors: string[]
}

export type RunSidecar = {
  case: string
  valid: boolean
  error?: string
  assistantModel: string
  userModel: string
  turns: number
  durationMs: number
  finishedAt: string
}

export function writeEvidence (name: string, transcript: Transcript, sidecar: RunSidecar) {
  fs.mkdirSync(evidenceDir, { recursive: true })
  fs.writeFileSync(path.join(evidenceDir, `sim-${name}.json`), JSON.stringify(transcript, null, 2))
  fs.writeFileSync(path.join(evidenceDir, `sim-${name}.run.json`), JSON.stringify(sidecar, null, 2))
}

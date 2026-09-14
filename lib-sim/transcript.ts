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
import type { Transcript, RunSidecar } from './types.ts'

export const evidenceDir = path.join(process.cwd(), 'simulations', 'tmp')

export type { Transcript, RunSidecar }

export function writeEvidence (name: string, transcript: Transcript, sidecar: RunSidecar) {
  fs.mkdirSync(evidenceDir, { recursive: true })
  fs.writeFileSync(path.join(evidenceDir, `sim-${name}.json`), JSON.stringify(transcript, null, 2))
  fs.writeFileSync(path.join(evidenceDir, `sim-${name}.run.json`), JSON.stringify(sidecar, null, 2))
}

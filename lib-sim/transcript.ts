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
import type { Transcript, TranscriptInput, RunSidecar } from './types.ts'
import { computeMetrics } from './metrics.ts'
import { parseConversationExport, type ParsedExport } from './conversation-export.ts'

/**
 * Default evidence location, resolved against the host repo's cwd. Kept as the
 * default rather than baked in: `reportCases(cases, evidenceDir)` already lets
 * the host choose where evidence lives, so writing had to be able to follow it.
 */
export const evidenceDir = path.join(process.cwd(), 'simulations', 'tmp')

export type { Transcript, TranscriptInput, RunSidecar }

/** Where one conversation's export is written: next to the transcript, under the same `sim-` prefix. */
export const exportFileName = (name: string, conversationId: string) => `sim-${name}.${conversationId}.export.jsonl`

export function writeEvidence (name: string, input: TranscriptInput, sidecar: RunSidecar, dir: string = evidenceDir) {
  fs.mkdirSync(dir, { recursive: true })
  const evidenceErrors = [...(input.evidenceErrors ?? [])]
  const parsed: ParsedExport[] = []
  const exports: Transcript['exports'] = []
  for (const exported of input.exports) {
    const file = exportFileName(name, exported.conversationId)
    // Written verbatim, whatever it holds: the judge reads the file the way a maintainer would.
    fs.writeFileSync(path.join(dir, file), exported.jsonl)
    exports.push({ conversationId: exported.conversationId, ...(exported.agentId ? { agentId: exported.agentId } : {}), file })
    try {
      parsed.push(parseConversationExport(exported))
    } catch (err) {
      evidenceErrors.push(err instanceof Error ? err.message : String(err))
    }
  }
  const transcript: Transcript = { ...input, exports, ...(evidenceErrors.length ? { evidenceErrors } : {}) }
  fs.writeFileSync(path.join(dir, `sim-${name}.json`), JSON.stringify(transcript, null, 2))
  // Derived here rather than asked of the host: every host would compute the
  // same thing from the same exports.
  const withMetrics: RunSidecar = { ...sidecar, metrics: computeMetrics(transcript, parsed) }
  fs.writeFileSync(path.join(dir, `sim-${name}.run.json`), JSON.stringify(withMetrics, null, 2))
}

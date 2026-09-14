/**
 * The isolation guarantee (spec §1.2).
 *
 * Measured, not assumed: with `settingSources: []` but the repository as cwd, the
 * model answered with the project's auto-memory index — naming the bugs this
 * tooling exists to find. Auto-memory is keyed to the project directory, so only
 * a neutral cwd removes it. `tools: []` matters just as much: without it the SDK
 * offers 27 built-in tools and the model reaches for ToolSearch instead of the
 * tools the request actually declared.
 *
 * These options are fixed. Nothing in a request may override them.
 */
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'

export function createNeutralCwd (): string {
  // Deliberately meaningless name: ~367 tokens of SDK preamble are irreducible and
  // include the cwd path, so the path itself must carry no signal about the product.
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bridge-'))
}

/**
 * Spelled structurally rather than as `NodeJS.ProcessEnv`, which would make
 * `@types/node` an undeclared type dependency of this package: a consumer
 * without it hits `TS2503: Cannot find namespace 'NodeJS'` on this .d.ts.
 * `process.env` satisfies it, so nothing is lost at the call sites.
 */
export type Env = Record<string, string | undefined>

export function scrubEnv (env: Env): Env {
  const scrubbed: Env = { ...env }
  for (const key of Object.keys(scrubbed)) {
    if (key.startsWith('CLAUDE_CODE_')) delete scrubbed[key]
  }
  return scrubbed
}

export function isolationOptions (cwd: string, env: Env = process.env) {
  return {
    cwd,
    env: scrubEnv(env),
    settingSources: [] as never[],
    tools: [] as never[],
    strictMcpConfig: true as const
  }
}

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
 * The Claude Code config dir must be neutral too. Measured: every bridged session
 * opened with a `session_context` block reading "The user's email address is
 * <the operator's>", and an agent with a memory tool stored it as its user's. The
 * CLI injects that block whatever `systemPrompt` and `settingSources` say, from
 * `oauthAccount.emailAddress` in its GLOBAL config (`~/.claude.json`, or
 * `$CLAUDE_CONFIG_DIR/.claude.json`). So each query runs on a private
 * `CLAUDE_CONFIG_DIR` whose global config carries the account WITHOUT its email,
 * while `CLAUDE_SECURESTORAGE_CONFIG_DIR` keeps the credentials where they are: a
 * copied refresh token would rotate away from under the developer's own session.
 * A side effect worth having: the CLI's session transcripts — product prompts and
 * data — land in that private dir instead of the developer's `~/.claude/projects`.
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

/**
 * The account fields that identify the operator. The email is the one the CLI puts in
 * front of the model; the names go too, since nothing a bridged query does needs them.
 */
const IDENTIFYING_ACCOUNT_KEYS = ['emailAddress', 'displayName', 'fullName']

type GlobalConfig = { oauthAccount?: Record<string, unknown> } & Record<string, unknown>

/**
 * The global config a bridged query runs on: the operator's account, minus who they are.
 *
 * The account itself must stay: without it the CLI fetches the profile at startup and
 * writes the email straight back. It skips that fetch only while the copy is complete
 * and `profileFetchedAt` is under a day old — hence the fresh stamp, on every query.
 */
export function neutralGlobalConfig (real: GlobalConfig | null | undefined, now: number): GlobalConfig {
  if (!real?.oauthAccount) return {}
  const account = Object.fromEntries(
    Object.entries(real.oauthAccount).filter(([key]) => !IDENTIFYING_ACCOUNT_KEYS.includes(key))
  )
  return { oauthAccount: { ...account, profileFetchedAt: now } }
}

/** Where the CLI reads its global config, in the environment the caller was started in. */
export function realGlobalConfigPath (env: Env): string {
  return env.CLAUDE_CONFIG_DIR
    ? path.join(env.CLAUDE_CONFIG_DIR, '.claude.json')
    : path.join(env.HOME || os.homedir(), '.claude.json')
}

/**
 * (Re)write the private config dir inside the neutral cwd and return its path.
 *
 * Named so it cannot pass for a project's `.claude/`. Fails closed if the CLI put the
 * identity back: it then refetched the profile despite the seeded copy — its freshness
 * rule changed — and the guarantee no longer holds.
 */
export function prepareNeutralConfigDir (cwd: string, env: Env, now = Date.now()): string {
  const dir = path.join(cwd, 'cli-config')
  const file = path.join(dir, '.claude.json')
  fs.mkdirSync(dir, { recursive: true })
  let current: GlobalConfig = {}
  try { current = JSON.parse(fs.readFileSync(file, 'utf8')) } catch {}
  const account = current.oauthAccount
  if (account && IDENTIFYING_ACCOUNT_KEYS.some(key => key in account)) {
    throw new Error(`claude-bridge isolation broken: the CLI wrote the account identity back into ${file}, so the operator's email may have reached the model`)
  }
  let real: GlobalConfig | undefined
  try { real = JSON.parse(fs.readFileSync(realGlobalConfigPath(env), 'utf8')) } catch {}
  // Merged over what the CLI keeps there itself, and swapped in atomically: the CLI
  // of a concurrent query may be reading it.
  const tmp = `${file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`
  fs.writeFileSync(tmp, JSON.stringify({ ...current, ...neutralGlobalConfig(real, now) }), { mode: 0o600 })
  fs.renameSync(tmp, file)
  return dir
}

export function isolationOptions (cwd: string, env: Env = process.env) {
  return {
    cwd,
    env: {
      ...scrubEnv(env),
      CLAUDE_CONFIG_DIR: prepareNeutralConfigDir(cwd, env),
      // Measured: without it a background request wrote `emailAddress` back into the
      // seeded account ~250ms after the context was built — a race, won only by luck.
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
      // The credentials stay in the operator's store; empty means the default ~/.claude.
      CLAUDE_SECURESTORAGE_CONFIG_DIR: env.CLAUDE_SECURESTORAGE_CONFIG_DIR ?? env.CLAUDE_CONFIG_DIR ?? ''
    } as Env,
    settingSources: [] as never[],
    tools: [] as never[],
    strictMcpConfig: true as const
  }
}

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ansiCodes = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g')

/**
 * The recent output of the dev API: the file `npm run dev` (and CI) writes it to, `<prefix>api.log` in
 * DEV_LOG_DIR (default `dev/logs`, no prefix).
 *
 * Joined into one line: a log entry may span several lines, and a test checks a secret is absent from it.
 */
export const apiLogs = (lines = 300): string => {
  const file = join(process.env.DEV_LOG_DIR || 'dev/logs', `${process.env.DEV_LOG_PREFIX ?? ''}api.log`)
  if (!existsSync(file)) throw new Error(`no API log at ${file}: start the dev API with npm run dev, or set DEV_LOG_DIR and DEV_LOG_PREFIX`)
  const raw = readFileSync(file, 'utf8').split('\n').slice(-lines).join('\n')
  // the logs are colored when the dev env forces colors (CI): drop the ANSI codes the patterns don't expect
  return raw.replace(ansiCodes, '').replace(/\n/g, '')
}

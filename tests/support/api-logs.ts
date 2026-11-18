import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const ansiCodes = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g')

/**
 * The recent output of the dev API: the `api` pane of the zellij session (`df-dev logs api`) on a dev
 * machine, `dev/logs/api.log` in CI, where the workflow starts the API with its output there.
 *
 * Joined into one line: a pane's scrollback is wrapped at the pane's width, which would split a log
 * entry, or a secret a test checks is absent, at an arbitrary point.
 */
export const apiLogs = (lines = 300): string => {
  const raw = existsSync('dev/logs/api.log')
    ? readFileSync('dev/logs/api.log', 'utf8').split('\n').slice(-lines).join('\n')
    : execFileSync('./node_modules/.bin/df-dev', ['logs', 'api', '-n', String(lines)], { encoding: 'utf8' })
  // the logs are colored when the dev env forces colors (CI): drop the ANSI codes the patterns don't expect
  return raw.replace(ansiCodes, '').replace(/\n/g, '')
}

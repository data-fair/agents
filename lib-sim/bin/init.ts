#!/usr/bin/env node
/**
 * Copies the judge definition and the /agents-sim skill into the consuming repo's
 * .claude/ directory. They cannot be loaded from node_modules — Claude Code reads
 * them from the repository — so they are copied and can drift. The version is
 * printed so drift is at least detectable.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const templates = path.join(here, '..', 'templates')
const pkg = JSON.parse(fs.readFileSync(path.join(here, '..', 'package.json'), 'utf8'))
const cwd = process.cwd()

const targets = [
  { from: 'simulation-judge.md', to: path.join(cwd, '.claude', 'agents', 'simulation-judge.md') },
  { from: 'agents-sim-skill.md', to: path.join(cwd, '.claude', 'skills', 'agents-sim', 'SKILL.md') }
]

for (const { from, to } of targets) {
  fs.mkdirSync(path.dirname(to), { recursive: true })
  if (fs.existsSync(to) && !process.argv.includes('--force')) {
    console.log(`skipped (exists, use --force): ${path.relative(cwd, to)}`)
    continue
  }
  fs.copyFileSync(path.join(templates, from), to)
  console.log(`wrote ${path.relative(cwd, to)}`)
}
console.log(`from @data-fair/lib-agents-sim@${pkg.version}`)

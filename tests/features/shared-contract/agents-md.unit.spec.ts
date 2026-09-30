/**
 * Every path AGENTS.md points at must exist.
 *
 * It pointed at two that did not: `api/src/tools/datasets/search-data.ts` and `api/src/mcp/server.ts`,
 * both named as the patterns to read before writing a tool or wiring MCP. A missing file is worse than
 * no reference — it sends whoever follows it looking for a convention that was never there, and it had
 * survived long enough that neither directory existed any more.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, readdirSync } from 'node:fs'

const root = new URL('../../../', import.meta.url).pathname

test.describe('AGENTS.md references', () => {
  test('every @-referenced path resolves to a real file or directory', () => {
    const agentsMd = readFileSync(`${root}AGENTS.md`, 'utf8')
    // `@`-prefixed paths only, and only those that look like repo paths: an npm scope
    // (`@anthropic-ai/claude-agent-sdk`) is a package name, not a file. Trailing punctuation from the
    // surrounding prose is stripped.
    const referenced = [...agentsMd.matchAll(/@([a-zA-Z0-9_][a-zA-Z0-9_./-]*)/g)]
      .map(match => match[1].replace(/[.,]+$/, ''))
      .filter(path => path.includes('/') && !path.startsWith('anthropic-ai/') && !path.startsWith('data-fair/') && !path.startsWith('koumoul/'))
    assert.ok(referenced.length >= 8, `expected AGENTS.md to cite real paths, found ${referenced.length}`)

    const missing = [...new Set(referenced)].filter(path => !existsSync(`${root}${path}`))
    assert.deepEqual(missing, [], `AGENTS.md points at paths that do not exist: ${missing.join(', ')}`)
  })

  test('its list of architecture doc topics matches the directory, both ways', () => {
    // Same class of drift, and it had already happened: `compaction` was merged into
    // `context-management` and `autonomous-agents` was never listed, so the one index a reader consults
    // named a file that no longer existed and omitted the subsystem with the most moving parts.
    const agentsMd = readFileSync(`${root}AGENTS.md`, 'utf8')
    const listed = agentsMd.match(/one file per concern \(([^)]*)\)/)?.[1]
    assert.ok(listed, 'AGENTS.md must still name the topical docs it points a reader at')
    const named = listed.split(',').map(topic => topic.trim()).filter(Boolean).sort()
    const onDisk = readdirSync(`${root}docs/architecture`)
      .filter(file => file.endsWith('.md') && file !== 'overview.md')
      .map(file => file.replace(/\.md$/, ''))
      .sort()
    assert.deepEqual(named, onDisk)
  })
})

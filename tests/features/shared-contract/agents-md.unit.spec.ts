/**
 * Every path AGENTS.md points at must exist.
 *
 * It pointed at two that did not: `api/src/tools/datasets/search-data.ts` and `api/src/mcp/server.ts`,
 * both named as the patterns to read before writing a tool or wiring MCP. A missing file is worse than
 * no reference — it sends whoever follows it looking for a convention that was never there.
 *
 * The paths are plain backticked text, never `@path`: CLAUDE.md imports AGENTS.md, and an `@` import
 * inlines the file it names into every session, which is the opposite of "read on a need-to-know basis".
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const root = new URL('../../../', import.meta.url).pathname
const agentsMd = readFileSync(`${root}AGENTS.md`, 'utf8')

test.describe('AGENTS.md references', () => {
  test('every backticked file path resolves to a real file', () => {
    const referenced = [...agentsMd.matchAll(/`((?:api|ui|lib-vue|lib-vuetify|lib-sim|shared|tests|dev|docs|simulations)\/[^`\s*]+\.[a-z]+)`/g)]
      .map(match => match[1])
    assert.ok(referenced.length >= 8, `expected AGENTS.md to cite real paths, found ${referenced.length}`)

    const missing = [...new Set(referenced)].filter(path => !existsSync(`${root}${path}`))
    assert.deepEqual(missing, [], `AGENTS.md points at paths that do not exist: ${missing.join(', ')}`)
  })

  test('no @-import of a repo file', () => {
    const imports = [...agentsMd.matchAll(/(^|\s)@((?:api|ui|lib-vue|lib-vuetify|lib-sim|shared|tests|dev|docs|test-results)\b[^\s]*)/g)].map(match => match[2])
    assert.deepEqual(imports, [])
  })
})

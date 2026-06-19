import { buildDocMap } from './architecture-docs-lookup.js'

// Bundle every architecture doc as raw markdown at build time.
// import.meta.glob is a Vite feature — this module is therefore browser/build
// only and must never be imported by the non-Vite unit test runner.
const modules = import.meta.glob('../../../docs/architecture/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>

export const architectureDocs = buildDocMap(modules)
export const architectureTopics = Object.keys(architectureDocs).sort()

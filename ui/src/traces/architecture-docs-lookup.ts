/**
 * Pure helpers over the bundled architecture docs.
 * No Vite / import.meta here — this module must stay importable by the
 * non-Vite unit test runner. The Vite-only bundling lives in
 * architecture-docs.ts.
 */

/** Derive a topic key (filename without directory or extension) from a path. */
export function docTopicFromPath (path: string): string {
  const file = path.split('/').pop() ?? path
  return file.replace(/\.md$/, '')
}

/** Build a { topic -> markdown } map from import.meta.glob raw modules. */
export function buildDocMap (modules: Record<string, string>): Record<string, string> {
  const docs: Record<string, string> = {}
  for (const [path, content] of Object.entries(modules)) {
    docs[docTopicFromPath(path)] = content
  }
  return docs
}

/** Look up a doc by topic; on a miss, return the sorted list of valid topics. */
export function lookupArchitectureDoc (docs: Record<string, string>, topic: string): string {
  if (topic in docs) return docs[topic]
  const topics = Object.keys(docs).sort().join(', ')
  return `Unknown topic "${topic}". Available topics: ${topics}`
}

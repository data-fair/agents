// The history of one memory document, shown as changes rather than snapshots: each version is diffed
// against the version before it. Memory documents are small (the whole store is capped), so a plain
// LCS over lines is enough. See docs/architecture/agent-memory.md, "Admin surface".

export type DiffLine = { kind: 'same' | 'added' | 'removed' | 'skipped', text: string }

export type MemoryVersionRow = {
  id: string
  path: string
  previousPath?: string
  op: 'create' | 'update' | 'delete' | 'rename' | 'restore'
  version: number
  description?: string
  content?: string
  redacted?: unknown
  author: any
  createdAt: string
}

export type HistoryEntry = {
  version: MemoryVersionRow
  lines: DiffLine[]
  description?: { before: string, after: string }
  // The version before is redacted, or not loaded yet: no diff can be shown.
  baselineUnknown?: boolean
}

const splitLines = (text: string | undefined) => text ? text.split('\n') : []

export function lineDiff (before: string | undefined, after: string | undefined): DiffLine[] {
  const a = splitLines(before)
  const b = splitLines(after)
  // lcs[i][j] = length of the longest common subsequence of a[i..] and b[j..]
  const lcs = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }
  const lines: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { lines.push({ kind: 'same', text: a[i] }); i++; j++ } else if (lcs[i + 1][j] >= lcs[i][j + 1]) lines.push({ kind: 'removed', text: a[i++] })
    else lines.push({ kind: 'added', text: b[j++] })
  }
  while (i < a.length) lines.push({ kind: 'removed', text: a[i++] })
  while (j < b.length) lines.push({ kind: 'added', text: b[j++] })
  return lines
}

/** Keeps the changed lines and `context` unchanged lines around each; a run of hidden lines becomes one 'skipped'. */
function withContext (lines: DiffLine[], context = 1): DiffLine[] {
  if (lines.every(l => l.kind === 'added')) return lines
  const keep = lines.map(() => false)
  lines.forEach((l, i) => {
    if (l.kind === 'same') return
    for (let k = Math.max(0, i - context); k <= Math.min(lines.length - 1, i + context); k++) keep[k] = true
  })
  const out: DiffLine[] = []
  lines.forEach((l, i) => {
    if (keep[i]) out.push(l)
    else if (out[out.length - 1]?.kind !== 'skipped') out.push({ kind: 'skipped', text: '' })
  })
  return out
}

/**
 * One document's versions, newest first (as the API pages them), each with its change against the
 * version before it. `hasMore`: older versions remain to be loaded, so the oldest loaded one has no
 * known baseline.
 */
export function historyEntries (versions: MemoryVersionRow[], hasMore: boolean): HistoryEntry[] {
  return versions.map((version, index) => {
    const previous = versions[index + 1]
    // A delete has nothing to show; a rename moved the text, it did not change it; a redacted
    // version's text is gone.
    if (version.op === 'delete' || version.op === 'rename' || version.redacted) return { version, lines: [] }
    if (version.op === 'create') return { version, lines: lineDiff(undefined, version.content) }
    if (!previous && hasMore) return { version, lines: [], baselineUnknown: true }
    if (previous?.redacted) return { version, lines: [], baselineUnknown: true }
    // No version before (or a delete) means the text was written from nothing, as a restore after a delete is.
    const baseline = previous && previous.op !== 'delete' ? previous : undefined
    const entry: HistoryEntry = { version, lines: withContext(lineDiff(baseline?.content, version.content)) }
    if (entry.lines.every(l => l.kind === 'same' || l.kind === 'skipped')) entry.lines = []
    if (baseline?.description !== undefined && version.description !== undefined && baseline.description !== version.description) {
      entry.description = { before: baseline.description, after: version.description }
    }
    return entry
  })
}

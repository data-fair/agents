/**
 * The tools of a turn, grouped by where they come from, as the chat's inspection dialog shows them.
 * Pure, so it is tested without a component.
 */

import { TOOL_SOURCE_KINDS, type ToolSource, type ToolSourceKind } from '@agents/shared/tool-source'

export interface ToolGroup {
  /** Absent: a run recorded before sources were, whose tools can only be listed. */
  kind?: ToolSourceKind
  server?: string
  names: string[]
}

/**
 * One group per kind and server: the catalog's and the external servers' by server, the page's and the
 * service's whole. In the order of TOOL_SOURCE_KINDS, servers alphabetically, names sorted.
 */
export function groupTools (names: string[], sources?: Record<string, ToolSource>): ToolGroup[] {
  const groups = new Map<string, ToolGroup>()
  for (const name of names) {
    const source = sources?.[name]
    const server = source && (source.kind === 'catalog' || source.kind === 'external') ? source.server : undefined
    const key = `${source?.kind ?? ''}\n${server ?? ''}`
    if (!groups.has(key)) groups.set(key, { ...(source ? { kind: source.kind } : {}), ...(server ? { server } : {}), names: [] })
    groups.get(key)!.names.push(name)
  }
  const rank = (group: ToolGroup) => group.kind ? TOOL_SOURCE_KINDS.indexOf(group.kind) : TOOL_SOURCE_KINDS.length
  return [...groups.values()]
    .map(group => ({ ...group, names: [...group.names].sort() }))
    .sort((a, b) => rank(a) - rank(b) || (a.server ?? '').localeCompare(b.server ?? ''))
}

/** A set of tool names and where each came from, as a run's calls record them. */
export interface SourcedTools {
  names: string[]
  sources: Record<string, ToolSource>
}

type RunCalls = { calls?: Array<{ toolNames?: string[], toolSources?: Record<string, ToolSource> }> }

/** The tools offered on a conversation's last turn: the union over the calls of the last run that recorded any. */
export function lastOfferedTools (runs: RunCalls[]): SourcedTools {
  const calls = runs.filter(run => run.calls?.some(call => call.toolNames)).pop()?.calls ?? []
  return {
    names: [...new Set(calls.flatMap(call => call.toolNames ?? []))],
    // A run recorded before sources were has none: its tools are one unlabelled group rather than mislabelled.
    sources: Object.assign({}, ...calls.map(call => call.toolSources ?? {}))
  }
}

export function offeredToolGroups (runs: RunCalls[]): ToolGroup[] {
  const { names, sources } = lastOfferedTools(runs)
  return groupTools(names, sources)
}

/**
 * What the chat can call now: a known set (the last turn's, or the agent's servers' before a first one)
 * with the page's tools replaced by those it registers now, since the page's are live and the rest are not.
 */
export function availableToolGroups (known: SourcedTools, pageNames: string[]): ToolGroup[] {
  const kept = known.names.filter(name => known.sources[name]?.kind !== 'page' && !pageNames.includes(name))
  return groupTools([...kept, ...pageNames], {
    ...known.sources,
    ...Object.fromEntries(pageNames.map(name => [name, { kind: 'page' as const }]))
  })
}

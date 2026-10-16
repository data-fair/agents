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

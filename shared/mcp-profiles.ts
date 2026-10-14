/**
 * The profile vocabulary a profiled MCP server publishes (its `profilesUrl`), and what an agent's choice of
 * profiles means: the tree the form shows, what a selection includes, which roots the agent's identity is
 * offered. Pure, shared by the API (offered roots) and the form (McpProfilesTree.vue).
 * Design: docs/superpowers/specs/2026-10-14-mcp-profile-selection-design.md.
 */
export interface McpProfile { name: string, title?: string, description?: string, includes?: string[] }
export type AccountRole = string

/** The profiles no other profile includes, in the server's order: catalog, read, write, manage on data-fair's. */
export function profileRoots (vocabulary: McpProfile[]): McpProfile[] {
  const included = new Set(vocabulary.flatMap(p => p.includes ?? []))
  return vocabulary.filter(p => !included.has(p.name))
}

/** Every profile a selection includes, transitively, mapped to the selected profile that brings it. */
export function includedBy (vocabulary: McpProfile[], selected: string[]): Map<string, string> {
  const byName = new Map(vocabulary.map(p => [p.name, p]))
  const out = new Map<string, string>()
  for (const root of selected) {
    const stack = [...(byName.get(root)?.includes ?? [])]
    while (stack.length) {
      const name = stack.pop()!
      if (name === root || selected.includes(name) || out.has(name)) continue
      out.set(name, root)
      stack.push(...(byName.get(name)?.includes ?? []))
    }
  }
  return out
}

/** Roots by role, for the stack's vocabulary; a root this table does not know is offered to admins only. */
const ROOTS_BY_ROLE: Record<string, string[]> = {
  user: ['catalog', 'read'],
  contrib: ['catalog', 'read', 'write']
}

/** The roots an identity with this role is offered. No role (not enrolled yet): every root. */
export function offeredRoots (vocabulary: McpProfile[], role: AccountRole | undefined): string[] {
  const roots = profileRoots(vocabulary).map(p => p.name)
  if (!role || role === 'admin') return roots
  const allowed = ROOTS_BY_ROLE[role] ?? []
  return roots.filter(name => allowed.includes(name))
}

export interface TreeLeaf { name: string, title?: string, description?: string, checked: boolean, implied?: string, offered: boolean }
export interface TreeNode extends TreeLeaf { children: TreeLeaf[] }

/** What the form shows: each root and its direct includes, with what is checked, implied and offered. */
export function treeState (vocabulary: McpProfile[], selected: string[], role: AccountRole | undefined): TreeNode[] {
  const byName = new Map(vocabulary.map(p => [p.name, p]))
  const implied = includedBy(vocabulary, selected)
  const offered = new Set(offeredRoots(vocabulary, role))
  const leaf = (p: McpProfile, rootOffered: boolean): TreeLeaf => ({
    name: p.name,
    ...(p.title ? { title: p.title } : {}),
    ...(p.description ? { description: p.description } : {}),
    checked: selected.includes(p.name),
    ...(implied.has(p.name) ? { implied: implied.get(p.name) } : {}),
    offered: rootOffered
  })
  return profileRoots(vocabulary).map(root => ({
    ...leaf(root, offered.has(root.name)),
    children: (root.includes ?? []).map(name => byName.get(name) ?? { name }).map(p => leaf(p, offered.has(root.name)))
  }))
}

/** The URL a reference connects to: `profiles` set to the sorted selection, so equal selections share caches. */
export function withProfiles (url: string, profiles: string[]): string {
  const u = new URL(url)
  u.searchParams.set('profiles', [...new Set(profiles)].sort().join(','))
  return u.toString()
}

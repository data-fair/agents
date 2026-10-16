/**
 * Where a tool offered to the model comes from, as a turn records it (the run's `toolSources`) and the
 * chat's inspection dialog groups it:
 *
 * - `catalog`: an MCP server of the platform's catalog, used with the agent's (or the person's) identity;
 * - `external`: a public MCP server an admin listed for the agent, used anonymously;
 * - `page`: a WebMCP tool the page in front of the person registered, run in their browser;
 * - `service`: this service's own (waiting for the person, web access, files, memory, planning, sub-agents,
 *   scripts…).
 *
 * `server` is the catalog server's id, the external server's host, or the service's own label for a group
 * of its tools; absent for the page's.
 */
export type ToolSourceKind = 'catalog' | 'external' | 'page' | 'service'

export interface ToolSource {
  kind: ToolSourceKind
  server?: string
}

export const TOOL_SOURCE_KINDS: ToolSourceKind[] = ['catalog', 'external', 'page', 'service']

/**
 * Profile vocabularies of profiled catalog servers (`profilesUrl`), and the save-time check of an agent's
 * selection (docs/superpowers/specs/2026-10-14-mcp-profile-selection-design.md §1).
 */
import memoize from 'memoizee'
import { httpError } from '@data-fair/lib-express'
import config from '#config'
import type { McpProfile } from '@agents/shared/mcp-profiles'
import { assertProfiledRefsShape, unknownMcpServerIds, type GlobalMcpServer, type McpServerRef } from './operations.ts'
import { TOOL_LISTING_TTL_MS } from './client.ts'

const vocabulary = memoize(async (_id: string, profilesUrl: string): Promise<McpProfile[]> => {
  const res = await fetch(profilesUrl, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const doc = await res.json() as { profiles?: unknown }
  if (!Array.isArray(doc.profiles)) throw new Error('no profiles array in the response')
  return (doc.profiles as McpProfile[]).filter(p => p && typeof p.name === 'string')
}, { promise: true, maxAge: TOOL_LISTING_TTL_MS, length: 2 })

export const clearProfileVocabularies = () => { vocabulary.clear() }

export const fetchProfiles = async (server: GlobalMcpServer): Promise<McpProfile[]> => {
  if (!server.profilesUrl) throw new Error(`MCP server "${server.id}" declares no profiles`)
  try {
    return await vocabulary(server.id, server.profilesUrl)
  } catch (err: any) {
    vocabulary.delete(server.id, server.profilesUrl)
    throw new Error(`the profile vocabulary of MCP server "${server.id}" could not be read: ${err.message}`)
  }
}

/** Save-time check of an agent's references: known servers, the shape rules, declared profile names. */
export const assertMcpServerRefs = async (refs: McpServerRef[] = []) => {
  const servers = config.mcpServers ?? []
  const unknown = unknownMcpServerIds(servers, refs)
  if (unknown.length) throw httpError(400, `unknown MCP server(s): ${unknown.join(', ')}`)
  try {
    assertProfiledRefsShape(servers, refs, 'mcpServers')
  } catch (err: any) {
    throw httpError(400, err.message)
  }
  for (const ref of refs) {
    const server = servers.find(s => s.id === ref.serverId)!
    if (!server.profilesUrl) continue
    let declared: McpProfile[]
    try {
      declared = await fetchProfiles(server)
    } catch (err: any) {
      throw httpError(502, err.message)
    }
    const names = declared.map(p => p.name)
    const missing = ref.profiles!.find(p => !names.includes(p))
    if (missing) throw httpError(400, `MCP server "${server.id}" has no profile "${missing}" (declared: ${names.join(', ')})`)
  }
}

/**
 * `read_skill`: load a skill a tool server publishes (SEP-2640), keyed by the server's label and the
 * skill's URI, as the SEP's host guidelines sketch it. The read goes over the turn's own connection to
 * that server (see readSkill in ./client.ts and ./external.ts), never to a server outside the turn.
 *
 * Its result is the skill envelope (./guides.ts), not the tool-result envelope: the tool wraps its own
 * output (`selfEnveloped`), and a failure — the server's own words — is wrapped as tool output.
 */
import { tool, jsonSchema, type Tool } from 'ai'
import { skillEnvelope, type ServerGuide } from './guides.ts'
import { wrapToolResult } from '../conversations/operations.ts'

export const READ_SKILL_TOOL_NAME = 'read_skill'
export const READ_SKILL_ANNOTATIONS = { readOnlyHint: true, openWorldHint: false }
/** The stored call's source: the service's own tool; the server a skill came from is in its input and envelope. */
export const SKILLS_SERVER_ID = 'agent-skills'

/**
 * The server a call reads from. Named by the model, as the Skills index shows it; when the name is missing
 * or is not one of the turn's servers (a judged run passed the provider's name), the one server of the turn
 * that lists the URI. Never a server outside the turn: inference only chooses among the turn's own.
 */
const resolveServer = (guides: ServerGuide[], server: string | undefined, uri: string): string => {
  const servers = guides.map(g => g.server)
  if (server && servers.includes(server)) return server
  const listing = guides.filter(g => g.skills.some(s => s.uri === uri)).map(g => g.server)
  if (listing.length === 1) return listing[0]
  if (listing.length > 1) throw new Error(`${uri} is listed by several of your tool servers (${listing.join(', ')}): name one`)
  if (server) throw new Error(`"${server}" is not one of your tool servers this turn (${servers.join(', ') || 'none'})`)
  throw new Error(`none of your tool servers lists ${uri}: name the server (${servers.join(', ') || 'none'})`)
}

export const createReadSkillTool = (opts: { guides: ServerGuide[], read: (server: string, uri: string) => Promise<string> }): Tool => tool({
  description: 'Load a skill: a procedure for some of your tools, published by one of your tool servers or by the service itself. Pass the skill URI exactly as the Skills list in your instructions gives it (or as a server\'s instructions or another skill name a skill:// URI), and the server it is listed under. Load a matching skill before acting, then follow it.',
  inputSchema: jsonSchema<{ server?: string, uri: string }>({
    type: 'object',
    additionalProperties: false,
    required: ['uri'],
    properties: {
      uri: { type: 'string', description: 'The skill\'s SKILL.md URI (skill://…)' },
      server: { type: 'string', description: 'The server the skill is listed under (the word before "·" in the Skills list). Optional when only one server lists the URI.' }
    }
  }),
  execute: async ({ server: named, uri }) => {
    if (!uri.startsWith('skill://')) throw new Error(`a skill URI starts with skill:// (got ${uri})`)
    const server = resolveServer(opts.guides, named, uri)
    let body: string
    try {
      body = await opts.read(server, uri)
    } catch (err) {
      throw new Error(wrapToolResult(server, READ_SKILL_TOOL_NAME, err instanceof Error ? err.message : String(err)))
    }
    return skillEnvelope(server, uri, body)
  }
})

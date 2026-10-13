/**
 * `read_skill`: load a skill a tool server publishes (SEP-2640), keyed by the server's label and the
 * skill's URI, as the SEP's host guidelines sketch it. The read goes over the turn's own connection to
 * that server (see readSkill in ./client.ts and ./external.ts), never to a server outside the turn.
 *
 * Its result is the skill envelope (./guides.ts), not the tool-result envelope: the tool wraps its own
 * output (`selfEnveloped`), and a failure — the server's own words — is wrapped as tool output.
 */
import { tool, jsonSchema, type Tool } from 'ai'
import { skillEnvelope } from './guides.ts'
import { wrapToolResult } from '../conversations/operations.ts'

export const READ_SKILL_TOOL_NAME = 'read_skill'
export const READ_SKILL_ANNOTATIONS = { readOnlyHint: true, openWorldHint: false }
/** The stored call's source: the service's own tool; the server a skill came from is in its input and envelope. */
export const SKILLS_SERVER_ID = 'agent-skills'

export const createReadSkillTool = (opts: { servers: string[], read: (server: string, uri: string) => Promise<string> }): Tool => tool({
  description: 'Load a skill one of your tool servers publishes: the procedure for using its tools. Pass the server and the skill URI exactly as the Skills list in your instructions gives them (or as a server\'s instructions or another skill name a skill:// URI). Load a matching skill before acting, then follow it.',
  inputSchema: jsonSchema<{ server: string, uri: string }>({
    type: 'object',
    additionalProperties: false,
    required: ['server', 'uri'],
    properties: {
      server: { type: 'string', description: 'The tool server, as named in the Skills list' },
      uri: { type: 'string', description: 'The skill\'s SKILL.md URI (skill://…)' }
    }
  }),
  execute: async ({ server, uri }) => {
    if (!opts.servers.includes(server)) throw new Error(`"${server}" is not one of your tool servers this turn (${opts.servers.join(', ') || 'none'})`)
    if (!uri.startsWith('skill://')) throw new Error(`a skill URI starts with skill:// (got ${uri})`)
    let body: string
    try {
      body = await opts.read(server, uri)
    } catch (err) {
      throw new Error(wrapToolResult(server, READ_SKILL_TOOL_NAME, err instanceof Error ? err.message : String(err)))
    }
    return skillEnvelope(server, uri, body)
  }
})

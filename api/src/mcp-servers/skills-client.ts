/**
 * The client half of the MCP skills extension (SEP-2640), shared by the catalog client (./client.ts) and
 * the external one (./external.ts): what every agents MCP client declares, listing a server's skills, and
 * reading one. The TypeScript SDK has no helpers for it; each is one request.
 *
 * Free of #config, so ./external.ts and its unit tests can use it.
 */
import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { z } from 'zod'
import { SKILLS_EXTENSION, skillsFromList, type GuideSkill } from './guides.ts'
import log from '@data-fair/lib-node/log.js'

/** Every agents MCP client declares the skills extension (negotiated per SEP-2133). */
export const MCP_CLIENT_CAPABILITIES = { extensions: { [SKILLS_EXTENSION]: {} } }

const SkillsListResult = z.object({ skills: z.array(z.any()).optional(), nextCursor: z.string().optional() }).loose()
const SkillsGetResult = z.object({ skill: z.any() }).loose()

/** Pages followed at most: a listing is bounded anyway (GUIDE_LIMITS.skills), this only stops a looping cursor. */
const MAX_PAGES = 20

/**
 * How long one `skills/list` request may take. Short, and its own: the SDK's default (60 s) would let a
 * hanging listing outlast the bound on connecting to an external server and cost it all its tools, or
 * stall a catalog listing miss — where a timeout here falls into "no skills", as any failure does.
 */
export const SKILLS_LIST_TIMEOUT_MS = 5000

/** A server's skills, when it declares the extension. A failure (a timeout included) is logged and is no skills: never the tools. */
export const listServerSkills = async (client: Client, serverLabel: string, timeoutMs = SKILLS_LIST_TIMEOUT_MS): Promise<GuideSkill[]> => {
  if (!(client.getServerCapabilities() as any)?.extensions?.[SKILLS_EXTENSION]) return []
  const skills: GuideSkill[] = []
  try {
    let cursor: string | undefined
    for (let page = 0; page < MAX_PAGES; page++) {
      const result = await client.request({ method: 'skills/list', params: cursor ? { cursor } : {} } as any, SkillsListResult, { timeout: timeoutMs })
      skills.push(...skillsFromList(result))
      cursor = result.nextCursor
      if (!cursor) break
    }
  } catch (err: any) {
    log.warn('skills/list of an MCP server failed, its skills are left out', { code: 'mcp-skills-list', mcpServer: serverLabel, err })
    return []
  }
  return skills
}

/**
 * A URI the model gave, as an absolute one: `skill://…` as is, a relative path (`templates/page.json`) as the
 * one listed resource `skill://<name>/<path>` it names. Zero or several matches are an error naming the candidates.
 */
export const resolveSkillUri = (skills: GuideSkill[], uri: string): string => {
  if (uri.startsWith('skill://')) return uri
  const path = uri.replace(/^\.?\//, '')
  const matches = skills.flatMap(s => {
    const dir = s.uri.replace(/\/SKILL\.md$/, '')
    return (s.resources ?? []).filter(r => r === `${dir}/${path}`)
  })
  if (matches.length === 1) return matches[0]
  if (matches.length > 1) throw new Error(`${uri} matches several attached files (${matches.join(', ')}): pass the full skill:// URI`)
  const all = skills.flatMap(s => s.resources ?? [])
  throw new Error(`no listed skill has an attached file ${uri}${all.length ? ` (attached files: ${all.join(', ')})` : ''}`)
}

/**
 * A skill's SKILL.md text, or one of its attached files, over a connection to its server. A URI the server did not list (handed over
 * by its instructions or by another skill) is first confirmed with `skills/get`, so a server that does not
 * serve it answers an error rather than an arbitrary resource being read as a skill.
 */
export const readServerSkill = async (client: Client, listed: GuideSkill[], uri: string): Promise<string> => {
  if (!listed.some(s => s.uri === uri || s.resources?.includes(uri))) {
    const skillMd = /\/SKILL\.md$/.test(uri) ? uri : `skill://${uri.slice('skill://'.length).split('/')[0]}/SKILL.md`
    const got = await client.request({ method: 'skills/get', params: { uri: skillMd } } as any, SkillsGetResult)
    if (skillMd !== uri) {
      const attached = Array.isArray(got.skill?.resources) ? got.skill.resources.map((r: any) => r?.uri) : []
      if (!attached.includes(uri)) throw new Error(`${uri} is not a file of the skill ${skillMd}`)
    }
  }
  const read = await client.readResource({ uri })
  const text = read.contents.map(c => ('text' in c && typeof c.text === 'string' ? c.text : '')).join('\n').trim()
  if (!text) throw new Error(`${uri} has no text content`)
  return text
}

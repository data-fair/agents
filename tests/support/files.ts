/**
 * Helpers of the file specs (tests/features/files): the fixture's port and origin, an agent with files and
 * the fixture's catalog entry, and reading a stored tool call.
 */
import assert from 'node:assert/strict'
import { superAdmin } from './axios.ts'

export const FIXTURE_PORT = Number(process.env.NGINX_PORT) + 30
export const FIXTURE_ORIGIN = `http://localhost:${FIXTURE_PORT}`
export const AGENTS = '/api/autonomous-agents/organization/test1'

/** A configured agent on the public fixture entry, enrolled, reading the fixture's exports from the web. */
export const createFilesAgent = async (over: Record<string, unknown> = {}): Promise<{ id: string }> => {
  const admin = await superAdmin
  const agent = (await admin.post(AGENTS, {
    title: 'File probe',
    persona: 'You answer briefly.',
    mcpServers: [{ serverId: 'dev-public-mcp' }],
    enabled: true,
    web: { enabled: true, allowedUrls: [`${FIXTURE_ORIGIN}/exports`] },
    ...over
  })).data
  await admin.post('/api/test-env/enrol-autonomous-agent', { agentId: agent.id })
  return agent
}

export const callPart = (message: any, toolName: string) => {
  const part = message.parts.find((p: any) => p.type === 'dynamic-tool' && p.toolName === toolName)
  assert.ok(part, `no ${toolName} call in ${JSON.stringify(message.parts)}`)
  return part
}

/** The stored result or error of a call, as text. */
export const outputOf = (part: any): string =>
  part.state === 'output-error' ? String(part.errorText) : typeof part.output === 'string' ? part.output : JSON.stringify(part.output)

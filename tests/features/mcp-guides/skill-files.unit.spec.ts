// tests/features/mcp-guides/skill-files.unit.spec.ts
// The attached-files path end to end against the in-process fixture: a real SDK client, skills/list resources, resources/read.
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { startMcpFixture, type McpFixture } from '../../support/mcp-fixture.ts'
import { MCP_CLIENT_CAPABILITIES, listServerSkills, readServerSkill } from '../../../api/src/mcp-servers/skills-client.ts'
import { createReadSkillTool } from '../../../api/src/mcp-servers/read-skill.ts'

let fixture: McpFixture
let client: Client
test.beforeAll(async () => {
  fixture = await startMcpFixture(0)
  client = new Client({ name: 't', version: '1' }, { capabilities: MCP_CLIENT_CAPABILITIES as any })
  await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${fixture.port}/mcp`)))
})
test.afterAll(async () => { await client.close(); await fixture.close() })

test('the fixture\'s attached file is listed, read by relative path, and its SKILL.md lists it', async () => {
  const skills = await listServerSkills(client, 'fixture')
  const filed = skills.find(s => s.name === 'templates')
  assert.deepEqual(filed?.resources, ['skill://fixture/templates/page.json'])
  const t = createReadSkillTool({ guides: [{ server: 'fixture', skills }], read: (_server, uri) => readServerSkill(client, skills, uri) })
  const run = (input: unknown) => (t as any).execute(input, { toolCallId: 'c', messages: [] })
  const file = await run({ uri: 'page.json' })
  assert.match(file, /^<skill server="fixture" uri="skill:\/\/fixture\/templates\/page\.json">\n\{"title":"Page template"\}/)
  const md = await run({ server: 'fixture', uri: 'skill://fixture/templates/SKILL.md' })
  assert.match(md, /Start from the page template\.\n\nAttached files:\nskill:\/\/fixture\/templates\/page\.json\n<\/skill>/)
})

test('an unlisted file of a prefixed skill is confirmed by walking up to its SKILL.md', async () => {
  // nothing listed: the owner is found through the ancestors, nearest first
  assert.equal(await readServerSkill(client, [], 'skill://fixture/templates/page.json'), '{"title":"Page template"}')
  await assert.rejects(readServerSkill(client, [], 'skill://fixture/templates/other.json'), /not a file of the skill skill:\/\/fixture\/templates\/SKILL\.md/)
  await assert.rejects(readServerSkill(client, [], 'skill://nowhere/x.json'), /belongs to no skill/)
})

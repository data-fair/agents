/**
 * stateless unit tests: what an autonomous agent reads about itself — its configuration and its runs.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import type { Tool } from 'ai'
import { renderConfiguration, renderRunRow, exportPage, agentGuide, readAgentSkill, EARLIER_WORK_SKILL_URI, LIST_MY_RUNS_DESCRIPTION, READ_CONVERSATION_DESCRIPTION, SELF_KNOWLEDGE_TOOL_NAMES, PLANNING_TOOL_NAMES, PLANNING_NEEDS_ADMIN, PLANNED_TASKS_HEADER, type ConfigurationView } from '../../../api/src/self-knowledge/operations.ts'
import { CODE_MODE_POLICY } from '../../../api/src/code-mode/operations.ts'
import { SERVICE_TOOL_NAMES } from '../../../api/src/conversations/service-tool-names.ts'
import { buildSystemPrompt } from '../../../api/src/conversations/operations.ts'

// Rendering reads a tool's provenance, never the tool itself.
const unusedTool = {} as Tool

const view = (surface: 'chat' | 'task'): ConfigurationView => ({
  files: true,
  codeMode: true,
  agent: { title: 'Roads', persona: 'You watch the roads.', instructions: 'Answer in French.', approvalLevel: 'write', memoryEnabled: false },
  surface,
  catalog: {
    tools: {
      lookup: { tool: unusedTool, server: 'roads', annotations: { readOnlyHint: true } },
      wipe: { tool: unusedTool, server: 'roads', annotations: { destructiveHint: true } },
      edit: { tool: unusedTool, server: 'roads' }
    },
    filteredOut: [{ name: 'ignored', server: 'roads' }],
    needsFiles: [{ name: 'import', server: 'roads' }],
    skippedServers: [{ id: 'weather', reason: 'fetch failed' }]
  },
  serviceTools: ['memory', 'report_outcome'],
  notConnected: [{ id: 'registry', name: 'Registry', description: 'Searches datasets' }],
  tasks: [{
    id: 't1',
    title: 'Morning check',
    scheduling: [{ type: 'daily', hour: 8, minute: 0, timeZone: 'Europe/Paris' }],
    enabled: true,
    pausedReason: 'paused after 3 consecutive failed runs'
  }]
})

const lines = (text: string) => text.split('\n')

test.describe('renderConfiguration', () => {
  test('each tool line names its server and why it is or is not usable, in a chat', () => {
    const text = renderConfiguration(view('chat'))
    const all = lines(text)
    assert.ok(all.includes('- lookup (server roads): usable'), text)
    assert.ok(all.includes('- wipe (server roads): needs the person\'s approval'), text)
    assert.ok(all.includes('- edit (server roads): needs the person\'s approval'), text)
    assert.ok(all.includes('- ignored (server roads): not selected for you by an administrator'), text)
    assert.ok(all.includes('- import (server roads): not usable: it takes a file, and this deployment has no file store'), text)
    assert.ok(all.includes('- server weather: server unreachable: fetch failed'), text)
    assert.ok(all.includes('- registry: Registry — Searches datasets'), text)
  })

  test('the skills its tool servers publish are listed with how to load them; none, none', () => {
    const withSkills = { ...view('chat'), skills: [{ server: 'roads', name: 'closures', uri: 'skill://roads/closures/SKILL.md' }] }
    assert.ok(lines(renderConfiguration(withSkills)).includes('- closures (server roads): load it with read_skill, uri skill://roads/closures/SKILL.md'))
    assert.match(renderConfiguration(view('chat')), /## Skills\nNone\./)
  })

  test('on the task surface a tool needing approval is out of reach: nobody is present', () => {
    assert.ok(lines(renderConfiguration(view('task'))).includes('- wipe (server roads): not usable here: needs approval and nobody is present'))
  })

  test('identity, the resolved policy, the service tools, the tasks and the memory are all stated', () => {
    const text = renderConfiguration(view('chat'))
    assert.match(text, /Roads/)
    assert.match(text, /You watch the roads\./)
    assert.match(text, /Answer in French\./)
    const all = lines(text)
    assert.ok(all.includes('approval level: write (read-only tools: allow, write tools: approve, destructive tools: approve)'), text)
    assert.ok(all.includes('- memory'), text)
    assert.ok(all.includes('- report_outcome'), text)
    assert.ok(all.includes('- t1: Morning check — every day at 08:00 (Europe/Paris) — next run: none — paused: paused after 3 consecutive failed runs'), text)
    assert.match(text, /## Memory\nOff/)
  })

  test('a chat turn not offered the planning tools says why; one offered them, or a task run, does not', () => {
    assert.ok(lines(renderConfiguration(view('chat'))).includes(PLANNING_NEEDS_ADMIN))
    const offered = view('chat')
    offered.serviceTools = [...offered.serviceTools, ...PLANNING_TOOL_NAMES]
    assert.ok(!renderConfiguration(offered).includes(PLANNING_NEEDS_ADMIN))
    assert.ok(!renderConfiguration(view('task')).includes(PLANNING_NEEDS_ADMIN))
  })

  test('code mode is stated as on, on every surface, with the limits the policy sets', () => {
    for (const surface of ['chat', 'task'] as const) {
      const text = renderConfiguration(view(surface))
      assert.match(text, /## Code mode\nOn: code_mode runs a JavaScript script/)
      assert.match(text, new RegExp(`${CODE_MODE_POLICY.maxBridgeRequests} tool calls, ${CODE_MODE_POLICY.timeoutMs / 60_000} minutes`))
    }
  })

  test('a task disabled by an admin, not paused, reads as disabled', () => {
    const disabled = view('chat')
    disabled.tasks = [{ id: 't2', title: 'Evening check', scheduling: [{ type: 'daily', hour: 18, minute: 0, timeZone: 'Europe/Paris' }], enabled: false }]
    assert.ok(lines(renderConfiguration(disabled)).includes('- t2: Evening check — every day at 18:00 (Europe/Paris) — next run: none — disabled'))
  })

  // A judged run read its own approved task as still awaiting approval: the listing says it is not.
  test('the planned tasks are said to exist and run, with no approval pending, right above them', () => {
    const text = renderConfiguration(view('chat'))
    assert.match(PLANNED_TASKS_HEADER, /none awaits approval/)
    assert.ok(text.includes(`## Planned tasks\n${PLANNED_TASKS_HEADER}\n- t1: Morning check`), text)
    const none = view('chat')
    none.tasks = []
    assert.ok(renderConfiguration(none).includes('## Planned tasks\nNone.'), 'nothing to vouch for when there is no task')
  })
})

const run = (over: any = {}): any => ({
  id: 'r1',
  agentId: 'a1',
  kind: 'task',
  taskId: 't1',
  owner: { type: 'organization', id: 'test1' },
  trigger: 'schedule',
  triggeredBy: { userId: 'u1', userName: 'Jane Secret' },
  status: 'done',
  startedAt: '2026-10-08T08:00:00.000Z',
  credits: 0.25,
  ...over
})

test.describe('renderRunRow', () => {
  test('a skipped run is labelled skipped, with its reason', () => {
    const row = renderRunRow(run({ status: 'skipped', error: 'the previous run is still running' }), 'Morning check')
    assert.match(row, /skipped: the previous run is still running/)
    assert.match(row, /Morning check/)
  })

  test('never names who triggered it', () => {
    const row = renderRunRow(run({ kind: undefined, taskId: undefined, conversationId: 'c1', trigger: 'user' }), undefined)
    assert.doesNotMatch(row, /Jane|Secret|u1/)
    assert.match(row, /conversation/)
  })

  test('a conversation row carries its title, and marks the conversation being had now', () => {
    const other = renderRunRow(run({ kind: undefined, taskId: undefined, conversationId: 'c1', trigger: 'user' }), 'Road closures without short works', 'c2')
    assert.match(other, /conversation c1 "Road closures without short works" \|/)
    const current = renderRunRow(run({ kind: undefined, taskId: undefined, conversationId: 'c2', trigger: 'user' }), 'Why closures were missing', 'c2')
    assert.match(current, /conversation c2 "Why closures were missing" \(this conversation\)/)
  })

  test('the outcome summary is clipped at 300 characters', () => {
    const summary = 'a'.repeat(300) + 'b'.repeat(100)
    const row = renderRunRow(run({ outcome: { status: 'done', summary } }), 'Morning check')
    assert.ok(row.includes('a'.repeat(300) + '…'), row)
    assert.doesNotMatch(row, /b/)
  })
})

test.describe('exportPage', () => {
  test('called without a line, it gives the file description and the outline only, and says how to read on', () => {
    const jsonl = ['{"type":"meta"}', '{"type":"outline"}', '{"type":"message","text":"' + 'x'.repeat(50) + '"}', '{"type":"run"}'].join('\n')
    const page = exportPage(jsonl)
    assert.match(page, /^1: \{"type":"meta"\}\n2: \{"type":"outline"\}\n/)
    assert.doesNotMatch(page, /"type":"message"/)
    assert.match(page, /\[outline only: read the lines you need with `line` \(from 3 to 4\)\]$/)
  })

  const jsonl = ['{"type":"meta"}', '{"type":"outline"}', ...Array.from({ length: 10 }, (_, i) => JSON.stringify({ type: 'message', seq: i + 1, text: 'x'.repeat(100) })), JSON.stringify({ type: 'blob', value: 'b'.repeat(5000) })].join('\n') + '\n'

  test('reads from a line, numbers each line, and says where the next page starts', () => {
    const page = exportPage(jsonl, 1, 0, 600)
    assert.match(page, /^1: \{"type":"meta"\}\n2: \{"type":"outline"\}\n3: /)
    const next = /call again with line (\d+)\]$/.exec(page)
    assert.ok(next && Number(next[1]) > 3 && Number(next[1]) < 13, page)
    // a line bigger than a whole page fills what is left of this one, and goes on from its offset
    assert.match(exportPage(jsonl, 12, 0, 600), /^12: .*\n13: \{"type":"blob","value":"b+\n\[more: call again with line 13, offset \d+\]$/)
  })

  test('a line longer than a page is cut, and goes on from its offset', () => {
    const first = exportPage(jsonl, 13, 0, 2000)
    assert.match(first, /^13: \{"type":"blob"/)
    assert.match(first, /\[more: call again with line 13, offset 2000\]$/)
    const last = exportPage(jsonl, 13, 4000, 2000)
    assert.match(last, /^13: …b+"\}\n\[end of the export, 13 lines\]$/)
  })

  test('a line out of range says how long the export is', () => {
    assert.equal(exportPage(jsonl, 99), 'There is no line 99: the export has 13 lines.')
  })
})

test.describe('self-knowledge names and prompt', () => {
  test('the three tools are reserved service tool names', () => {
    for (const name of SELF_KNOWLEDGE_TOOL_NAMES) assert.ok(SERVICE_TOOL_NAMES.has(name), name)
  })

  test('the three planning tools are reserved service tool names', () => {
    for (const name of PLANNING_TOOL_NAMES) assert.ok(SERVICE_TOOL_NAMES.has(name), name)
  })

  test('a configured agent is told to check its configuration before refusing, the personal assistant is not', () => {
    const sentence = 'Before telling someone you cannot do something, check get_my_configuration: it lists what you can use, and why anything else is out of reach.'
    const configured = { title: 'Roads', persona: 'p', nhi: { clientId: 'c1' } }
    const prompt = buildSystemPrompt(configured, undefined, 'task')
    assert.ok(prompt.includes(sentence))
    assert.ok(prompt.indexOf(sentence) < prompt.indexOf('This is a scheduled execution'))
    assert.ok(!buildSystemPrompt({ title: 'Personal', persona: 'p' }).includes('get_my_configuration'))
  })
})

test.describe('renderConfiguration — files', () => {
  test('files on: what the agent can do with them, and the bounds', () => {
    const text = renderConfiguration(view('chat'))
    assert.match(text, /## Files\nOn: your files belong to this conversation \(or task run\)/)
    assert.match(text, /100 MB per file and 500 MB in all; a file is deleted 7 days after it was last written\./)
  })
  test('files off: said plainly', () => {
    assert.match(renderConfiguration({ ...view('chat'), files: false }), /## Files\nOff: this deployment has no file store/)
  })
  test('code mode off for an outsider: said plainly', () => {
    assert.match(renderConfiguration({ ...view('chat'), codeMode: false }), /## Code mode\nOff for this conversation: code_mode is not offered to someone outside the organization/)
    assert.match(renderConfiguration(view('chat')), /## Code mode\nOn:/)
  })
})

test.describe('earlier work', () => {
  test('the agent publishes its own skill for reading earlier work, listed under its own label', () => {
    const guide = agentGuide()
    assert.equal(guide.server, 'agent')
    assert.deepEqual(guide.skills.map(s => s.uri), [EARLIER_WORK_SKILL_URI])
    assert.match(guide.skills[0].description, /earlier conversation or task run, or asks why you did something/)
  })

  test('the skill walks from list_my_runs to read_conversation, and forbids claiming no visibility without looking', () => {
    const body = readAgentSkill(EARLIER_WORK_SKILL_URI)
    assert.match(body, /list_my_runs[^]*read_conversation/)
    assert.match(body, /never say you cannot see/i)
    assert.throws(() => readAgentSkill('skill://agent/nope/SKILL.md'), /no skill/)
  })

  test('the history tools say to look first, before a skill, fresh data or a refusal, even when the earlier work is only implied', () => {
    for (const description of [LIST_MY_RUNS_DESCRIPTION, READ_CONVERSATION_DESCRIPTION]) {
      assert.match(description, /before loading a skill, fetching data again or saying you cannot/)
      assert.match(description, /even when they do not say it was in another conversation/)
    }
    assert.match(READ_CONVERSATION_DESCRIPTION, /from that line ONWARD, as many lines as fit a page/)
  })
})

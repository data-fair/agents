import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { SERVICE_TOOL_NAMES } from '../../../api/src/conversations/service-tool-names.ts'
import { WAIT_TOOL_NAME } from '../../../shared/agent-activity.ts'
import { builtinToolLabel, skillName, LABELLED_BUILTIN_TOOLS } from '../../../ui/src/utils/builtin-tool-labels.ts'

test.describe('What a chip calls the service\'s own tools', () => {
  test('every service tool but the wait is named, and only those', () => {
    // A new service tool without a label would show its snake_case name to the person, as read_skill did.
    const expected = [...SERVICE_TOOL_NAMES].filter(name => name !== WAIT_TOOL_NAME).sort()
    assert.deepEqual([...LABELLED_BUILTIN_TOOLS].sort(), expected)
  })

  test('every label has its words in both languages', () => {
    const source = readFileSync(new URL('../../../ui/src/components/agent-chat/AgentChatMessages.vue', import.meta.url), 'utf8')
    const i18n = source.match(/<i18n lang="yaml">([\s\S]*?)<\/i18n>/)![1]
    const [, fr, en] = i18n.split(/^(?:fr|en):$/m)
    const keys = LABELLED_BUILTIN_TOOLS.flatMap(name => {
      const withArgument = builtinToolLabel(name, { uri: 'skill://s/x/SKILL.md', url: 'https://a.b', site: 'a.b', file_path: '/f.csv' })!.key
      return [withArgument, builtinToolLabel(name, {})!.key, builtinToolLabel(name, { command: 'view' })!.key]
    })
    for (const key of new Set(keys)) {
      assert.match(fr, new RegExp(`^  ${key}:`, 'm'), `fr is missing ${key}`)
      assert.match(en, new RegExp(`^  ${key}:`, 'm'), `en is missing ${key}`)
    }
  })

  test('a skill is named by its URI\'s last folder', () => {
    assert.equal(skillName('skill://platform/closures/SKILL.md'), 'closures')
    assert.equal(skillName('skill://agent/earlier-work/SKILL.md'), 'earlier-work')
    assert.deepEqual(builtinToolLabel('read_skill', { uri: 'skill://fixture/closures/SKILL.md', server: 'fixture' }), { key: 'toolReadSkill', name: 'closures' })
  })

  test('a call whose argument has not arrived yet still reads', () => {
    assert.deepEqual(builtinToolLabel('read_skill', undefined), { key: 'toolReadSkillAny' })
    assert.deepEqual(builtinToolLabel('fetch_url', {}), { key: 'toolFetchUrlAny' })
  })

  test('a fetch is named by the site, and memory by whether it reads or writes', () => {
    assert.deepEqual(builtinToolLabel('fetch_url', { url: 'https://www.data.gouv.fr/datasets?q=x' }), { key: 'toolFetchUrl', name: 'www.data.gouv.fr' })
    assert.deepEqual(builtinToolLabel('list_site_pages', { site: 'example.org' }), { key: 'toolListSitePages', name: 'example.org' })
    assert.deepEqual(builtinToolLabel('memory', { command: 'view', path: 'MEMORY.md' }), { key: 'toolMemoryView' })
    assert.deepEqual(builtinToolLabel('memory', { command: 'create', path: 'MEMORY.md' }), { key: 'toolMemoryEdit' })
  })

  test('another tool is left to the title it declares', () => {
    assert.equal(builtinToolLabel('list_road_closures', {}), null)
  })
})

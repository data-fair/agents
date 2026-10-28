/**
 * stateless unit tests: the service's own tool names, which no page tool may take.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { SERVICE_TOOL_NAMES, mayBePageTool } from '../../../api/src/conversations/service-tool-names.ts'

test.describe('service tool names', () => {
  test('the wait, the memory, the outcome, the web, the skill loader, the self-knowledge and the planning tools are the service\'s own', () => {
    assert.deepEqual([...SERVICE_TOOL_NAMES].sort(), ['code_mode', 'delete_task', 'fetch_url', 'get_my_configuration', 'list_my_runs', 'list_site_pages', 'ls', 'memory', 'plan_task', 'read_conversation', 'read_file', 'read_skill', 'report_outcome', 'request_mcp_access', 'request_web_access', 'update_task', 'wait_for_user_action', 'write_file'])
  })

  test('a page tool may not take a service tool\'s name', () => {
    assert.equal(mayBePageTool('wait_for_user_action'), false)
    assert.equal(mayBePageTool('memory'), false)
    assert.equal(mayBePageTool('read_file'), false)
    assert.equal(mayBePageTool('fetch_url'), false)
    assert.equal(mayBePageTool('select_row'), true)
  })
})

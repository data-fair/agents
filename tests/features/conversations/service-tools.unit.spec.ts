/**
 * stateless unit tests: the service's own tool names, which no page tool or sub-agent config may take.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { SERVICE_TOOL_NAMES, mayBePageTool } from '../../../api/src/conversations/service-tool-names.ts'

test.describe('service tool names', () => {
  test('the wait, the memory, the outcome, the web and the self-knowledge tools are the service\'s own', () => {
    assert.deepEqual([...SERVICE_TOOL_NAMES].sort(), ['delete_task', 'fetch_url', 'get_my_configuration', 'get_run', 'list_my_runs', 'list_site_pages', 'memory', 'plan_task', 'report_outcome', 'request_web_access', 'update_task', 'wait_for_user_action'])
  })

  test('a page tool may not take a service tool\'s name', () => {
    assert.equal(mayBePageTool('wait_for_user_action'), false)
    assert.equal(mayBePageTool('memory'), false)
    assert.equal(mayBePageTool('fetch_url'), false)
    assert.equal(mayBePageTool('select_row'), true)
  })
})

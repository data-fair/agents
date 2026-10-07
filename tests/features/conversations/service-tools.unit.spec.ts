/**
 * stateless unit tests: the service's own tool names, which no page tool or sub-agent config may take.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { SERVICE_TOOL_NAMES } from '../../../api/src/conversations/service-tool-names.ts'

test.describe('service tool names', () => {
  test('the wait and the memory tool are the service\'s own', () => {
    assert.deepEqual([...SERVICE_TOOL_NAMES].sort(), ['memory', 'wait_for_user_action'])
  })
})

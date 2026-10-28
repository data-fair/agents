/**
 * The names of the service's own tools (./service-tools.ts). Pure, so the page-tool overlay can import it
 * without the registry's stateful builders.
 *
 * Reserved: a page registering a tool by one of these names must not
 * displace the service's tool — the person would be answered by the page's, under the service's name.
 */
import { WAIT_TOOL_NAME } from '@agents/shared/agent-activity'
import { MEMORY_TOOL_NAME } from '../memory/operations.ts'
import { FILE_TOOL_NAMES } from '../files/operations.ts'
import { WEB_TOOL_NAMES } from '../web/operations.ts'
import { REQUEST_MCP_ACCESS_TOOL_NAME } from '../mcp-servers/operations.ts'
import { SELF_KNOWLEDGE_TOOL_NAMES, PLANNING_TOOL_NAMES } from '../self-knowledge/operations.ts'
import { READ_SKILL_TOOL_NAME } from '../mcp-servers/read-skill.ts'
import { CODE_MODE_TOOL_NAME } from '../code-mode/operations.ts'

/** How a planned task's run reports what it found or did (the task surface only). */
export const REPORT_OUTCOME_TOOL_NAME = 'report_outcome'
export { OUTCOME_REMINDER } from './outcome-reminder.ts'

/** Whether a turn's parts hold a report_outcome call that succeeded. */
export const reportedOutcome = (parts: readonly { type: string, toolName?: string, state?: string }[]): boolean =>
  parts.some(part => part.type === 'dynamic-tool' && part.toolName === REPORT_OUTCOME_TOOL_NAME && part.state === 'output-available')

export const SERVICE_TOOL_NAMES: ReadonlySet<string> = new Set([WAIT_TOOL_NAME, MEMORY_TOOL_NAME, REPORT_OUTCOME_TOOL_NAME, ...WEB_TOOL_NAMES, ...FILE_TOOL_NAMES, REQUEST_MCP_ACCESS_TOOL_NAME, READ_SKILL_TOOL_NAME, ...SELF_KNOWLEDGE_TOOL_NAMES, ...PLANNING_TOOL_NAMES, CODE_MODE_TOOL_NAME])

/** Whether a tool a page registers by this name may be offered: never a service tool's name. */
export const mayBePageTool = (name: string): boolean => !SERVICE_TOOL_NAMES.has(name)

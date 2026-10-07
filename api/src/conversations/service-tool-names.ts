/**
 * The names of the service's own tools (./service-tools.ts). Pure, so the sub-agent partition and the
 * page-tool overlay can import it without the registry's stateful builders.
 *
 * Reserved: a page registering a tool by one of these names, or a sub-agent config naming one, must not
 * displace the service's tool — the person would be answered by the page's, under the service's name.
 */
import { WAIT_TOOL_NAME } from '@agents/shared/host-events'
import { MEMORY_TOOL_NAME } from '../memory/operations.ts'

export const SERVICE_TOOL_NAMES: ReadonlySet<string> = new Set([WAIT_TOOL_NAME, MEMORY_TOOL_NAME])

/**
 * How a planned task's run reports what it found or did. NOT reserved above: it exists only on the task
 * surface, which has no page and so no page tool or sub-agent config that could take its name — and
 * reserving it would only forbid a chat page a name the service never uses there.
 */
export const REPORT_OUTCOME_TOOL_NAME = 'report_outcome'

/** Whether a tool a page registers by this name may be offered: never a service tool's name. */
export const mayBePageTool = (name: string): boolean => !SERVICE_TOOL_NAMES.has(name)

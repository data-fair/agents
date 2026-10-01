/**
 * The page's contextual tools, as a tool set the model can call.
 *
 * This is the bridge's server half: a `BrowserToolDescriptor` the page declared becomes an AI SDK
 * `Tool` whose `execute` asks that browser over the socket and waits. From the loop's point of view a
 * page tool and an MCP tool are the same thing, which is the property that lets one loop serve both.
 *
 * The tool set is built PER TURN, from what the page declares at that moment. Freezing it for the turn
 * is the same rule the MCP catalog follows — nothing a tool returns can add a tool — and it also means
 * a navigation mid-turn cannot change what the model was told it had. A tool that disappears in that
 * window fails at the call, which `session.callBrowserTool` already handles by checking the current
 * declaration.
 */

import { tool, jsonSchema, type Tool } from 'ai'
import { withProvenance } from '../autonomous-agent-runtime/operations.ts'
import type { BrowserToolDescriptor } from '@agents/shared/agent-session-protocol'
import type { AgentSession } from './session.ts'

/**
 * The server name a page tool's provenance envelope carries.
 *
 * Deliberately not the page's URL, even though that would be more informative: the envelope's content
 * reaches the model, and a URL is attacker-influenced text on a shared surface. The page is identified
 * as a page; which page it was is in the conversation's own record.
 */
export const BROWSER_TOOL_SERVER = 'the-page'

/**
 * The declared tools, made callable.
 *
 * `inputSchema` is passed through as the page gave it. It is not validated here: it came from a
 * WebMCP server in the page, the model's provider is what has to accept it, and a schema this service
 * rejected would silently cost the user a capability their page legitimately offers.
 */
export function browserToolSet (session: AgentSession, descriptors?: BrowserToolDescriptor[]): Record<string, Tool> {
  const tools: Record<string, Tool> = {}
  for (const descriptor of descriptors ?? session.tools()) {
    tools[descriptor.name] = tool({
      description: descriptor.description ?? '',
      inputSchema: jsonSchema((descriptor.inputSchema as any) ?? { type: 'object', properties: {} }),
      execute: async (input: unknown) => await session.callBrowserTool(descriptor.name, input)
    })
  }
  // The same envelope an MCP tool's result gets, from the same implementation. A page's result is
  // untrusted input in exactly the same way: it is content the model will read, arriving from
  // somewhere that is not this service.
  return withProvenance(tools, () => BROWSER_TOOL_SERVER)
}

/**
 * The descriptors a tool set advertises, for the record and the trace.
 *
 * Names and descriptions only — never the schemas, which are large and whose only reader is the
 * provider.
 */
export function describeBrowserTools (descriptors: BrowserToolDescriptor[]): Array<{ name: string, description: string }> {
  return descriptors.map(descriptor => ({ name: descriptor.name, description: descriptor.description ?? '' }))
}

import type { Tool } from 'ai'

/**
 * A tool's description as text.
 *
 * AI SDK 7 types `Tool.description` as a string OR a function of the call's context, resolved by the SDK
 * when it builds a step. Every tool of this service is built with a string, so a function is not expected
 * here; it reads as no description rather than leaking a function into a descriptor, a JSON frame or a
 * stored part.
 */
export const toolDescription = (tool: Pick<Tool, 'description'> | undefined): string =>
  typeof tool?.description === 'string' ? tool.description : ''

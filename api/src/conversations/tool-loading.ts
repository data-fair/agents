/**
 * ON-DEMAND TOOL LOADING (docs/architecture/tool-loading.md): above a share of the model's context window, a turn's
 * MCP tools are not sent as definitions. The system prompt lists them in a catalog, one line each, and the model
 * loads the ones it needs by exact name with `load_tools`. The SDK's per-step filter (`activeTools`, returned from
 * prepareStep) hides the others; a loaded tool stays loaded for the rest of the conversation, read back from the
 * history. Pure: the loop (./model-loop.ts) wires it.
 *
 * Not the SDK's toolSearch()/deferLoading: its input is a free-text query for a search the catalog makes needless,
 * and its discovered set is private to one generation — we would have kept a second copy to carry it across turns.
 */
import { tool, jsonSchema, asSchema, type ModelMessage, type Tool } from 'ai'
import { estimateTokens } from './compaction-policy.ts'
import type { ToolSet } from './operations.ts'

export const LOAD_TOOLS_TOOL_NAME = 'load_tools'
/** A catalog line's summary, at most: the first sentence of a description is usually well under it. */
export const TOOL_CATALOG_SUMMARY_MAX = 120

export interface CatalogEntry { server: string, name: string, summary: string }

type ToolOrigins = Record<string, 'platform' | 'catalog' | 'external'> | undefined

/** The MCP tools of the turn (platform, catalog, external), in the set's order, minus those a page tool shadows. */
export const deferrableNames = (tools: ToolSet, toolOrigins: ToolOrigins, shadowed: ReadonlySet<string>): string[] =>
  Object.keys(tools).filter(name => !!toolOrigins?.[name] && !shadowed.has(name))

/** What these tools' definitions (description and input schema, as the provider gets them) weigh, in estimated tokens. */
export const definitionsTokens = async (tools: ToolSet, names: string[]): Promise<number> => {
  let chars = 0
  for (const name of names) {
    const t = tools[name]?.tool
    if (!t) continue
    let inputSchema: unknown
    try { inputSchema = t.inputSchema ? await asSchema(t.inputSchema as any).jsonSchema : undefined } catch { inputSchema = undefined }
    chars += JSON.stringify({ name, description: typeof t.description === 'string' ? t.description : '', inputSchema }).length
  }
  return estimateTokens(chars)
}

/** Claude Code's `auto` rule: defer once the definitions exceed this share of the context window. */
export const shouldDefer = (tokens: number, contextWindow: number, percent: number): boolean =>
  tokens > contextWindow * percent / 100

/** The first sentence of a description, on one line, bounded. */
export const summaryOf = (description: string | undefined): string => {
  const first = (description ?? '').trim().split(/\n|(?<=\.)\s/)[0].replace(/\s+/g, ' ').trim()
  return first.length > TOOL_CATALOG_SUMMARY_MAX ? `${first.slice(0, TOOL_CATALOG_SUMMARY_MAX - 1)}…` : first
}

export const catalogEntries = (tools: ToolSet, names: string[]): CatalogEntry[] =>
  names.filter(name => tools[name]).map(name => {
    const description = tools[name].tool.description
    return { server: tools[name].server ?? '', name, summary: summaryOf(typeof description === 'string' ? description : undefined) }
  })

/**
 * The system prompt's catalog: every deferrable tool of the turn, loaded or not, so a load never changes the prompt.
 * A flat list per server, full names: the names are what load_tools takes.
 */
export const renderToolCatalog = (entries: CatalogEntry[]): string | undefined => {
  if (!entries.length) return undefined
  const servers: string[] = []
  const byServer = new Map<string, CatalogEntry[]>()
  for (const entry of entries) {
    if (!byServer.has(entry.server)) { servers.push(entry.server); byServer.set(entry.server, []) }
    byServer.get(entry.server)!.push(entry)
  }
  const lines = [
    '## Tools to load',
    `These tools exist but are not loaded: their definitions are not in your tool list. To use one, load it first with ${LOAD_TOOLS_TOOL_NAME}, by its exact name below (several in one call). A loaded tool is callable from your next step and stays available for the rest of the conversation.`
  ]
  for (const server of servers) {
    lines.push('', `${server || 'tools'}:`)
    for (const entry of byServer.get(server)!) lines.push(entry.summary ? `- ${entry.name} — ${entry.summary}` : `- ${entry.name}`)
  }
  return lines.join('\n')
}

/** load_tools: loads the catalog's tools by exact name. No search: the catalog is the list. */
export const createLoadTools = (deferrable: ReadonlySet<string>): Tool => tool({
  description: 'Load tools listed under "Tools to load" in your instructions, by their exact names. Their definitions are added to your tool list from your next step on, for the rest of the conversation.',
  inputSchema: jsonSchema<{ names: string[] }>({
    type: 'object',
    properties: { names: { type: 'array', items: { type: 'string' }, minItems: 1, description: 'Exact tool names, as listed.' } },
    required: ['names'],
    additionalProperties: false
  }),
  execute: async ({ names }: { names: string[] }) => {
    const unique = [...new Set(Array.isArray(names) ? names.map(String) : [])]
    const loaded = unique.filter(name => deferrable.has(name))
    const unknown = unique.filter(name => !deferrable.has(name))
    if (!loaded.length) throw new Error(`No tool to load: ${unknown.join(', ') || '(no name)'} ${unknown.length > 1 ? 'are' : 'is'} not listed under "Tools to load". Use the exact names listed there.`)
    return unknown.length ? { loaded, unknown } : { loaded }
  }
})

const loadedOf = (value: unknown): string[] => {
  const loaded = (value as { loaded?: unknown } | null)?.loaded
  return Array.isArray(loaded) ? loaded.filter((name): name is string => typeof name === 'string') : []
}

/**
 * A load_tools result as a history carries it: an object within the turn that made it (`json`), its JSON text once
 * the turn is stored and replayed (the record keeps a result's text, ./parts-recorder.ts). A failure is neither.
 */
const resultValue = (output: { type?: string, value?: unknown } | undefined): unknown => {
  if (output?.type === 'json') return output.value
  if (output?.type === 'text' && typeof output.value === 'string') {
    try { return JSON.parse(output.value) } catch { return undefined }
  }
  return undefined
}

/**
 * The tools a history loaded: every tool it called, and every name a successful load_tools result loaded. A call
 * refused because its tool was not loaded (notLoadedMessage) loads nothing: only load_tools loads, or a model
 * ignoring the hint would find the tool loaded on the next turn. A call with no result yet (awaiting approval) counts.
 */
export const loadedToolNames = (history: ModelMessage[]): Set<string> => {
  const parts = history.flatMap(message => Array.isArray(message.content) ? message.content as any[] : [])
  const refused = new Set(parts
    .filter(part => part?.type === 'tool-result' && part.output?.type === 'error-text' && typeof part.output.value === 'string' && part.output.value.includes(notLoadedMessage(part.toolName)))
    .map(part => part.toolCallId))
  const names = new Set<string>()
  for (const part of parts) {
    if (part?.type === 'tool-call' && typeof part.toolName === 'string' && !refused.has(part.toolCallId)) names.add(part.toolName)
    if (part?.type === 'tool-result' && part.toolName === LOAD_TOOLS_TOOL_NAME) {
      for (const name of loadedOf(resultValue(part.output))) names.add(name)
    }
  }
  return names
}

/** The tools this turn's own load_tools calls loaded, from the steps so far. */
export const loadedInSteps = (steps: ReadonlyArray<{ toolResults: ReadonlyArray<{ toolName: string, output: unknown }> }>): Set<string> => {
  const names = new Set<string>()
  for (const step of steps) {
    for (const result of step.toolResults) if (result.toolName === LOAD_TOOLS_TOOL_NAME) for (const name of loadedOf(result.output)) names.add(name)
  }
  return names
}

/**
 * Whether a tool is held back this step: a deferrable one not loaded yet. A page tool never is, though it take a
 * deferrable MCP tool's name: it shadows that tool (./model-loop.ts), and a page registers tools mid-turn, so the
 * page's names are the step's, not the turn start's.
 */
export const isHeldBack = (name: string, deferrable: ReadonlySet<string>, loaded: ReadonlySet<string>, pageNames: ReadonlySet<string> = new Set()): boolean =>
  deferrable.has(name) && !loaded.has(name) && !pageNames.has(name)

/**
 * The order a step's tools are sent in: the always-on ones in the map's order, then the loaded ones in the order they
 * were loaded (`loaded` is a set filled in history order, then this turn's). A load then APPENDS to the provider's
 * tool list, which keeps the cached prefix up to it — inserted at its place in the map, among the MCP tools listed
 * first, it cost DeepSeek a quarter of the prefix and GLM all of it (docs/architecture/tool-loading.md).
 */
export const toolOrderFor = (all: string[], deferrable: ReadonlySet<string>, loaded: ReadonlySet<string>, pageNames: ReadonlySet<string> = new Set()): string[] => {
  const present = new Set(all)
  const alwaysOn = all.filter(name => !deferrable.has(name) || pageNames.has(name))
  const loadedInOrder = [...loaded].filter(name => present.has(name) && deferrable.has(name) && !pageNames.has(name))
  return [...alwaysOn, ...loadedInOrder]
}

export const notLoadedMessage = (name: string): string =>
  `Tool ${name} is not loaded, so it did not run. Load it first with ${LOAD_TOOLS_TOOL_NAME}({ "names": ["${name}"] }), then call it at your next step.`

/**
 * THE TOOLS A RUN WAS OFFERED, as the model got them: name, description and input schema.
 *
 * The run's calls record the offered tool NAMES; a reviewer, or an agent analysing an exported transcript, also
 * needs what the model was told about each tool, since a description is as much a part of the prompt as the
 * system prompt. Stored once per distinct set, keyed by its content hash: most runs of an agent are offered the
 * same set, and task runs accumulate with no retention limit, so a copy per run would be most of the run's size.
 * A set is never rewritten (its key is its content) and not purged: the distinct sets are few, they hold no
 * personal data, and a reader resolving an old run's key must still find it.
 */
import { createHash } from 'node:crypto'
import { asSchema, type Tool } from 'ai'
import mongo from '#mongo'

export interface ToolDefinition {
  name: string
  description?: string
  inputSchema?: unknown
}

export interface ToolDefinitionsDocument {
  _id: string
  tools: ToolDefinition[]
  createdAt: string
}

/** One tool as the provider is given it: its description and the JSON schema of its input. */
export const toolDefinitionOf = async (name: string, tool: Tool): Promise<ToolDefinition> => {
  let inputSchema: unknown
  try {
    inputSchema = tool.inputSchema ? await asSchema(tool.inputSchema as any).jsonSchema : undefined
  } catch {
    // A schema that cannot be rendered is recorded as absent rather than failing the run's record.
    inputSchema = undefined
  }
  // A description can be computed per call (AI SDK 7); none of ours is, and a computed one is said to be.
  const description = typeof tool.description === 'function' ? '[computed for each call]' : tool.description
  return { name, ...(description ? { description } : {}), ...(inputSchema !== undefined ? { inputSchema } : {}) }
}

/** The set's key: the hash of its content, sorted by name so the same set has the same key. */
export const toolDefinitionsKey = (tools: ToolDefinition[]): string =>
  `tools-${createHash('sha256').update(JSON.stringify([...tools].sort((a, b) => a.name.localeCompare(b.name)))).digest('hex').slice(0, 32)}`

/** Stores the set if it is new; returns its key. */
export const saveToolDefinitions = async (tools: ToolDefinition[]): Promise<string> => {
  const sorted = [...tools].sort((a, b) => a.name.localeCompare(b.name))
  const key = toolDefinitionsKey(sorted)
  await mongo.toolDefinitions.updateOne(
    { _id: key },
    { $setOnInsert: { tools: sorted, createdAt: new Date().toISOString() } },
    { upsert: true }
  )
  return key
}

/** The sets these runs reference, by key: what the review page and the export resolve `toolDefinitionsRef` with. */
export const readToolDefinitions = async (runs: Array<{ toolDefinitionsRef?: string }>): Promise<Record<string, ToolDefinition[]>> => {
  const keys = [...new Set(runs.map(run => run.toolDefinitionsRef).filter((key): key is string => !!key))]
  if (!keys.length) return {}
  const docs = await mongo.toolDefinitions.find({ _id: { $in: keys } }).toArray()
  return Object.fromEntries(docs.map(doc => [doc._id, doc.tools]))
}

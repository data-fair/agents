/**
 * The `memory` tool, as an AI SDK tool bound to one store and one author.
 *
 * Used by the turn (author: the run's tool call) and by consolidation (author: the consolidation). A refusal is THROWN, so the call is stored `output-error` and the model is handed
 * the reason as error text — a refused write must not look like a successful one.
 */
import { tool, jsonSchema, type Tool } from 'ai'
import type { AccountKeys } from '@data-fair/lib-express'
import { MEMORY_TOOL_DESCRIPTION, memoryToolInputSchema, type MemoryAuthor } from './operations.ts'
import { executeMemoryCommand } from './service.ts'

export const createMemoryTool = (opts: {
  storeId: string
  owner: AccountKeys
  allowDelete: boolean
  author: (toolCallId?: string) => MemoryAuthor
}): Tool => tool({
  description: MEMORY_TOOL_DESCRIPTION,
  inputSchema: jsonSchema(memoryToolInputSchema as any),
  execute: async (args: any, { toolCallId }: { toolCallId?: string }) =>
    await executeMemoryCommand(opts.storeId, opts.owner, args, opts.author(toolCallId), { allowDelete: opts.allowDelete })
})

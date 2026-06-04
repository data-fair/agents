import { generateText, tool, jsonSchema } from 'ai'
import type { Tool, LanguageModel } from 'ai'

/** Build a compact "name: one-line description" catalog of the given tools. */
export function buildToolCatalog (plainTools: Record<string, Tool>): string {
  return Object.entries(plainTools)
    .map(([name, t]) => {
      const desc = ((t as any).description ?? '').split('\n')[0].trim()
      return `- ${name}: ${desc}`
    })
    .join('\n')
}

export const EXPLORE_TOOL_NAME = 'explore_tools'
export const SELECT_TOOL_NAME = 'select_tools'

/** Fold the tool-name catalog and the explore instruction into the system text. */
export function buildExplorationSystem (baseSystem: string | undefined, catalog: string): string {
  const instruction = 'The tools listed below are available on this page but are NOT directly callable yet. ' +
    `To use one, first call \`${EXPLORE_TOOL_NAME}\` with your intent; it will make the relevant tools callable.\n\n` +
    `Available tools:\n${catalog}`
  return baseSystem ? `${baseSystem}\n\n${instruction}` : instruction
}

/** Filter requested tool names to those that actually exist, de-duplicated, order-preserving. */
export function selectPromotions (requestedNames: string[], availableNames: string[]): string[] {
  if (!Array.isArray(requestedNames)) return []
  const available = new Set(availableNames)
  const seen = new Set<string>()
  const out: string[] = []
  for (const name of requestedNames) {
    if (available.has(name) && !seen.has(name)) {
      seen.add(name)
      out.push(name)
    }
  }
  return out
}

/**
 * Build the always-on exploration tool. Its execute runs the summarizer over the
 * full plain-tool registry, forces a `select_tools` call to get structured output,
 * then promotes the chosen tools via the `promote` callback.
 */
export function createExploreTool (opts: {
  plainTools: Record<string, Tool>
  promote: (names: string[]) => void
  summarizer: LanguageModel
  headers?: Record<string, string>
}): Tool {
  const { plainTools, promote, summarizer, headers } = opts
  return tool({
    description: 'Discover and activate the page tools relevant to a task. ' +
      'Call this with your intent before attempting to use any page tool.',
    inputSchema: jsonSchema({
      type: 'object',
      properties: {
        intent: { type: 'string', description: 'What you are trying to do, in one sentence.' }
      },
      required: ['intent']
    }),
    execute: async (args: any) => {
      const intent = String(args?.intent ?? '')
      const candidates = Object.entries(plainTools)
        .map(([name, t]) => `${name}: ${((t as any).description ?? '').split('\n')[0].trim()}`)
        .join('\n')

      let chosen: string[] = []
      let summary = ''
      try {
        const result = await generateText({
          model: summarizer,
          system: 'You select which page tools are relevant to the user intent. ' +
            'Call select_tools with the names of the relevant tools and a one-sentence summary.',
          messages: [{
            role: 'user' as const,
            content: `Intent: ${intent}\n\n<candidate-tools>\n${candidates}\n</candidate-tools>`
          }],
          tools: {
            [SELECT_TOOL_NAME]: tool({
              description: 'Report which candidate tools are relevant and a short summary.',
              inputSchema: jsonSchema({
                type: 'object',
                properties: {
                  summary: { type: 'string' },
                  toolNames: { type: 'array', items: { type: 'string' } }
                },
                required: ['summary', 'toolNames']
              })
            })
          },
          toolChoice: { type: 'tool', toolName: SELECT_TOOL_NAME },
          ...(headers ? { headers } : {})
        })
        const input = (result.toolCalls?.[0]?.input ?? {}) as { summary?: string, toolNames?: string[] }
        chosen = selectPromotions(input.toolNames ?? [], Object.keys(plainTools))
        summary = input.summary ?? ''
      } catch {
        chosen = []
      }

      promote(chosen)
      if (chosen.length === 0) return summary || 'No matching tools were found for that intent.'
      return `${summary ? summary + '\n' : ''}Now available: ${chosen.join(', ')}`
    }
  })
}

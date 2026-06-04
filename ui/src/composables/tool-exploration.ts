import type { Tool } from 'ai'

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

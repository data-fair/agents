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

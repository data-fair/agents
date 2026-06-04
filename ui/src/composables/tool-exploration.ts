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

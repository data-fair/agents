import type { SimulationCase } from './types.ts'

/**
 * Select cases by name, or all of them when no name is given. Throws on an
 * unknown name rather than silently running a subset — a typo that quietly
 * runs nothing is worse than an error.
 *
 * Generic in the case type so a host repo's own case fields (added on top of
 * SimulationCase) survive the round trip through this function.
 */
export function selectCases <T extends SimulationCase> (all: T[], names: string[]): T[] {
  if (names.length === 0) return all
  return names.map(name => {
    const found = all.find(c => c.name === name)
    if (!found) throw new Error(`unknown simulation case: ${name} (have: ${all.map(c => c.name).join(', ')})`)
    return found
  })
}

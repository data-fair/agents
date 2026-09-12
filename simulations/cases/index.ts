/**
 * What a case is: a page with real WebMCP tools, a person, and something they
 * want. There is deliberately NO expected result — a run is judged by reading
 * its transcript, not by diffing its output against a blob written by whoever
 * wrote the case.
 *
 * Routes point at ui/src/pages/_dev/*, which register the same tools through
 * the same WebMCP path a host application uses.
 */

export type SimulationCase = {
  /** Evidence files are named after this; keep it filesystem-safe. */
  name: string
  route: string
  /** Who the simulated user is. Becomes its system prompt. */
  persona: string
  /** What they came for, in their own words. */
  goal: string
  /** Give up after this many user turns; the judge sees how far it got. */
  maxTurns: number
}

export const cases: SimulationCase[] = [
  {
    name: 'air-quality',
    route: '/agents/_dev/chat-subagent',
    persona: 'You are an environmental officer at a mid-sized French city. You are comfortable with data but you are not a programmer, you do not know what a "schema" or an "aggregation" is, and you will not use those words. You are busy and you ask for what you want in plain language.',
    goal: 'You want to know which monitoring station has the worst PM2.5 air quality, and you want that answer shown on the screen so you can point at it in a meeting this afternoon.',
    maxTurns: 8
  },
  {
    name: 'register-person',
    route: '/agents/_dev/chat-vjsf',
    persona: 'You are an administrative assistant entering records into a form you have never seen before. You do not know what fields it has. You give information the way a person would — a little at a time, and not always in the order the form wants it.',
    goal: 'You need to record a new person: Marie Dupont, 34 years old, and her account should be active. You want to see the form actually filled in, not just be told it was done.',
    maxTurns: 6
  },
  {
    name: 'open-panel',
    route: '/agents/_dev/chat-live-tools',
    persona: 'You are a product manager poking at an internal tool. You are impatient, you describe outcomes rather than steps, and if something does not visibly happen you say so.',
    goal: 'You want some text of your choosing displayed in the panel on the page. The panel starts closed, so it has to be opened before anything can be shown there.',
    maxTurns: 6
  }
]

export function findCases (names: string[]): SimulationCase[] {
  if (names.length === 0) return cases
  return names.map(name => {
    const found = cases.find(c => c.name === name)
    if (!found) throw new Error(`unknown simulation case: ${name} (have: ${cases.map(c => c.name).join(', ')})`)
    return found
  })
}

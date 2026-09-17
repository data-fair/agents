/**
 * What a case is: a page with real WebMCP tools, a person, and something they
 * want. There is deliberately NO expected result — a run is judged by reading
 * its transcript, not by diffing its output against a blob written by whoever
 * wrote the case.
 *
 * Routes point at ui/src/pages/_dev/*, which register the same tools through
 * the same WebMCP path a host application uses.
 */

import type { SimulationCase } from '@data-fair/lib-agents-sim'

// The package's SimulationCase stays primitives-only; embedded is host-specific
// wiring (whether the chat runs inside an iframe) that only this repo's runner
// needs to know about.
export type LocalCase = SimulationCase & { embedded?: boolean }

export const cases: LocalCase[] = [
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
  },
  {
    name: 'iframe-set-data',
    route: '/agents/_dev/chat-iframe',
    persona: 'You are an office worker who has been given a link to an internal tool and told it can fill things in for you. You have no idea how it works underneath and no interest in finding out. You say what you want in plain words and you expect to see it happen.',
    goal: 'You want the text "Hello from the iframe" put into the data box on the page. You want to see it actually appear there, not just be told it was done.',
    maxTurns: 5,
    embedded: true
  },
  // The hand-back: the assistant guides the person to Create, they press it themselves,
  // and then they ask what the page shows now. What is under test is the assistant
  // answering from events the person caused, without having to be asked what changed.
  // Events are folded into the next user turn's hidden context; the assistant reads them
  // from the page's state rather than the person telling it again. The persona acts only
  // between runner turns (not during an assistant turn), so wait_for_user_action always
  // times out to "press Create whenever you're ready" — the same-turn resume is the job of
  // tests/features/host-events/3.host-events.e2e.spec.ts. Handing back is the intended
  // behaviour, not a stall.
  {
    name: 'workflow-hand-back',
    route: '/agents/_dev/chat-workflow',
    persona: 'You are an office worker using an internal tool for the first time. You are not technical, you describe what you want in plain words, and you press buttons yourself when someone tells you which one. You expect to be told what happened without having to ask.',
    goal: 'You want a list called "Weekly groceries" set up. You will press the Create button yourself when the assistant says it is ready. Once you have, you want to ask the assistant what you are looking at now, and you expect it to already know what was created rather than asking you.',
    maxTurns: 6
  }
]

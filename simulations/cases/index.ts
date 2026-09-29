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
  //
  // The persona still acts only between runner turns — their tools exist inside
  // nextUserMessage and nowhere else — but a declared wait no longer has to time
  // out for them to get their chance: the driver reports an armed wait as the turn
  // handing control back, the runner lets them act, and the wait resolves on what
  // they did. So the same-turn resume is now reachable here and not only in
  // tests/features/host-events/3.host-events.e2e.spec.ts. If the assistant instead
  // spends the whole window and falls back to "press Create whenever you're ready",
  // that is now a finding rather than the expected shape.
  {
    name: 'workflow-hand-back',
    route: '/agents/_dev/chat-workflow',
    persona: 'You are an office worker using an internal tool for the first time. You are not technical, you describe what you want in plain words, and you press buttons yourself when someone tells you which one. You expect to be told what happened without having to ask.',
    goal: 'You want a list called "Weekly groceries" set up. You will press the Create button yourself when the assistant says it is ready. Once you have, you want to ask the assistant what you are looking at now, and you expect it to already know what was created rather than asking you.',
    maxTurns: 6
  },
  {
    // Drives an autonomous agent's own thread page rather than an in-page chat: a different composer
    // and a different end-of-turn signal, same transcript component underneath.
    name: 'autonomous-agent-tool-use',
    // Needs `npm run dev-mcp` (the agent's tools). The agent itself is seeded by the runner, on the
    // TEST org: pointing at dev1's hand-review fixture would run on the mock model its settings map
    // to, and seeding the bridge over those would break the fixtures a human reviews by hand.
    // test1-user1 is a LISTED INSTRUCTOR, not an admin — the realistic shape, and the one that
    // exercises the grant. An org admin could not be used anyway: the login fixture derives the
    // address as `<id>@test.com`, which test1's admin has but dev1's two (albanm, dmeadus0) do not.
    route: '/agents/organization/test1/autonomous-agents/test-fixture',
    surface: 'autonomous-agent',
    user: 'test1-user1',
    persona: 'You are an operations manager at a mid-sized French city. You are comfortable asking for outcomes but you have never heard of MCP, tools, or schemas, and you will not use those words. You say what you need in plain language and you expect the assistant to do the work.',
    // Reachable ON PURPOSE, and verifiable: `list_road_closures` really does return rows for the city
    // centre, so an agent that refuses, paraphrases or invents is distinguishable from one that calls
    // it and quotes it. The first version of this case asked for something no tool behind this agent
    // could produce, which made it a second copy of `autonomous-agent-cannot-answer` — a good agent and
    // a broken one both ended at "I can't do this". The named streets and dates are the tell.
    goal: 'You want the current road closures for the city centre, with the streets and the dates, concrete enough to paste into an email to the department heads. A summary of what the agent could do in principle is not what you asked for — if you get one, push back and ask for the actual list.',
    maxTurns: 6
  },
  {
    // The other half of "uses its tools and reports usefully": what it does when it cannot.
    name: 'autonomous-agent-cannot-answer',
    route: '/agents/organization/test1/autonomous-agents/test-fixture',
    surface: 'autonomous-agent',
    user: 'test1-user1',
    persona: 'You are a finance officer who assumes any assistant can look anything up. You are polite but persistent, and you dislike vague answers.',
    goal: 'You want last quarter\'s energy spend for the city fleet, which this agent has no access to. What you actually need is to find out quickly and plainly that it cannot get this, so you can go elsewhere — an answer that sounds confident but is invented is the worst outcome for you.',
    maxTurns: 5
  }
]

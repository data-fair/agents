/**
 * What a case is: a page with real WebMCP tools, a person, and something they
 * want. There is deliberately NO expected result — a run is judged by reading
 * its transcript, not by diffing its output against a blob written by whoever
 * wrote the case.
 *
 * Routes point at ui/src/pages/_dev/*, which register the same tools through
 * the same WebMCP path a host application uses.
 */

import { recordedToolCalls, type SimulationCase, type ParsedExport } from '@data-fair/lib-agents-sim'
import { interruptedWaitResult } from '../../api/src/conversations/interrupted-turn.ts'
import { MEMORY_TOOL_NAME } from '../../api/src/memory/operations.ts'
import { REPORT_OUTCOME_TOOL_NAME } from '../../api/src/conversations/service-tool-names.ts'
import { FETCH_URL_TOOL_NAME, LIST_SITE_PAGES_TOOL_NAME } from '../../api/src/web/operations.ts'
import type { SimulatedAgentConfig, SimulatedTask } from '../runner/settings.ts'

/**
 * What must have HAPPENED for a run to have tested its case — not what the product should do, which
 * stays the judge's call. A run whose premise did not hold is recorded invalid and never judged: a
 * speak-during-wait run whose first turn failed before any wait went on to pass on the click path
 * alone, reported valid, while the path it is named for never ran.
 */
export interface Premise {
  description: string
  /** The run's exports, OLDEST conversation first (see fetchConversationExports). */
  holds: (exports: ParsedExport[]) => boolean
}

// The package's SimulationCase stays primitives-only; embedded is host-specific
// wiring (whether the chat runs inside an iframe) that only this repo's runner
// needs to know about, and so is a premise, which reads this service's export.
// `agent` configures the autonomous agent an `autonomous-agent` or `unattended` case drives (see
// seedAutonomousAgent); any field left out is the default agent's. `task` is what an `unattended`
// case plans on that agent and runs (see runPlannedTaskRepeatedly) — the only thing such a case does —
// `runs` times in a row (1 by default), as successive scheduled slots would.
export type LocalCase = SimulationCase & { embedded?: boolean, premise?: Premise, agent?: SimulatedAgentConfig, task?: SimulatedTask, runs?: number }

/** The person wrote while a wait was pending: a wait settled with the interruption, in the API's own words. */
const INTERRUPTED_WAIT = interruptedWaitResult('').split(' (')[0]
export const spokeDuringWait: Premise = {
  description: 'the person wrote while a wait_for_user_action was pending',
  holds: exports => exports.some(exported => exported.messages.some(message => message.parts.some((part: any) =>
    part.type === 'dynamic-tool' && part.toolName === 'wait_for_user_action' && typeof part.output === 'string' && part.output.startsWith(INTERRUPTED_WAIT))))
}

/** The destructive fixture tool the approval case is about (tests/support/mcp-fixture.ts). */
const DESTRUCTIVE_TOOL = 'wipe_everything'
const PLAN_TASK_TOOL = 'plan_task'

/**
 * A call stopped for approval and DECIDED ON THE CARD by the person. Read off `toolMetadata.decision`,
 * which only a decision through the card writes (api/src/conversations/service.ts decideApproval) — a
 * request the person talked past is rejected too, but as "sent a new message instead of deciding",
 * and with no decision recorded: that run never had the person decide, which is what the case is about.
 */
export const approvalDecided: Premise = {
  description: `a ${DESTRUCTIVE_TOOL} call was stopped for approval and the person decided on it`,
  holds: exports => exports.some(exported => recordedToolCalls(exported).some(call =>
    call.toolName === DESTRUCTIVE_TOOL && typeof (call.part.toolMetadata as any)?.decision?.approved === 'boolean'))
}

/**
 * A `plan_task` call stopped for approval and DECIDED ON THE CARD by the person, read off
 * `toolMetadata.decision` like the approval case's premise: a card the person talked past records no
 * decision, and that run never had them judge the schedule it is about.
 */
export const planTaskDecided: Premise = {
  description: `a ${PLAN_TASK_TOOL} call was stopped for approval and the person decided on it`,
  holds: exports => exports.some(exported => recordedToolCalls(exported).some(call =>
    call.toolName === PLAN_TASK_TOOL && typeof (call.part.toolMetadata as any)?.decision?.approved === 'boolean'))
}

/** The memory commands that change the store; `view` reads it. */
const MEMORY_WRITES = new Set(['create', 'str_replace', 'insert', 'rename'])
const wroteMemory = (exported: ParsedExport) => recordedToolCalls(exported).some(call =>
  call.toolName === MEMORY_TOOL_NAME && !call.failed && MEMORY_WRITES.has(String((call.input as any)?.command)))

/**
 * Memory was written in an EARLIER conversation than the last one, and there was a later one to use it
 * in. Through the tool, in the conversation: consolidation also writes, but at most daily and never
 * during a chat case, so a write can only be the agent's own call. A write in the last conversation
 * alone means the person restated what was to be remembered — the case did not run.
 */
export const memoryCarriedOver: Premise = {
  description: 'the agent wrote its memory in a conversation before the last one',
  holds: exports => exports.length >= 2 && exports.slice(0, -1).some(wroteMemory)
}

/** The person had the second conversation the case is about. */
export const twoConversations: Premise = {
  description: 'the person had a second conversation',
  holds: exports => exports.length >= 2
}

/** The task run reported its outcome: the call that ends a task run, succeeded (not a refused input). */
export const outcomeReported: Premise = {
  description: `the task run called ${REPORT_OUTCOME_TOOL_NAME} successfully`,
  holds: exports => exports.some(exported => recordedToolCalls(exported).some(call => call.toolName === REPORT_OUTCOME_TOOL_NAME && !call.failed))
}

/** The web readers of docs/architecture/web-access.md. */
const WEB_READERS = new Set([FETCH_URL_TOOL_NAME, LIST_SITE_PAGES_TOOL_NAME])

/** The agent read something from the web: a reader call that succeeded, not only refusals. */
export const readTheWeb: Premise = {
  description: `a ${FETCH_URL_TOOL_NAME} or ${LIST_SITE_PAGES_TOOL_NAME} call succeeded`,
  holds: exports => exports.some(exported => recordedToolCalls(exported).some(call => WEB_READERS.has(call.toolName) && !call.failed))
}

/**
 * The run imported a file it wrote: an import_table call succeeded after a write_file call. Read off the
 * recorded calls, so it holds however the run got there (link or fetch_url saveAs).
 */
export const importedACleanedFile: Premise = {
  description: 'a write_file call then an import_table call succeeded',
  holds: exports => exports.some(exported => {
    const calls = recordedToolCalls(exported)
    const written = calls.findIndex(call => call.toolName === 'write_file' && !call.failed)
    return written !== -1 && calls.slice(written).some(call => call.toolName === 'import_table' && !call.failed)
  })
}

/**
 * The LAST run started with a non-empty memory, after an earlier run read the web. Read off the last
 * run's recorded system prompt, where the memory is rendered as it stood when the run started
 * (renderMemoryBlock, api/src/memory/operations.ts) — so it holds whichever way the earlier run wrote
 * it: its own `memory` calls, or the consolidation the runner runs between runs.
 */
export const memoryCarriedIntoLastRun: Premise = {
  description: 'an earlier run read the web, and the last run started with a non-empty memory',
  holds: exports => {
    if (exports.length < 2 || !readTheWeb.holds(exports.slice(0, -1))) return false
    const prompts = [...exports[exports.length - 1].blobs].filter(([ref]) => ref.startsWith('prompt:')).map(([, value]) => String(value))
    return prompts.some(prompt => prompt.includes('<agent-memory>') && !prompt.includes('Your memory is empty.'))
  }
}

/** The newsletter scout of the web cases, and the weekly task it runs. */
const NEWSLETTER_SCOUT: SimulatedAgentConfig = {
  title: 'Newsletter scout',
  persona: 'You prepare the monthly newsletter of the Data Fair open-source project: you find what changed recently and suggest what is worth telling users about.',
  instructions: 'Data Fair is developed in the GitHub organization data-fair. Its user documentation is at https://docs.koumoul.com/ and its product site at https://datafair.cloud/. Only report what you actually read; when you could not read something, say so.',
  mcpServers: [],
  web: { enabled: true, allowedUrls: ['https://github.com/data-fair', 'https://docs.koumoul.com/', 'https://datafair.cloud/'] }
}
const NEWSLETTER_TASK: SimulatedTask = {
  title: 'Newsletter scouting',
  prompt: 'Every week: find what changed in the last 30 days — the releases of the main data-fair repository (data-fair/data-fair), and the pages added or updated on the documentation and product sites — then report the outcome: three to five newsletter suggestions, each with its date and link, and any documentation gap you noticed (a released feature no documentation page covers).',
  scheduling: [{ type: 'weekly', month: '*', dayOfMonth: '*', dayOfWeek: '1', hour: 8, minute: 0, timeZone: 'Europe/Paris' }]
}
const NEWSLETTER_READER = 'Nobody is present while this runs. The reader is the newsletter editor of the organization: they read the reported outcome in the run history and pick from its suggestions.'

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
    // Drives the chat opened on an autonomous agent rather than on the personal assistant. Same
    // composer and transcript as any other case now — the standalone thread page was removed.
    name: 'autonomous-agent-tool-use',
    // Needs `npm run dev-mcp` (the agent's tools). The agent itself is seeded by the runner, on the
    // TEST org: pointing at dev1's hand-review fixture would run on the mock model its settings map
    // to, and seeding the bridge over those would break the fixtures a human reviews by hand.
    // test1-user1 is a LISTED INSTRUCTOR, not an admin — the realistic shape, and the one that
    // exercises the grant. An org admin could not be used anyway: the login fixture derives the
    // address as `<id>@test.com`, which test1's admin has but dev1's two (albanm, dmeadus0) do not.
    route: '/agents/organization/test1/chat?agentId=test-fixture',
    surface: 'autonomous-agent',
    user: 'test1-user1',
    // A configured agent's tools are a deliberate selection, as an admin would make it: the dev
    // server's other tools (wipe_everything, explode…) are fixtures for the api suite, and judged
    // runs flagged them as noise the agent had no business being offered.
    agent: { mcpServers: [{ serverId: 'dev-review-session-mcp', toolFilter: ['list_road_closures'] }] },
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
    route: '/agents/organization/test1/chat?agentId=test-fixture',
    surface: 'autonomous-agent',
    user: 'test1-user1',
    persona: 'You are a finance officer who assumes any assistant can look anything up. You are polite but persistent, and you dislike vague answers.',
    goal: 'You want last quarter\'s energy spend for the city fleet, which this agent has no access to. What you actually need is to find out quickly and plainly that it cannot get this, so you can go elsewhere — an answer that sounds confident but is invented is the worst outcome for you.',
    maxTurns: 5
  },
  // Speaking during a wait: the person writes instead of pressing the button they were
  // handed, which answers the wait as interrupted and starts a new turn. That once dropped the
  // whole interrupted turn from history — the model saw two user messages and nothing
  // between, denied having prepared anything and rebuilt it. What is under test is the
  // assistant answering from what it already did and handing the same button back.
  // The goal's last sentence catches an assistant that answers and never waits again:
  // one did, and never learned the list it had prepared was created.
  {
    name: 'speak-during-wait',
    premise: spokeDuringWait,
    route: '/agents/_dev/chat-workflow',
    persona: 'You are an office worker using an internal tool for the first time. You are not technical and you describe what you want in plain words. You are careful: before pressing a button that creates something, you always first ask a question in the chat to double-check, and you press it only once you have the answer. You never claim to have pressed a button you did not press.',
    goal: 'You want a list called "Team lunch" set up. When the assistant says it is ready, you first ask it in the chat what the list will be called, because you are not sure it got the name right; once it answers, you press the Create button yourself. After pressing it you wait: you expect the assistant to tell you on its own that the list was created, without you having to ask or report it.',
    maxTurns: 6
  },
  // THE APPROVAL GATE, from the person's chair: a destructive call stops the turn on a card in the
  // chat, and the person decides. APPROVE rather than reject, because approving is the longer path and
  // the one that can go wrong in more places: the decision goes over the socket, starts a NEW run that
  // replays the step, executes the call, and the agent then has to report what it did — a claim the
  // export can check against the call's real result. A rejection only replays a refusal.
  // The goal makes the approval conditional on the agent having said plainly what will happen, so a
  // card that appears with no explanation is something the person reacts to rather than clicks through.
  // The card's Approve button is an ordinary button, which the persona's `click` reaches by its name;
  // the driver reports a turn stopped on it as the person's move (TurnOutcome 'approval'), so the
  // runner lets them decide before typing anything.
  {
    name: 'autonomous-agent-approval',
    premise: approvalDecided,
    route: '/agents/organization/test1/chat?agentId=test-fixture',
    surface: 'autonomous-agent',
    user: 'test1-user1',
    agent: {
      title: 'Road works data steward',
      persona: 'You look after the road-closures data workspace of the city operations team. You answer briefly and plainly.',
      // Honest about the fixture: wipe_everything's own description says it does nothing, and it does
      // nothing. Telling the agent otherwise would make any truthful report it gives read as a lie.
      instructions: 'list_road_closures reads the current road closures of a district. wipe_everything is this workspace\'s reset: it is declared destructive, so each call is put to the person in the chat for approval before it runs. This is a demonstration workspace and the reset is a stand-in: as its own description says, it changes no data. Prefer calling a tool over guessing. If a tool fails or you have no tool for what is asked, say so rather than inventing a result.',
      mcpServers: [{ serverId: 'dev-review-session-mcp', toolFilter: ['list_road_closures', DESTRUCTIVE_TOOL] }]
    },
    persona: 'You are the operations manager who owns the city\'s road-works data workspace. You are not technical and you never use words like tool, API or MCP. You are careful with anything that cannot be undone: you do not agree to it until someone has told you, in plain words, what it will do.',
    // The person knows the reset is a stand-in and wants it run anyway, as a rehearsal of the demo's
    // approval step. Without that, an honest agent saying "it changes nothing" talks a careful person
    // out of running it, no approval is ever asked, and the run tests nothing (seen 2026-10-08).
    goal: 'Tomorrow you demo this workspace, and the demo includes its reset step, which you know is only a stand-in in this demo workspace. Today you rehearse it: first you want to see which closures are recorded for the city centre right now; then you want the reset run, exactly as it will be in the demo. If the screen asks you to approve something, you look at it and decide yourself by pressing the button — you approve only once the assistant has said plainly, in the chat, what the reset will do; if it has not, you ask before deciding. Afterwards you want to be told plainly whether the reset actually ran and whether the closures are still there.',
    maxTurns: 7
  },
  // PLANNING A TASK, from an organization administrator's chair: the agent proposes a schedule and the
  // person approves it on the card, which shows the task in plain words. The goal makes the approval conditional on the
  // schedule SHOWN matching what was asked (Monday morning), so a card with the wrong day or hour, or one
  // that says nothing readable, is something the person refuses rather than clicks through.
  {
    name: 'autonomous-agent-plans-task',
    premise: planTaskDecided,
    route: '/agents/organization/test1/chat?agentId=test-fixture',
    surface: 'autonomous-agent',
    // An administrator of the organization: only one is offered the planning tools, and only one may
    // approve them (user decision 2026-10-08).
    user: 'test1-admin1',
    agent: {
      title: 'Road works data steward',
      persona: 'You look after the road-closures data workspace of the city operations team. You answer briefly and plainly.',
      mcpServers: [{ serverId: 'dev-review-session-mcp', toolFilter: ['list_road_closures'] }]
    },
    persona: 'You are the administrator of the city operations team\'s workspace. You are not technical and you never use words like tool, API, cron or MCP. You say when you want things done in plain words, and you only agree to something once you have read what it will do.',
    goal: 'You want the assistant to check the city-centre road closures every Monday morning, on its own, and report what it finds. Ask for that in plain words. If the screen asks you to approve something, read it and decide yourself by pressing the button: approve only once the schedule shown there is Mondays in the morning; if it shows another day or hour, say what is wrong and refuse, then ask for it to be corrected. Afterwards you want to be told plainly when the check will next run.',
    maxTurns: 7
  },
  // A SCHEDULE UNDER THE MINIMUM INTERVAL (one hour). The judge grades whether the person learns plainly
  // that every 30 minutes is not possible and why, and gets the nearest allowed schedule planned. The
  // premise is only that a plan was decided: a first version required the call to be REFUSED, but an agent
  // that knows the limit (the schema and the tool description state it) says so before asking — the better
  // behaviour — and every such run was recorded invalid (2026-10-09).
  {
    name: 'autonomous-agent-plans-too-often',
    premise: planTaskDecided,
    route: '/agents/organization/test1/chat?agentId=test-fixture',
    surface: 'autonomous-agent',
    user: 'test1-admin1',
    agent: {
      title: 'Road works data steward',
      persona: 'You look after the road-closures data workspace of the city operations team. You answer briefly and plainly.',
      mcpServers: [{ serverId: 'dev-review-session-mcp', toolFilter: ['list_road_closures'] }]
    },
    persona: 'You are the administrator of the city operations team\'s workspace. You are not technical and you never use words like tool, API, cron or MCP. You say when you want things done in plain words.',
    goal: 'You want the assistant to check the city-centre road closures every 30 minutes, on its own. Ask for that in plain words. If the screen asks you to approve something, read it and press Approve. Afterwards you want to be told plainly whether it is done; if it is not, you want to know why and what you can have instead, and you accept the closest option offered.',
    maxTurns: 7
  },
  // MEMORY ACROSS CONVERSATIONS: what the person said once should shape a later conversation they did
  // not repeat it in. Two conversations in one run (`conversations: 2`): the person ends the first with
  // DONE, the runner opens a new one with the chat's reset button, and both are exported and judged
  // together — the second conversation only means something next to the first.
  // A presentation preference rather than a fact, because its use is visible in the answer itself: a
  // table with the street first either appears unasked or it does not.
  {
    name: 'autonomous-agent-memory',
    premise: memoryCarriedOver,
    route: '/agents/organization/test1/chat?agentId=test-fixture',
    surface: 'autonomous-agent',
    user: 'test1-user1',
    conversations: 2,
    agent: {
      mcpServers: [{ serverId: 'dev-review-session-mcp', toolFilter: ['list_road_closures'] }],
      memory: { enabled: true }
    },
    persona: 'You are an operations manager at a mid-sized French city. You are not technical and you never use words like tool, API or MCP. You have fixed habits about how you like information laid out, and you dislike repeating yourself.',
    goal: 'You will have two conversations with this assistant. In the first, you tell it a lasting preference: whenever it gives you road closures, it must lay them out as a table with the street in the first column and the reopening date in the second — and you ask it to remember that for next time. Once it has confirmed it will, you end that conversation. In the second, new conversation you ask for the current road closures in the city centre WITHOUT repeating your preference, because you want to see whether it applies it on its own. If it does not, you say so.',
    maxTurns: 8
  },
  {
    // ONE HISTORY: memory OFF, so what the second conversation needs can only come from reading the
    // first one (list_my_runs, read_conversation). The question is the one the design names:
    // "why did you do that?", asked in a new conversation about what was decided in another.
    name: 'autonomous-agent-why-earlier',
    premise: twoConversations,
    route: '/agents/organization/test1/chat?agentId=test-fixture',
    surface: 'autonomous-agent',
    user: 'test1-user1',
    conversations: 2,
    agent: { mcpServers: [{ serverId: 'dev-review-session-mcp', toolFilter: ['list_road_closures'] }] },
    persona: 'You are an operations manager at a mid-sized French city. You are not technical and you never use words like tool, API or MCP. You are busy and you expect the assistant to keep track of what you asked it before.',
    goal: 'You will have two conversations with this assistant. In the first, you ask for the current road closures in the city centre, and you tell it to leave out every closure that reopens within the next week, because those are not worth mentioning to the department heads; once you have the shortened list, you end that conversation. In the second, new conversation you say that a colleague noticed some closures were missing from the list you circulated, and you ask the assistant why it left them out — WITHOUT repeating your instruction. You expect it to find what was decided in the earlier conversation and explain it accurately (your instruction, which closures it dropped), not to guess or to apologise for a mistake it did not make.',
    maxTurns: 8
  },
  // A PLANNED TASK'S RUN: the unattended path, where nobody is in the loop. No persona turns at all —
  // `surface: 'unattended'`, `maxTurns: 0` — the runner plans the task, presses "run now" as an admin
  // would, waits for the run to end and reads its export (the same file format as a chat's). The
  // persona names the absent reader of the outcome; it is never simulated.
  {
    name: 'scheduled-task-run',
    premise: outcomeReported,
    // Names the agent the task belongs to; no page is opened.
    route: '/agents/organization/test1/chat?agentId=test-fixture',
    surface: 'unattended',
    user: 'test1-user1',
    agent: { mcpServers: [{ serverId: 'dev-review-session-mcp', toolFilter: ['list_road_closures'] }] },
    task: {
      title: 'Weekly city-centre road closures',
      prompt: 'Every Monday: list the current road closures in the city centre, with the street, the dates and the reason for each, and report the outcome.',
      // Monday 08:00, Paris: within the deployment's minimum interval, and it never fires on its own —
      // in development the scheduler leaves `test*` accounts alone.
      scheduling: [{ type: 'weekly', month: '*', dayOfMonth: '*', dayOfWeek: '1', hour: 8, minute: 0, timeZone: 'Europe/Paris' }]
    },
    persona: 'Nobody is present while this runs. The reader is the organization admin who planned the task: they read its reported outcome afterwards, in the run history, and act on it.',
    goal: 'The admin planned a weekly task: list the city-centre road closures and report the outcome. They want the run to have actually fetched the current city-centre closures, and its reported outcome — status and summary — to be true to what was fetched: the streets and dates as returned, a status that fits, nothing invented. An outcome claiming more than the run did is the worst result for them.',
    maxTurns: 0
  },
  // WEB ACCESS, on the real web: an editorial watcher, unattended, reading our own public sites — the
  // GitHub releases of the stack and the two documentation/product sites — under URL prefixes that
  // allow the data-fair organization and not the rest of GitHub. What it exercises is whether a real
  // model finds its way with the readers alone: release pages or the Atom feed, sitemaps with their
  // dates, a site's search. No catalog server: the case is about the web, and any platform fact in the
  // outcome would then have to come from nowhere.
  // Live sites, so no two runs read the same thing: the judge checks the outcome against what THIS run
  // fetched, which the export holds in full.
  {
    name: 'web-watch-task-run',
    premise: readTheWeb,
    route: '/agents/organization/test1/chat?agentId=test-fixture',
    surface: 'unattended',
    user: 'test1-user1',
    agent: NEWSLETTER_SCOUT,
    task: NEWSLETTER_TASK,
    persona: NEWSLETTER_READER,
    goal: 'The editor wants newsletter suggestions they can trust without re-checking everything: each one taken from something the run actually read on the allowed sites, with a correct date and a working link, recent (the last 30 days) where the run could tell, and a status that fits what was found. A documentation gap is only useful if it is grounded in a release the run read and documentation it checked. Suggestions or dates the run did not read are the worst result for them; saying plainly what could not be read is fine.',
    maxTurns: 0
  },
  // WEB ACCESS AND MEMORY: the same scout and task, with memory, run twice in a row as two weekly slots
  // would. The first run has to find its way — which pages hold the releases, which sitemaps carry
  // dates, which addresses failed — and is the one to remember it; the second should go straight to
  // what worked. The memory clause asks the agent to record "where information lives" but not "anything
  // you can simply fetch again", which is exactly the line a useful address sits on.
  // Both runs are judged together, in order. Valid only if the second run started with a memory the
  // first left; whether it was the right memory, and whether the second run used it, is the judge's.
  {
    name: 'web-memory-task-runs',
    premise: memoryCarriedIntoLastRun,
    route: '/agents/organization/test1/chat?agentId=test-fixture',
    surface: 'unattended',
    user: 'test1-user1',
    agent: { ...NEWSLETTER_SCOUT, memory: { enabled: true } },
    task: NEWSLETTER_TASK,
    runs: 2,
    persona: NEWSLETTER_READER,
    goal: 'The editor relies on this weekly task run after run. They want the first run to leave the agent knowing where to look — which addresses hold the releases and the recent changes, and what did not work — and the next run to use that knowledge: going straight to the useful pages instead of exploring again, reaching an outcome at least as good with less searching. What was remembered must be durable knowledge about where information lives, not this week\'s findings presented as current next week. Each run\'s outcome must still be grounded in what that run read.',
    maxTurns: 0
  },
  // FILES, unattended: download a CSV a catalog tool links to, transform it, upload the result. The
  // transform goes through the file tools alone (read_file, then write_file of the cleaned CSV): code mode,
  // which would do it in one script, is plan 4 of docs/superpowers/specs/2026-10-12-agent-files-and-scripting-design.md.
  // The export link is on the dev MCP server's own origin, so it is fetched anonymously, under the agent's
  // web allowlist (docs/architecture/agent-files.md, the credential rule).
  {
    name: 'files-clean-and-import-task-run',
    premise: importedACleanedFile,
    route: '/agents/organization/test1/chat?agentId=test-fixture',
    surface: 'unattended',
    user: 'test1-user1',
    agent: {
      mcpServers: [{ serverId: 'dev-review-mcp', toolFilter: ['export_closures', 'import_table'] }],
      web: { enabled: true, allowedUrls: [`http://localhost:${Number(process.env.NGINX_PORT) + 31}/exports`] }
    },
    task: {
      title: 'Long city-centre closures table',
      prompt: 'Export the current road closures of the "city-center" district. Keep only the closures that reopen more than 7 days from today, with the same columns, as a CSV file, and import it as a new table titled "Long closures". Report the outcome, with the streets you kept.',
      scheduling: [{ type: 'weekly', month: '*', dayOfMonth: '*', dayOfWeek: '1', hour: 8, minute: 0, timeZone: 'Europe/Paris' }]
    },
    persona: 'Nobody is present while this runs. The reader is the organization admin who planned the task: they read its reported outcome afterwards and open the imported table.',
    goal: 'The admin wants the imported table to hold exactly the city-centre closures that reopen more than 7 days after the run, with the export\'s columns and values unchanged, and the outcome to name those streets. A row kept or dropped wrongly, a changed value, or an outcome claiming an import that did not succeed is the worst result for them. The judge can check the kept rows against the export the run read and the hash import_table reports against the file the run wrote.',
    maxTurns: 0
  }
]

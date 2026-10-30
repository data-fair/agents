/**
 * Chat-side consumption of host events (see docs/architecture/host-events.md).
 *
 * Retention answers "what is true now" at the moments the model has no history to
 * integrate from (first turn, after reset, after compaction). The pending buffer holds
 * what the model has not been told yet; a pending wait is answered from it by the first
 * thing the person does. Kept free of Vue and the `~` alias so the node unit runner can import it.
 */
import { tool, jsonSchema } from 'ai'
import type { Tool } from 'ai'
import type { AgentEvent } from '@data-fair/lib-vue-agents'
import { isMediaToolResult } from '@agents/shared/tool-result'
import { wrapHiddenContext } from '@agents/shared/hidden-context'
import Debug from 'debug'

const debug = Debug('df-agents:host-events')

export const RECENT_MAX = 10
// Caps against an unbounded host: a page can emit an unkeyed event per interaction
// (each detail is capped at 1000 chars, but nothing capped the *count* before this) and
// `useAgentState` retention keys are open-ended (`useAgentState(\`row-${id}\`, …)`).
// Put here, not left to a page author, so nobody has to remember them. Both drop the
// OLDEST entry once full — same FIFO discipline as RECENT_MAX's ring.
export const PENDING_MAX = 50
export const STATE_MAX_KEYS = 50
export const HOST_EVENTS_OPEN = '<host-events>'
export const HOST_EVENTS_CLOSE = '</host-events>'
export const HOST_STATE_OPEN = '<host-state>'
export const HOST_STATE_CLOSE = '</host-state>'

export interface WaitInput { message: string, expecting?: string }

/**
 * Undo a known small-model slip in wait_for_user_action's arguments: the other
 * arguments serialized into the message string. A Haiku run sent
 * {"message":"…Cliquez sur « Enregistrer ».\",\"expecting\":\"…\",\"timeoutSeconds\":300"},
 * with literal \n sequences, and the person read the JSON tail as the handover.
 * The message is cut where the swallowed arguments begin, they are recovered, and
 * literal \n become line breaks. Well-formed input comes back unchanged.
 *
 * Here, beside the tool it repairs, since the loop moved to the server: it lived in the browser's
 * stream-part builder, which no longer exists, and both the tool and the loop's rendering of the
 * handover need it.
 */
export function repairWaitInput (input: any): WaitInput {
  let message = typeof input?.message === 'string' ? input.message : ''
  const out: WaitInput = { message }
  if (typeof input?.expecting === 'string') out.expecting = input.expecting
  // `timeoutSeconds` is still recognised in a swallowed fragment, so it is cut out of the message, but
  // no longer kept: a wait has no clock (see createWaitTool).
  const cut = message.search(/"\s*,\s*"(expecting|timeoutSeconds)"\s*:/)
  if (cut !== -1) {
    try {
      // message.slice(cut + 1) is `,"expecting":"…","timeoutSeconds":300`
      const swallowed = JSON.parse('{' + message.slice(cut + 1).replace(/^\s*,/, '') + '}')
      if (out.expecting === undefined && typeof swallowed.expecting === 'string') out.expecting = swallowed.expecting
    } catch { /* keep what the message says before the fragment */ }
    message = message.slice(0, cut)
  }
  out.message = message.replace(/\\n/g, '\n').trim()
  return out
}

/**
 * The share of a message's significant words already present in a text — how much of it the text
 * already says. Words of four letters or more, any script, case folded: short words are the
 * connective tissue two phrasings of one sentence differ in.
 */
function sayingShare (message: string, text: string): number {
  const words = (value: string) => new Set(value.toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) ?? [])
  const said = words(text)
  const meant = [...words(message)]
  if (!meant.length) return 0
  return meant.filter(word => said.has(word)).length / meant.length
}

/** Above this share, the step's text already says what the message says (see waitHandover). */
export const HANDOVER_ALREADY_SAID = 0.6

/**
 * The text a wait's handover adds to the step it ends: its `message`, after what the step already
 * wrote, unless that text already says it. Null when there is nothing to add.
 *
 * The message is the model's words to the person — what is ready, what to press — and `expecting` is
 * only the status label. Before the message existed, models read the « En attente : … » label as
 * their reply and handed buttons over in silence; and a model that writes the handover as text AND
 * passes it as the message must not show it twice.
 *
 * "Already says it" is judged on the WORDS, not the exact string: models reword. A judged run's step
 * said "Go ahead and click Create on the confirmation screen to finish setting it up." and its message
 * "The list is titled "Team lunch" and ready to go. Click the Create button on the confirmation screen
 * to finish." — the same instruction twice in a row, which an exact match let through.
 *
 * Pure, so the loop's rendering is testable without a model: `stepText` is the text the current step
 * has produced so far, and the result is what to append to it — with the blank line that separates
 * it from that text when there is any.
 */
export function waitHandover (stepText: string, input: unknown): string | null {
  const message = repairWaitInput(input).message
  if (!message) return null
  const text = stepText.trim()
  if (text.includes(message) || sayingShare(message, text) >= HANDOVER_ALREADY_SAID) return null
  return text ? `\n\n${message}` : message
}
export interface HostStateSnapshot { state: AgentEvent[], recent: AgentEvent[] }

/**
 * What a wait is for. A transition is something that happened; keyed state is
 * what is true now, and it refreshes for many reasons — including the
 * assistant's own action finishing late. A judged run had
 * advance_to_confirmation report {ready:false} on its result and {ready:true}
 * once a title-conflict API check came back; the wait took that refresh as the
 * person acting, the model retried, and the retry blocked for the full timeout.
 * Timing cannot separate that from an early click — the same refresh lands
 * before or after the wait depending on network latency — so the rule is by
 * kind. `location` is the one keyed change that means the person left, and it
 * cancels a wait whatever the wait expected.
 */
/**
 * The key a host publishes its location under — the same string as lib-vue's
 * AGENT_LOCATION_KEY. Repeated here rather than imported because this module is
 * kept loadable by the node unit runner, which cannot resolve the workspace
 * package's built entry; a unit test pins the two together so they cannot drift.
 */
export const LOCATION_KEY = 'location'

export function resolvesWait (event: AgentEvent): boolean {
  return !event.key || event.key === LOCATION_KEY
}

export class HostEventStore {
  // Map keeps a key's original insertion position when its value is replaced, which is
  // the "first-seen key order" the snapshot relies on.
  private state = new Map<string, AgentEvent>()
  private recent: AgentEvent[] = []
  private pending: AgentEvent[] = []

  push (event: AgentEvent): void {
    if (event.key) {
      this.state.set(event.key, event)
      // Map.set keeps an existing key's position, so the first entry is always the
      // oldest surviving key — evict it once a genuinely new key pushes past the cap.
      if (this.state.size > STATE_MAX_KEYS) {
        const oldest = this.state.keys().next().value
        if (oldest !== undefined) this.state.delete(oldest)
      }
    } else {
      this.recent.push(event)
      if (this.recent.length > RECENT_MAX) this.recent.shift()
    }
    // A refresh is owed to the model as context — or, to a pending wait, as a follower of its answer.
    if (event.key) {
      const i = this.pending.findIndex(p => p.key === event.key)
      if (i >= 0) { this.pending[i] = event; return }
      this.pending.push(event)
      return
    }
    // Unkeyed events don't coalesce, so ring them the same way `recent` is ringed:
    // drop the oldest UNKEYED entry once the count exceeds the cap. Keyed entries in
    // `pending` are left alone — they already self-limit to one slot per key.
    this.pending.push(event)
    let unkeyedCount = 0
    for (const p of this.pending) if (!p.key) unkeyedCount++
    if (unkeyedCount > PENDING_MAX) {
      const i = this.pending.findIndex(p => !p.key)
      if (i >= 0) this.pending.splice(i, 1)
    }
  }

  withdraw (key: string): void {
    this.state.delete(key)
  }

  snapshot (): HostStateSnapshot {
    return { state: [...this.state.values()], recent: [...this.recent] }
  }

  hasPending (): boolean { return this.pending.length > 0 }

  takePending (): AgentEvent[] {
    const pending = this.pending
    this.pending = []
    return pending
  }

  /**
   * Whether the pending buffer holds something the person DID — what answers a pending wait.
   *
   * By kind, not by time (see `resolvesWait`): a keyed refresh is the page catching up, and it is
   * delivered as a follower of the answer rather than taken for it.
   */
  hasWaitAnswer (ignore?: (event: AgentEvent) => boolean): boolean {
    return this.pending.some(event => resolvesWait(event) && !ignore?.(event))
  }

  /**
   * Take a pending wait's answer: the first thing the person did, then everything else pending (the
   * followers of the same gesture, and the refreshes that arrived meanwhile). Null when the person has
   * not acted, which leaves the buffer untouched.
   *
   * `ignore` passes over an event that would answer by kind but is not news — a reloaded page
   * re-announcing the location it was already at. It stays pending, as context.
   */
  takeWaitAnswer (ignore?: (event: AgentEvent) => boolean): AgentEvent[] | null {
    const i = this.pending.findIndex(event => resolvesWait(event) && !ignore?.(event))
    if (i === -1) return null
    const answer = this.pending[i]
    const followers = this.pending.filter((_, j) => j !== i)
    this.pending = []
    return [answer, ...followers]
  }

  /** Put back events taken for a wait that turned out to be answered already, ahead of anything newer. */
  restorePending (events: AgentEvent[]): void {
    this.pending = [...events, ...this.pending]
  }

  /** Reset: the model owes nothing from before, so the buffer is dropped. Retention stays (the pages are still there). */
  clearPending (): void {
    this.pending = []
  }
}

function stamp (at: number): string {
  return new Date(at).toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function eventLine (e: AgentEvent): string {
  return `- ${stamp(e.at)} ${e.name}${e.detail ? ': ' + e.detail : ''}`
}

export function formatHostEvents (events: AgentEvent[]): string {
  return [
    HOST_EVENTS_OPEN,
    'Reported by the application, not written by the user. These arrive automatically, and cover what the application chose to publish — dialogs and overlays usually are not in it. Work from what is here; where it does not say, tell the user plainly you cannot see that part of their screen:',
    ...events.map(eventLine),
    HOST_EVENTS_CLOSE
  ].join('\n')
}

/**
 * A pending wait's answer, as the settled call reads: the person's action and its followers in the order
 * they happened. Followers are older states as often as consequences, and listed after the action that
 * answered, a judged run's stale « unpublished changes » read as the state that followed « draft-validated ».
 */
export function formatWaitAnswer (events: AgentEvent[]): string {
  return formatHostEvents([...events].sort((a, b) => a.at - b.at))
}

export function hasHostState (snapshot: HostStateSnapshot): boolean {
  return snapshot.state.length > 0 || snapshot.recent.length > 0
}

/**
 * The chat's own facts out of a session's host-event store, without the page's: no page state, no page
 * events. What a turn of an agent that does not work through its page reads (usesPageTools in
 * shared/agent-audit.ts) — a configured agent was told what the page beside its chat showed, and answered a
 * "hello" by describing it.
 */
export function chatFactsOnly (store: HostEventStore, chatFactKeys: ReadonlySet<string>): { snapshot: () => HostStateSnapshot, hasPending: () => boolean, takePending: () => AgentEvent[] } {
  return {
    snapshot: () => ({ state: store.snapshot().state.filter(event => !!event.key && chatFactKeys.has(event.key)), recent: [] }),
    hasPending: () => false,
    takePending: () => []
  }
}

/**
 * Fold what the page has reported into the last user message of a history, for one model call.
 *
 * Without it the store would be write-only: the socket fills it, `wait_for_user_action` drains its
 * events, and the retained STATE would never be told to the model — an assistant asked "what am I
 * looking at?" would have the answer in memory beside it and no way to read it.
 *
 * Three decisions:
 *
 *  - The LAST USER message, not the system prompt. The system prompt is the stable, cacheable prefix
 *    and page state changes every turn; and state presented as a standing instruction reads to the
 *    model as a rule rather than as an observation.
 *  - Inside the hidden-context wrapper, so the moderation gate classifies it as part of the user turn
 *    (it deliberately does not strip the wrapper) and trace reconstruction splits it back out.
 *  - Events are DRAINED. Being told twice is worse than being told late: a model shown the same click
 *    in two consecutive turns will often act on it twice.
 *
 * Returns the history unchanged when there is nothing to report, and when there is no user message to
 * attach to — a decoration with nowhere to go is dropped rather than given a turn of its own, which
 * would put a message in the history that nobody sent.
 */
export function withHostContext<M extends { role: string, content: unknown }> (
  history: M[],
  // Null for a turn with no page attached (an HTTP-driven autonomous turn): it has no host state, but
  // may still carry `trailing` blocks.
  store: { snapshot: () => HostStateSnapshot, hasPending: () => boolean, takePending: () => AgentEvent[] } | null,
  // Appended AFTER the host blocks, so they are the last thing the model reads before the person's
  // words — which is the position a reminder needs (see interruptedWaitReminder).
  trailing: string[] = [],
  // Told what was folded in, for the run's telemetry: the blocks are not stored with the message, so
  // this is the only record of what the page said to the model.
  measure?: { text: string }
): M[] {
  const snapshot = store?.snapshot()
  // Drained whole, but only the UNKEYED events are reported: a keyed event is a state change, and the
  // state block above already says what that state is now; sending both would tell the model the same
  // fact twice in one turn. (Mid-turn,
  // events appended to a tool result keep their keyed entries: there is no state block there.)
  const events = store?.hasPending() ? store.takePending().filter(event => !event.key) : []
  const blocks = [
    // `state` only, and keyed on `state.length` rather than on `hasHostState` — which is also true for
    // a store holding nothing but recent actions, and would then emit a state block with no state in
    // it. Recent actions are left out because this runs EVERY turn: the model is continuously
    // grounded, so re-listing past actions beside the events block that just reported them tells it
    // the same thing twice, and a model told an action twice often does it twice.
    snapshot?.state.length ? formatHostState(snapshot, { includeRecent: false }) : null,
    events.length ? formatHostEvents(events) : null,
    ...trailing
  ].filter((block): block is string => !!block)
  if (!blocks.length) return history

  const at = history.map(message => message.role).lastIndexOf('user')
  if (at === -1) return history
  const target = history[at]
  const hidden = blocks.join('\n\n')
  if (measure) measure.text = hidden
  const next = [...history]

  // BOTH content shapes, and the array one is the one that matters.
  //
  // This originally handled only `content: string` and returned the history untouched otherwise,
  // reasoning that a multi-part message (an image, a file) needed a part inserted rather than a
  // string concatenated. That reasoning was right and the consequence was that the feature NEVER
  // RAN: `convertToModelMessages` gives every user message an array of parts, so the guard rejected
  // the normal case and the model was never told what was on the page. The unit tests passed because
  // their fixtures used string content, which the real pipeline does not produce.
  if (typeof target.content === 'string') {
    next[at] = { ...target, content: wrapHiddenContext(hidden, target.content) }
    return next
  }
  if (!Array.isArray(target.content)) return history

  const parts = target.content as Array<{ type?: string, text?: string }>
  const firstText = parts.findIndex(part => part?.type === 'text' && typeof part.text === 'string')
  if (firstText === -1) {
    // Nothing to wrap around — an attachment-only turn. The context is prepended as its own part so
    // the model still gets it, without inventing a visible half for the wrapper to sit above.
    next[at] = { ...target, content: [{ type: 'text', text: hidden }, ...parts] }
    return next
  }
  // Wrapped around the FIRST text part, so the blocks sit ahead of the person's words exactly as
  // they do in the string case, and `splitHiddenContext` can still recover the visible half.
  const decorated = [...parts]
  decorated[firstText] = {
    ...parts[firstText],
    text: wrapHiddenContext(hidden, parts[firstText].text ?? '')
  }
  next[at] = { ...target, content: decorated }
  return next
}

export function formatHostState (snapshot: HostStateSnapshot, opts?: { includeRecent?: boolean }): string {
  const lines = [HOST_STATE_OPEN, 'Current state of the application, as reported by the application (not written by the user). These arrive automatically, and cover what the application chose to publish — dialogs and overlays usually are not in it. Work from what is here; where it does not say, tell the user plainly you cannot see that part of their screen:']
  for (const e of snapshot.state) lines.push(`- ${e.key}: ${e.detail ?? ''}`)
  // `recent` re-tells what happened, which is what an ACTIVATION turn needs: the model has no history
  // to integrate from (first turn, after a reset, after compaction) so it has to be re-grounded. A
  // caller that reports state on EVERY turn must leave it out, or every past action is re-announced
  // once per turn alongside the host-events block that already announced it once.
  if ((opts?.includeRecent ?? true) && snapshot.recent.length) {
    lines.push('Recent actions:')
    for (const e of snapshot.recent) lines.push(eventLine(e))
  }
  lines.push(HOST_STATE_CLOSE)
  return lines.join('\n')
}

/**
 * Append drained events to a host tool's result so they land in history exactly where
 * they happened (the Playwright "action returns the resulting page" shape).
 */
export function appendHostEvents (output: unknown, events: AgentEvent[]): unknown {
  if (!events.length) return output
  const block = formatHostEvents(events)
  if (typeof output === 'string') return `${output}\n\n${block}`
  if (isMediaToolResult(output)) return { ...output, text: output.text ? `${output.text}\n\n${block}` : block }
  try {
    return `${JSON.stringify(output)}\n\n${block}`
  } catch (err) {
    // A throw here would take down the whole turn from inside a tool result (a
    // circular structure, a BigInt, …). The events themselves still matter more than
    // the original payload, so fall back to just the block rather than losing both.
    debug('appendHostEvents: failed to stringify tool output: %O', err)
    return block
  }
}

/**
 * What the wait tool returns when it accepts a handover. Never shown to the model: the executor stops
 * the turn on it and leaves the call open until the person answers (see api/src/conversations/waits.ts).
 */
export const WAIT_ACCEPTED = 'wait_for_user_action: handed over'

/**
 * `wait_for_user_action`: hand the turn to the person.
 *
 * It does not block. Calling it ENDS the turn, with the call left open; the person's next action on
 * the page settles it with what they did and starts the next turn, which continues from that result as
 * if it had come back in the same one. Blocking inside the turn held a run, its lock and its
 * connections open on a clock (up to 10 minutes), fought the turn ceiling, and taught the model to
 * write "I'm still waiting" after every timeout — a judged run spent 480s of 567s that way.
 */
export function createWaitTool (): Tool {
  return tool({
    description: 'Hand the turn to the user when the next step is theirs to do in the application (click a button, submit a form, navigate…). ' +
      'Your reply ends here. When they act, you are told what the application reported — check it is what you expected before continuing; ' +
      'if they navigated away or did something else, wrap up. Use it when you have set things up and the next step is the user\'s: ' +
      'after preparing a form for them to save, or a wizard for them to confirm. Never call it when there is nothing for the user to do.',
    inputSchema: jsonSchema({
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Your message to the user, shown in the chat as your reply: what is ready and exactly what they should do (e.g. which button to press). Do not repeat it as text.' },
        expecting: { type: 'string', description: 'What you are waiting for, in a few words; shown as a status label.' }
      },
      required: ['message', 'expecting'],
      additionalProperties: false
    }),
    execute: async (rawArgs: any) => {
      // Required by the schema, which the SDK does not enforce: a Haiku run declared a
      // wait with no arguments at all, the turn went silent, and the person — told
      // nothing — had to ask what to do. Refused rather than handed over, so it is retried.
      if (!repairWaitInput(rawArgs).message) return 'Not waiting: message is required — one or two sentences telling the person what is ready and what to press. Call wait_for_user_action again with it.'
      return WAIT_ACCEPTED
    }
  })
}

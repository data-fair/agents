/**
 * One live SDK query, spanning many HTTP requests.
 *
 * The tricky part, and why this is not driven straight off the iterator: when the
 * model calls a tool, the SDK yields the assistant message and THEN invokes the
 * MCP handler. A consumer that checked for tool calls inside its `for await` body
 * would look before the handler had run, loop, and block forever on an iterator
 * the SDK is no longer feeding — the chat would hang on its first tool call.
 *
 * So the consumer loop runs for the whole conversation, writing into whichever
 * HTTP response is currently attached, and a turn ends on whichever comes first:
 * the handlers suspending (tool calls to hand back) or the query finishing.
 */
import crypto from 'node:crypto'
import { mcpNameToTool, mapUsage, type OpenAIToolCall } from './openai.ts'

// Parallel tool calls in one assistant message arrive as separate handler
// invocations a tick apart. Wait this long after the first before closing the
// turn, so they are handed back together as OpenAI expects.
const SETTLE_MS = 50

// What a suspended tool handler returns when the conversation is aborted. It
// MUST read as a failure: the model receives it as the tool's result, and a
// bare word like "aborted" would be taken for a successful answer.
export const ABORTED_TOOL_RESULT =
  'ERROR: the conversation was aborted before this tool call could be answered. No result is available.'

export type TurnOutcome =
  | { type: 'tools', calls: OpenAIToolCall[], usage?: object }
  | { type: 'done', usage?: object }
  | { type: 'error', message: string }

/** Anthropic's usage fields, as the SDK reports them on a message and, summed over the query, on its result. */
export type SdkUsage = {
  input_tokens?: number
  output_tokens?: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
}

const USAGE_FIELDS = ['input_tokens', 'output_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens'] as const

export type SdkMessage = {
  type: string
  subtype?: string
  message?: { id?: string, content?: Array<{ type: string, text?: string }>, usage?: SdkUsage }
  usage?: SdkUsage
  result?: unknown
}

export class Conversation {
  key: string
  lastSeen = Date.now()
  pending = new Map<string, (result: string) => void>()
  /**
   * The tool names the live MCP tool server was built with. A continuation
   * request declaring a different set cannot be served by this query — the model
   * would be offered the stale set — so the server compares before adopting it.
   */
  toolNames: string[]

  #collected: OpenAIToolCall[] = []
  #handedBack = 0
  #sink: ((text: string) => void) | null = null
  #resolveTurn: ((o: TurnOutcome) => void) | null = null
  #settle: NodeJS.Timeout | null = null
  #controller = new AbortController()
  #consuming = false
  #terminal: TurnOutcome | null = null
  /**
   * The latest usage seen on each model call (assistant message id) of the query, and what has
   * already been reported to the client. One query spans several HTTP requests — one per tool
   * hand-back — and each must report the model calls it covered: the SDK's `result` arrives only at
   * the very end, so a turn that never came back (a call stopped by an approval gate, whose results
   * are not sent) reported none at all.
   */
  #usageByMessage = new Map<string, SdkUsage>()
  #reported: Required<SdkUsage> = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }

  constructor (key: string, toolNames: string[] = []) {
    this.key = key
    this.toolNames = toolNames
  }

  /** Handed to the SDK as `options.abortController`, so abort() really cancels the query. */
  get controller () { return this.#controller }
  get signal () { return this.#controller.signal }

  /**
   * True once the upstream query has ended (done, error or abort). A dead
   * conversation must never be adopted as a continuation: nothing would ever
   * resolve the turn it was handed.
   */
  get isDead () { return this.#terminal !== null }

  abort () {
    this.#terminal ??= { type: 'error', message: 'conversation aborted' }
    this.#controller.abort()
    // Unblock anything still waiting on a tool result.
    for (const resolve of this.pending.values()) resolve(ABORTED_TOOL_RESULT)
    this.pending.clear()
  }

  /**
   * Called by the MCP tool server. Records the call and suspends: the promise is
   * resolved by deliverToolResults when the client's next request arrives.
   */
  handleToolCall (name: string, args: Record<string, unknown>): Promise<string> {
    const id = `call_${crypto.randomUUID()}`
    this.#collected.push({
      id,
      type: 'function',
      function: { name: mcpNameToTool(name), arguments: JSON.stringify(args) }
    })
    if (this.#settle) clearTimeout(this.#settle)
    this.#settle = setTimeout(() => { this.#endTurn({ type: 'tools', calls: this.#collected.slice(this.#handedBack) }) }, SETTLE_MS)
    if (this.#settle.unref) this.#settle.unref()
    return new Promise<string>(resolve => { this.pending.set(id, resolve) })
  }

  deliverToolResults (results: Array<{ id: string, content: string }>) {
    for (const r of results) {
      const resolve = this.pending.get(r.id)
      if (!resolve) continue
      this.pending.delete(r.id)
      resolve(r.content)
    }
  }

  /** True when every tool call handed back has been answered by this request. */
  awaits (ids: string[]) {
    if (this.#terminal) return false
    return ids.length > 0 && ids.every(id => this.pending.has(id))
  }

  /**
   * Attach an HTTP response as the sink and wait for this turn to end.
   * Start the consumer loop on first use.
   */
  beginTurn (sink: (text: string) => void, iterator?: AsyncIterable<SdkMessage>): Promise<TurnOutcome> {
    if (this.#terminal) {
      // The query ended between turns (rate limit, crash) with no response
      // attached, so its outcome was recorded rather than dropped. Replay it:
      // without this the request would await a promise nothing can settle.
      return Promise.resolve(this.#terminal)
    }
    this.#sink = sink
    const turn = new Promise<TurnOutcome>(resolve => { this.#resolveTurn = resolve })
    if (iterator && !this.#consuming) {
      this.#consuming = true
      // #consume reports every failure through #endTurn, so nothing escapes here.
      this.#consume(iterator).catch(() => {})
    }
    // A tool call can land after the previous turn's settle window closed: #endTurn
    // was then a no-op and no timer stays armed, so the call would sit here forever
    // while the SDK waits for a tool_result. Hand any such stragglers back now.
    // A still-armed timer is left alone: it is about to close the turn properly,
    // with the parallel siblings it is waiting for.
    if (!this.#settle && this.#collected.length > this.#handedBack) {
      this.#endTurn({ type: 'tools', calls: this.#collected.slice(this.#handedBack) })
    }
    return turn
  }

  /** Mark the calls just handed back, so the next turn only reports new ones. */
  handedBack (count: number) {
    this.#handedBack += count
  }

  async #consume (iterator: AsyncIterable<SdkMessage>) {
    let usage: SdkUsage | undefined
    try {
      for await (const msg of iterator) {
        if (msg.type === 'assistant') {
          // Overwritten, not summed: the SDK emits one message per content block, all sharing the
          // call's id, and the later ones carry the more complete count.
          if (msg.message?.id && msg.message.usage) this.#usageByMessage.set(msg.message.id, msg.message.usage)
          for (const block of msg.message?.content ?? []) {
            if (block.type === 'text' && block.text) this.#sink?.(block.text)
          }
        }
        if (msg.type === 'result') {
          usage = msg.usage
          if (msg.subtype !== 'success') {
            this.#endTurn({ type: 'error', message: String(msg.result ?? msg.subtype) })
            return
          }
        }
      }
      this.#endTurn({ type: 'done', usage: mapUsage(this.#unreported(usage ?? this.#seenUsage())) })
    } catch (err) {
      this.#endTurn({ type: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }

  /**
   * What `total` adds to the usage already reported, which is then counted as reported.
   *
   * A difference of cumulative counters rather than a per-message sum, so the two sources reconcile:
   * a hand-back reports the calls seen so far (whose output count may still be partial), and the
   * final `result` — the SDK's own total for the query — reports exactly the rest. The query's usage
   * is thereby reported once, whichever request it ends up on.
   */
  #unreported (total: SdkUsage): SdkUsage {
    const delta: SdkUsage = {}
    for (const field of USAGE_FIELDS) {
      const value = Math.max(0, (total[field] ?? 0) - this.#reported[field])
      if (value) delta[field] = value
      this.#reported[field] += value
    }
    return delta
  }

  /** The usage of every model call seen so far, summed. */
  #seenUsage (): SdkUsage {
    const total: SdkUsage = {}
    for (const usage of this.#usageByMessage.values()) {
      for (const field of USAGE_FIELDS) total[field] = (total[field] ?? 0) + (usage[field] ?? 0)
    }
    return total
  }

  #endTurn (outcome: TurnOutcome) {
    if (this.#settle) { clearTimeout(this.#settle); this.#settle = null }
    const resolve = this.#resolveTurn
    // A hand-back reports the model calls that led to it. Only when a request is attached to carry
    // it: with none, the calls are handed back — and the usage reported — by the next beginTurn.
    if (outcome.type === 'tools' && resolve) {
      const usage = this.#unreported(this.#seenUsage())
      if (Object.keys(usage).length) outcome = { ...outcome, usage: mapUsage(usage) }
    }
    this.#resolveTurn = null
    this.#sink = null
    // Anything but a hand-back means the query is over. Remember it: between two
    // HTTP requests there is no resolver, and dropping the outcome here is what
    // left the next request awaiting a promise that could never settle.
    if (outcome.type !== 'tools') this.#terminal ??= outcome
    resolve?.(outcome)
  }
}

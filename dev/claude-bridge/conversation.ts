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

export type TurnOutcome =
  | { type: 'tools', calls: OpenAIToolCall[] }
  | { type: 'done', usage?: object }
  | { type: 'error', message: string }

export type SdkMessage = {
  type: string
  subtype?: string
  message?: { content?: Array<{ type: string, text?: string }> }
  usage?: { input_tokens?: number, output_tokens?: number }
  result?: unknown
}

export class Conversation {
  key: string
  lastSeen = Date.now()
  pending = new Map<string, (result: string) => void>()

  #collected: OpenAIToolCall[] = []
  #handedBack = 0
  #sink: ((text: string) => void) | null = null
  #resolveTurn: ((o: TurnOutcome) => void) | null = null
  #settle: NodeJS.Timeout | null = null
  #controller = new AbortController()
  #consuming = false

  constructor (key: string) {
    this.key = key
  }

  get signal () { return this.#controller.signal }

  abort () {
    this.#controller.abort()
    // Unblock anything still waiting on a tool result.
    for (const resolve of this.pending.values()) resolve('aborted')
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
    return ids.length > 0 && ids.every(id => this.pending.has(id))
  }

  /**
   * Attach an HTTP response as the sink and wait for this turn to end.
   * Start the consumer loop on first use.
   */
  beginTurn (sink: (text: string) => void, iterator?: AsyncIterable<SdkMessage>): Promise<TurnOutcome> {
    this.#sink = sink
    const turn = new Promise<TurnOutcome>(resolve => { this.#resolveTurn = resolve })
    if (iterator && !this.#consuming) {
      this.#consuming = true
      // #consume reports every failure through #endTurn, so nothing escapes here.
      this.#consume(iterator).catch(() => {})
    }
    return turn
  }

  /** Mark the calls just handed back, so the next turn only reports new ones. */
  handedBack (count: number) {
    this.#handedBack += count
  }

  async #consume (iterator: AsyncIterable<SdkMessage>) {
    let usage: object | undefined
    try {
      for await (const msg of iterator) {
        if (msg.type === 'assistant') {
          for (const block of msg.message?.content ?? []) {
            if (block.type === 'text' && block.text) this.#sink?.(block.text)
          }
        }
        if (msg.type === 'result') {
          usage = mapUsage(msg.usage)
          if (msg.subtype !== 'success') {
            this.#endTurn({ type: 'error', message: String(msg.result ?? msg.subtype) })
            return
          }
        }
      }
      this.#endTurn({ type: 'done', usage })
    } catch (err) {
      this.#endTurn({ type: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }

  #endTurn (outcome: TurnOutcome) {
    if (this.#settle) { clearTimeout(this.#settle); this.#settle = null }
    const resolve = this.#resolveTurn
    this.#resolveTurn = null
    this.#sink = null
    resolve?.(outcome)
  }
}

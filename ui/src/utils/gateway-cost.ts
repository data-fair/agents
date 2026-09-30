/**
 * Every gateway response reports what it cost in `usage.cost` (credits, the
 * OpenRouter convention): on the JSON body, or on the final SSE chunk of a
 * stream. Read here, at the chat's single fetch choke point, so every call
 * site (assistant, sub-agents, tool model, compaction) is counted without
 * each one having to report it.
 */

function costOf (payload: any): number | undefined {
  const cost = payload?.usage?.cost
  return typeof cost === 'number' && Number.isFinite(cost) ? cost : undefined
}

/** Incremental SSE parser: tolerates lines split across reads. */
export function createSseCostScanner (onCost: (credits: number) => void) {
  let pending = ''
  return {
    push (text: string) {
      pending += text
      const lines = pending.split('\n')
      pending = lines.pop() ?? ''
      for (const line of lines) {
        // cheap pre-filter: only the final chunk carries a cost
        if (!line.startsWith('data: {') || !line.includes('"cost"')) continue
        try {
          const cost = costOf(JSON.parse(line.slice(6)))
          if (cost !== undefined) onCost(cost)
        } catch { /* not a complete JSON chunk: ignore */ }
      }
    }
  }
}

/**
 * Returns a Response equivalent to `res` for the caller, reporting its cost
 * through `onCost` (once, when known). Error responses pass through untouched.
 */
export async function watchResponseCost (res: Response, onCost: (credits: number) => void): Promise<Response> {
  if (!res.ok || !res.body) return res
  const type = res.headers.get('content-type') ?? ''
  if (type.includes('application/json')) {
    try {
      const cost = costOf(await res.clone().json())
      if (cost !== undefined) onCost(cost)
    } catch { /* not JSON after all: the caller will report it */ }
    return res
  }
  if (!type.includes('text/event-stream')) return res
  const [forCaller, forScan] = res.body.tee()
  const scanner = createSseCostScanner(onCost)
  const decoder = new TextDecoder()
  // Background read; an abort errors this branch too — swallow it, the caller
  // handles the abort on its own branch.
  ;(async () => {
    const reader = forScan.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      scanner.push(decoder.decode(value, { stream: true }))
    }
    scanner.push(decoder.decode() + '\n')
  })().catch(() => {})
  return new Response(forCaller, { status: res.status, statusText: res.statusText, headers: res.headers })
}

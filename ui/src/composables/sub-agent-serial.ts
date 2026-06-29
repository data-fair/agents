/**
 * Keyed serialization gate. `acquire(key)` resolves to a `release` fn once it is
 * this key's turn; calls sharing a key run in arrival order (each releases before
 * the next starts), while calls with different keys never wait on each other.
 *
 * Used by the sub-agent orchestrator so two concurrent delegations to the SAME
 * sub-agent — which share accumulated conversation history — run as ordered turns
 * instead of racing, while delegations to DIFFERENT sub-agents stay fully parallel.
 */
export function createSameNameGate (): (key: string) => Promise<() => void> {
  // Per key, the promise that resolves when the last queued holder releases.
  const tails = new Map<string, Promise<void>>()

  return async function acquire (key: string): Promise<() => void> {
    const prev = tails.get(key) ?? Promise.resolve()
    let release!: () => void
    const mine = new Promise<void>(resolve => { release = resolve })
    // The next acquirer of this key waits until `mine` resolves (i.e. our release).
    // Swallow `prev` rejections so one failed holder can't poison the chain.
    tails.set(key, prev.then(() => mine, () => mine))
    await prev.catch(() => {})
    return release
  }
}

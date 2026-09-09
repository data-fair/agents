/**
 * The tool set handed to `streamText` as a **live object**.
 *
 * The AI SDK does not snapshot `tools`: it dereferences the object it was given at every
 * step boundary — once to build the tool list advertised to the model
 * (`prepareToolsAndToolChoice`, called inside the step loop) and again as `tools[name]` to
 * find the tool to execute. So a tool the host registers while a turn is running becomes
 * callable on the very next step, provided we keep mutating the *same* object instead of
 * building a new one per turn.
 *
 * That is the whole mechanism: no stopping the stream, no relaunching it on the
 * accumulated history, no step-budget accounting across restarts.
 *
 * The SDK behaviour this relies on is guarded by `3.live-tools.e2e.spec.ts`, which drives
 * the real provider path: an `ai` upgrade that started snapshotting `tools` would silently
 * reinstate the bug, and that test is what fails. (A unit-level pin was tried and dropped:
 * asserting it needs a two-step tool-calling run, and the V3 stream-part sequence that
 * produces one is an internal contract which churns between SDK releases — the test broke
 * on upgrade for reasons unrelated to the property it was pinning.)
 */

import type { Tool } from 'ai'

export interface ToolsDelta {
  /** Tool names that appeared, sorted. */
  added: string[]
  /** Tool names that disappeared, sorted. */
  removed: string[]
}

/**
 * Bring `target` in line with `next` **in place**, preserving `target`'s object identity
 * so the reference already handed to a running `streamText` sees the update.
 *
 * Same-named tools are replaced rather than kept: the aggregator rebuilds its wrappers on
 * every re-merge, and the fresh wrapper is the one bound to the live MCP client.
 */
export function reconcileTools (target: Record<string, Tool>, next: Record<string, Tool>): ToolsDelta {
  const added: string[] = []
  const removed: string[] = []

  for (const name of Object.keys(target)) {
    if (!(name in next)) {
      delete target[name]
      removed.push(name)
    }
  }
  for (const [name, t] of Object.entries(next)) {
    if (!(name in target)) added.push(name)
    target[name] = t
  }

  return { added: added.sort(), removed: removed.sort() }
}

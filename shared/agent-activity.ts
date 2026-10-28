/**
 * The activity vocabulary shown in the chat while a turn streams, and the pure
 * mapping from an activity to an i18n key (+ an optional name). Kept free
 * of Vue and the `~` alias so it can be unit-tested by the node test runner and
 * imported by both the composable (which produces ChatActivity) and the
 * component (which renders it).
 */

/** The loop-provided tool a turn hands control to the person with (api/src/agent-session/host-events.ts). */
export const WAIT_TOOL_NAME = 'wait_for_user_action'

export type ChatActivity =
  // Compacting the history before the turn starts.
  | { kind: 'compacting' }
  // Main agent thinking during a gap with no visible output.
  | { kind: 'thinking' }
  // Main agent reading a tool result.
  | { kind: 'analyzing' }
  // The main agent declared a wait for the user (wait_for_user_action); `expecting`
  // is its own words for what it is waiting for.
  | { kind: 'waiting', expecting: string }
  // A call needs the person's approval; the turn ended on it (see the approval gate).
  | { kind: 'approval', toolName: string }

export interface ActivityLabel {
  key: string
  // Interpolation value for keys that name something (what is awaited, the tool needing approval).
  name?: string
}

export function activityLabelKey (activity: ChatActivity | null | undefined): ActivityLabel | null {
  if (!activity) return null
  switch (activity.kind) {
    case 'compacting': return { key: 'activityCompacting' }
    case 'thinking': return { key: 'activityThinking' }
    case 'analyzing': return { key: 'activityAnalyzing' }
    case 'waiting': return { key: 'activityWaiting', name: activity.expecting }
    case 'approval': return { key: 'activityApproval', name: activity.toolName }
  }
}

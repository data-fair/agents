/**
 * The activity vocabulary shown in the chat while a turn streams, and the pure
 * mapping from an activity to an i18n key (+ optional sub-agent name). Kept free
 * of Vue and the `~` alias so it can be unit-tested by the node test runner and
 * imported by both the composable (which produces ChatActivity) and the
 * component (which renders it).
 */

export type ChatActivity =
  // Compacting the history before the turn starts.
  | { kind: 'compacting' }
  // Main agent thinking during a gap with no visible output.
  | { kind: 'thinking' }
  // Main agent reading a tool result; `subAgent` (a `subagent_*` tool name) is
  // set when that tool was a sub-agent, so the bottom line can name it.
  | { kind: 'analyzing', subAgent?: string }
  // A sub-agent is active; rendered inside its panel (`name` is its `subagent_*`
  // tool name, used to match the panel — not shown in the label).
  | { kind: 'subagent', name: string, phase: 'starting' | 'thinking' | 'tool' | 'analyzing' }

export interface ActivityLabel {
  key: string
  // Interpolation value for keys that name a sub-agent (bottom-line analyzing only).
  name?: string
}

export function activityLabelKey (activity: ChatActivity | null | undefined): ActivityLabel | null {
  if (!activity) return null
  switch (activity.kind) {
    case 'compacting': return { key: 'activityCompacting' }
    case 'thinking': return { key: 'activityThinking' }
    case 'analyzing': return activity.subAgent
      ? { key: 'activityAnalyzingSubAgent', name: activity.subAgent }
      : { key: 'activityAnalyzing' }
    case 'subagent':
      switch (activity.phase) {
        case 'starting': return { key: 'activitySubAgentStarting' }
        case 'tool': return { key: 'activitySubAgentTool' }
        case 'analyzing': return { key: 'activitySubAgentAnalyzing' }
        default: return { key: 'activitySubAgentThinking' }
      }
  }
}

/**
 * What a planned task's run is told when its turn ended without report_outcome: one more pass, offered only that
 * tool (executor.ts performTurn). Claude Code's Stop hook is the convention: refuse the stop, say why. A run that
 * still does not report keeps its outcome absent, as before.
 *
 * A leaf module, imported by the mock model too: it must stay free of imports, or the UI's type check, which reaches
 * the mock through ui-config, would compile the service's modules.
 */
export const OUTCOME_REMINDER = 'You ended this planned task run without calling report_outcome. Call it now: done, nothing-to-do or needs-attention, with a summary of what this run found or did.'

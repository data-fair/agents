/**
 * When a typed message can be handed to the model, kept free of Vue so the node
 * test runner can exercise it (same split as agent-activity.ts).
 *
 * A turn paused on a declared wait is interruptible: sending settles the wait and
 * takes the turn back. Any other streaming turn is genuinely working.
 */
export function canSendNow (isStreaming: boolean, isWaitingForUser: boolean): boolean {
  return !isStreaming || isWaitingForUser
}

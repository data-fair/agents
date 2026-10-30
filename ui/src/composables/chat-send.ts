/**
 * When a typed message can be handed to the model, kept free of Vue so the node
 * test runner can exercise it (same split as agent-activity.ts).
 *
 * A pending wait is the person's move, so sending is always possible then — it
 * answers the wait. Any other streaming turn is genuinely working.
 */
export function canSendNow (isStreaming: boolean, isWaitingForUser: boolean): boolean {
  return !isStreaming || isWaitingForUser
}

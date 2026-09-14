/**
 * The Agent SDK and MCP SDK are optional peers (see package.json) so a
 * consumer who only wants the harness primitives (createChatDriver,
 * captureGateway, selectCases, reportCases, ...) is not forced to install
 * them. Two places load the Agent SDK lazily, inside the function that needs
 * it rather than at module top level, so importing the barrel never requires
 * it: `persona.ts`'s `nextUserMessage` (the simulated user) and the
 * `df-agents-bridge` bin. Both catch a resulting ERR_MODULE_NOT_FOUND here
 * and surface this message instead of node's raw error, naming the install
 * command.
 *
 * Exported as a constant (not inlined) so a unit test can assert it still
 * exists and still names the right packages.
 */
export const MISSING_SDK_MESSAGE = [
  '@data-fair/lib-agents-sim needs the Agent SDK and MCP SDK, which are optional peer dependencies and are not installed.',
  'Install them with:',
  '  npm i -D @anthropic-ai/claude-agent-sdk @modelcontextprotocol/sdk'
].join('\n')

export function isMissingSdkError (err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  if ((err as { code?: unknown }).code !== 'ERR_MODULE_NOT_FOUND') return false
  const message = String((err as { message?: unknown }).message ?? '')
  return message.includes('@anthropic-ai/claude-agent-sdk') || message.includes('@modelcontextprotocol/sdk')
}

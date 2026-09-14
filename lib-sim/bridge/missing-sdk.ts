/**
 * The Agent SDK and MCP SDK are optional peers (see package.json) so a
 * consumer who only wants the harness primitives is not forced to install
 * them. When the bridge bin (df-agents-bridge) is run without them, node's
 * raw ERR_MODULE_NOT_FOUND is not actionable — bridge/index.ts catches it and
 * prints this message instead, naming the install command.
 *
 * Exported as a constant (not inlined) so a unit test can assert it still
 * exists and still names the right packages.
 */
export const MISSING_SDK_MESSAGE = [
  'The Claude Code bridge needs its optional peer dependencies, which are not installed.',
  'Install them with:',
  '  npm i -D @anthropic-ai/claude-agent-sdk @modelcontextprotocol/sdk'
].join('\n')

export function isMissingSdkError (err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  if ((err as { code?: unknown }).code !== 'ERR_MODULE_NOT_FOUND') return false
  const message = String((err as { message?: unknown }).message ?? '')
  return message.includes('@anthropic-ai/claude-agent-sdk') || message.includes('@modelcontextprotocol/sdk')
}

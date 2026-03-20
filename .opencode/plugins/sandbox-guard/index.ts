import type { Plugin } from '@opencode-ai/plugin'

export const SandboxGuardPlugin: Plugin = async () => {
  return {
    'tool.execute.before': async () => {
      if (!process.env.OPENSHELL_SANDBOX_ID) {
        throw new Error(
          'Not running inside OpenShell sandbox. Use: source .env && openshell sandbox create -- opencode'
        )
      }
    },
  }
}

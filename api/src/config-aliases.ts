/**
 * Configuration names that changed, still honoured under their old name.
 *
 * Pure, so the rule is unit-tested rather than discovered on a deploy. A renamed setting must not
 * break a deployment that still sets the old one — and must not be silently ignored either, which
 * would quietly restore a default nobody chose. So the old value is used when the new one is not
 * set, and its use is reported.
 */

export interface DeprecatedSetting {
  /** The config key now, and the environment variable that sets it. */
  key: string
  env: string
  /** The old config key (in a config file) and environment variable. */
  oldKey: string
  oldEnv: string
}

export const DEPRECATED_SETTINGS: DeprecatedSetting[] = [
  // These bound EVERY turn — the chat's as much as an autonomous agent's — since the loop moved to the
  // server, so the names that said "autonomous agent run" described the first caller, not the setting.
  { key: 'turnCredits', env: 'TURN_CREDITS', oldKey: 'autonomousAgentRunCredits', oldEnv: 'AUTONOMOUS_AGENT_RUN_CREDITS' },
  { key: 'turnTimeoutSeconds', env: 'TURN_TIMEOUT_SECONDS', oldKey: 'autonomousAgentRunTimeoutSeconds', oldEnv: 'AUTONOMOUS_AGENT_RUN_TIMEOUT_SECONDS' }
]

/**
 * The configuration with every old name resolved onto its new one, and the warnings to log.
 *
 * The new name wins whenever it is set, by environment or by file; the old one is used only when the
 * new one is absent from the environment. An old KEY in a config file is moved to the new key too,
 * and always removed, since the validated schema does not know it.
 */
export function applyDeprecatedConfig (
  config: Record<string, unknown>,
  env: Record<string, string | undefined>,
  settings: DeprecatedSetting[] = DEPRECATED_SETTINGS
): { config: Record<string, unknown>, warnings: string[] } {
  const resolved = { ...config }
  const warnings: string[] = []
  for (const setting of settings) {
    const fromOldKey = resolved[setting.oldKey]
    delete resolved[setting.oldKey]
    if (env[setting.env] !== undefined) continue
    if (env[setting.oldEnv] !== undefined) {
      resolved[setting.key] = JSON.parse(env[setting.oldEnv] as string)
      warnings.push(`${setting.oldEnv} is deprecated, set ${setting.env} instead (the old name is still read for now)`)
    } else if (fromOldKey !== undefined) {
      resolved[setting.key] = fromOldKey
      warnings.push(`config key ${setting.oldKey} is deprecated, use ${setting.key} instead (the old name is still read for now)`)
    }
  }
  return { config: resolved, warnings }
}

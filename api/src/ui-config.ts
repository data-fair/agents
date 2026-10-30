import config from '#config'

// Config values exposed to the browser (injected as window.__UI_CONFIG).
export const uiConfig = {
  /**
   * Whether configuring an autonomous agent still requires superadmin admin mode.
   *
   * Exposed so the UI does not offer an org admin a form every save of which the API would
   * refuse during the progressive rollout. It is a rollout flag, not a secret: it says which
   * FEATURE is open, never who may use what.
   */
  autonomousAgentsRequireAdminMode: config.autonomousAgentsRequireAdminMode
}

export type UiConfig = typeof uiConfig
export default uiConfig

// Config values exposed to the browser (injected as window.__UI_CONFIG).
// Currently empty — kept so the SPA middleware contract and the UiConfig type
// import in ui/src/context.ts survive the next key that needs exposing.
export const uiConfig = {}

export type UiConfig = typeof uiConfig
export default uiConfig

// Maps the live Vuetify theme palette (useTheme().current.value.colors) to Mermaid
// `themeVariables`, reusing the variable set proven in /home/alban/koumoul/doc.
// Keeping it pure makes it unit-testable and independent of the mermaid import.
export function buildMermaidThemeVariables (colors: Record<string, string>): Record<string, string> {
  const primary = colors.primary ?? '#1976D2'
  const onPrimary = colors['on-primary'] ?? '#FFFFFF'
  const onSurface = colors['on-surface'] ?? '#424242'
  const secondary = colors.secondary ?? primary
  const surface = colors.surface ?? '#FFFFFF'
  return {
    primaryColor: primary,
    primaryTextColor: onPrimary,
    primaryBorderColor: secondary,
    lineColor: onSurface,
    secondaryColor: secondary,
    tertiaryColor: surface
  }
}

// Maps the live Vuetify theme palette (useTheme().current.value.colors) to Mermaid
// `themeVariables`, reusing the variable set proven in /home/alban/koumoul/doc.
// Keeping it pure makes it unit-testable and independent of the mermaid import.
//
// The nested `xyChart` block is necessary because xychart-beta ignores the generic
// variables (primaryColor/lineColor) and reads its own palette: without it, plots
// fall back to mermaid's default colors and the title/axis text is near-invisible on
// the chat background. We point its plot colors at the theme's primary/secondary and
// all its text/axis colors at on-surface, so XY charts match the app and stay legible
// in both light and dark mode.
export function buildMermaidThemeVariables (colors: Record<string, string>): Record<string, unknown> {
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
    tertiaryColor: surface,
    xyChart: {
      backgroundColor: surface,
      titleColor: onSurface,
      plotColorPalette: `${primary},${secondary}`,
      xAxisLabelColor: onSurface,
      xAxisTitleColor: onSurface,
      xAxisTickColor: onSurface,
      xAxisLineColor: onSurface,
      yAxisLabelColor: onSurface,
      yAxisTitleColor: onSurface,
      yAxisTickColor: onSurface,
      yAxisLineColor: onSurface
    }
  }
}

let mermaidModule: typeof import('mermaid').default | null = null
let lastThemeKey = ''
let idCounter = 0

function inlineError (block: HTMLElement, source: string, message: string, fixLabel?: string) {
  const wrapper = block.closest('.mermaid-block')
  wrapper?.classList.add('mermaid-error')
  const content = document.createElement('div')
  content.className = 'mermaid-error-content'
  const title = document.createElement('p')
  title.className = 'mermaid-error-title'
  title.textContent = 'Invalid mermaid syntax'
  const detail = document.createElement('pre')
  detail.className = 'mermaid-error-detail'
  detail.textContent = message
  const src = document.createElement('pre')
  src.className = 'mermaid-error-source'
  src.textContent = source
  content.append(title, detail, src)
  // The "fix" button is delegated-click handled by AgentChatMessages (it lives in v-html,
  // so it cannot be a Vue component). It carries the failed source/error in its dataset.
  if (fixLabel) {
    const fix = document.createElement('button')
    fix.className = 'mermaid-fix-btn'
    fix.setAttribute('data-mermaid-fix', '')
    fix.textContent = fixLabel
    fix.dataset.mermaidSource = source
    fix.dataset.mermaidError = message
    content.append(fix)
  }
  block.replaceWith(content)
}

// Lazy-loads mermaid (kept out of the initial bundle), (re)initializes it with the
// app theme, and renders each diagram inside `el` independently so one bad diagram
// cannot abort the rest of the message.
export async function renderMermaidIn (el: HTMLElement, themeVariables: Record<string, unknown>, fixLabel?: string): Promise<void> {
  const blocks = el.querySelectorAll<HTMLElement>('pre.mermaid')
  if (!blocks.length) return

  if (!mermaidModule) mermaidModule = (await import('mermaid')).default
  const mermaid = mermaidModule

  const themeKey = JSON.stringify(themeVariables)
  if (themeKey !== lastThemeKey) {
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'base', themeVariables })
    lastThemeKey = themeKey
  }

  for (const block of blocks) {
    const source = block.textContent ?? ''
    const id = `mermaid-svg-${idCounter++}`
    try {
      const { svg, bindFunctions } = await mermaid.render(id, source)
      block.innerHTML = svg
      bindFunctions?.(block)
    } catch (err) {
      document.getElementById(id)?.remove() // drop mermaid's leftover temp nodes
      document.getElementById('d' + id)?.remove()
      inlineError(block, source, err instanceof Error ? err.message : String(err), fixLabel)
    }
  }
}

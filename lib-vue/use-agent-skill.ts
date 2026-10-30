import { onScopeDispose } from 'vue'
import Debug from './debug.js'

const debug = Debug('df-agents:use-agent-skill')

export interface AgentSkillOptions {
  /** The Agent Skills name: lowercase words joined by hyphens. Also the skill's URI: `skill://<name>/SKILL.md`. */
  name: string
  /** When the agent should load it. Always shown to the agent; keep it to what decides that. */
  description: string
  /**
   * The procedure, in markdown: listed to the agent by its description, read by it on demand. Sent with the page's
   * tools, so it is the text as registered; register again (a new scope) to change it.
   */
  body: string
}

let warned = false

/**
 * Publish a skill beside this page's tools: a procedure the agent lists and loads on demand, exactly like a
 * skill an MCP server publishes (docs/architecture/mcp-tools.md, "Page skills").
 *
 * It is an MCP resource on the page's `navigator.modelContext` (`skill://<name>/SKILL.md`, the MCP skills
 * extension's shape), which is why it needs the frame server's model context (`useFrameServer`) rather
 * than the bare WebMCP polyfill, which has no resources.
 */
export function useAgentSkill (options: AgentSkillOptions) {
  if (typeof window === 'undefined') return
  const uri = `skill://${options.name}/SKILL.md`
  const modelContext = navigator.modelContext as any
  if (typeof modelContext?.registerResource !== 'function') {
    if (!warned) console.warn('[df-agents] page skills need useFrameServer() first: this model context has no resources')
    warned = true
    return
  }
  debug('register skill %s', uri)
  let handle: { unregister: () => void }
  try {
    handle = modelContext.registerResource({
      uri,
      name: options.name,
      description: options.description,
      mimeType: 'text/markdown',
      read: async () => ({
        contents: [{ uri, mimeType: 'text/markdown', text: options.body }]
      })
    })
  } catch (err) {
    console.warn(`[df-agents] could not register agent skill "${options.name}":`, err)
    return
  }
  onScopeDispose(() => {
    debug('unregister skill %s', uri)
    handle.unregister()
  })
}

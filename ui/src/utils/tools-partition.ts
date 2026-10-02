/**
 * Split a page's tool set into "the main agent's tools" and "the sub-agents, each with the tools it
 * reserves" — the shape the debug dialog renders.
 *
 * This is a DISPLAY concern, and the one piece of sub-agent handling that stays in the browser even
 * with the loop on the server. The reason is where the information lives: a `subagent_*` tool declares
 * its roster by returning its config when called with an empty task, so the roster can only be read by
 * calling the tool — and these tools are the page's, so the page is where they can be called. The
 * server does its own partition for the loop (`api/src/agent-session/sub-agents.ts`); this one answers
 * "what would it see", for a human looking at the dialog.
 *
 * Extracted from `use-agent-chat` so the session path shares one copy rather than carrying a second
 * one that could drift in what it reserves — a tool counted as "main" here while the loop treats it as
 * a sub-agent's would make the dialog quietly disagree with what actually runs.
 */

import type { Tool } from 'ai'

/**
 * Only the field this file reads. The full config (prompt, model, delegateOnly) is the LOOP's concern
 * and is parsed server-side by `parseSubAgentConfig`; narrowing it here keeps a display helper from
 * claiming to validate a contract it does not use.
 */
interface SubAgentRoster { tools: string[] }

export interface ToolInfo {
  name: string
  title?: string
  description: string
  inputSchema: Record<string, any>
}

export interface SubAgentInfo {
  name: string
  displayName: string
  description: string
  tools: ToolInfo[]
}

export interface DebugToolsPartition {
  mainTools: ToolInfo[]
  subAgents: SubAgentInfo[]
}

const toolInfo = (name: string, t: any): ToolInfo => ({
  name,
  title: t.title,
  description: t.description ?? '',
  inputSchema: t.inputSchema?.jsonSchema ?? {}
})

/**
 * Resolve the partition for a tool set.
 *
 * Async because reading a sub-agent's roster means calling it. A broken sub-agent is skipped rather
 * than failing the whole partition: the dialog showing the rest beats it showing nothing.
 */
export async function resolveToolsPartition (allTools: Record<string, Tool>): Promise<DebugToolsPartition> {
  const subAgents: SubAgentInfo[] = []
  const reservedNames = new Set<string>()

  for (const [name, t] of Object.entries(allTools)) {
    if (!name.startsWith('subagent_')) continue
    const executeFn = (t as any).execute
    if (!executeFn) continue
    try {
      const raw = await executeFn({ task: '' })
      let configStr: string
      if (typeof raw === 'string') configStr = raw
      else if (raw?.content?.[0]?.text) configStr = raw.content[0].text
      else continue
      const config: SubAgentRoster = JSON.parse(configStr)
      for (const tn of config.tools) reservedNames.add(tn)
      subAgents.push({
        name,
        displayName: (t as any).title || name.replace(/^subagent_/, ''),
        description: (t as any).description ?? '',
        tools: config.tools.filter(tn => allTools[tn]).map(tn => toolInfo(tn, allTools[tn]))
      })
    } catch { /* skip broken subagents */ }
  }

  const mainTools: ToolInfo[] = []
  for (const [name, t] of Object.entries(allTools)) {
    if (name.startsWith('subagent_')) continue
    // A tool a sub-agent reserves is not the main agent's, so listing it in both would overstate what
    // the main agent can reach.
    if (reservedNames.has(name)) continue
    mainTools.push(toolInfo(name, t))
  }

  return { mainTools, subAgents }
}

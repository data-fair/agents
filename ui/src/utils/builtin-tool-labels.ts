/**
 * What a chip calls one of the service's own tools (api/src/conversations/service-tool-names.ts).
 *
 * A catalog or page tool is named by the title it declares; the service's tools declare none, so their
 * chips read `read_skill` or `code_mode` — a developer's word, and one that says nothing of which guide
 * was read or which site fetched. Named here instead, with the one argument that tells calls apart, as
 * other agent UIs do ("Read file X", "Searched for Y"). An i18n key, so the component's messages hold
 * the words; `name` is set when the key has a slot for it.
 *
 * The wait has its own wording (it reads as an instruction, see the chat's chipLabel), so it is not here.
 */

export interface BuiltinToolLabel {
  key: string
  name?: string
}

const str = (input: unknown, key: string): string | undefined => {
  const value = (input as Record<string, unknown> | undefined)?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/** The host of a URL, or the text as given when it is not one (list_site_pages takes a bare domain). */
const host = (value: string | undefined): string | undefined => {
  if (!value) return undefined
  try {
    return new URL(value).host || value
  } catch {
    return value
  }
}

/** A skill's name, out of its URI: skill://<server>/<name>/SKILL.md. */
export const skillName = (uri: string | undefined): string | undefined => {
  if (!uri) return undefined
  const segments = uri.replace(/^skill:\/\//, '').split('/').filter(Boolean)
  if (segments[segments.length - 1]?.toUpperCase() === 'SKILL.MD') segments.pop()
  return segments[segments.length - 1]
}

/** With the argument when there is one: while a call's input streams in, it may not be there yet. */
const withName = (key: string, name: string | undefined): BuiltinToolLabel => name ? { key, name } : { key: `${key}Any` }

const LABELS: Record<string, (input: unknown) => BuiltinToolLabel> = {
  read_skill: input => withName('toolReadSkill', skillName(str(input, 'uri'))),
  code_mode: () => ({ key: 'toolCodeMode' }),
  memory: input => ({ key: str(input, 'command') === 'view' ? 'toolMemoryView' : 'toolMemoryEdit' }),
  fetch_url: input => withName('toolFetchUrl', host(str(input, 'url'))),
  list_site_pages: input => withName('toolListSitePages', host(str(input, 'site'))),
  request_web_access: () => ({ key: 'toolRequestWebAccess' }),
  request_mcp_access: () => ({ key: 'toolRequestMcpAccess' }),
  ls: () => ({ key: 'toolLs' }),
  read_file: input => withName('toolReadFile', str(input, 'file_path')),
  write_file: input => withName('toolWriteFile', str(input, 'file_path')),
  get_my_configuration: () => ({ key: 'toolGetMyConfiguration' }),
  list_my_runs: () => ({ key: 'toolListMyRuns' }),
  read_conversation: () => ({ key: 'toolReadConversation' }),
  plan_task: () => ({ key: 'toolPlanTask' }),
  update_task: () => ({ key: 'toolUpdateTask' }),
  delete_task: () => ({ key: 'toolDeleteTask' }),
  report_outcome: () => ({ key: 'toolReportOutcome' })
}

/** The tools named here: a unit test holds this to the service's own list. */
export const LABELLED_BUILTIN_TOOLS: readonly string[] = Object.keys(LABELS)

export const builtinToolLabel = (toolName: string, input?: unknown): BuiltinToolLabel | null =>
  LABELS[toolName]?.(input) ?? null

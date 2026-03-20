const TAB_CHANNEL_KEY = 'mcpTabChannelId'

export function getTabChannelId (): string {
  let id = sessionStorage.getItem(TAB_CHANNEL_KEY)
  if (!id) {
    id = 'mcp-frame-' + crypto.randomUUID()
    sessionStorage.setItem(TAB_CHANNEL_KEY, id)
  }
  return id
}

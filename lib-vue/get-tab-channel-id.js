const TAB_CHANNEL_KEY = Symbol.for('mcpTabChannelId');
export function getTabChannelId() {
    let top;
    try {
        top = window.top ?? window;
    }
    catch {
        top = window;
    }
    if (!top[TAB_CHANNEL_KEY]) {
        top[TAB_CHANNEL_KEY] = 'mcp-frame-' + crypto.randomUUID();
    }
    return top[TAB_CHANNEL_KEY];
}

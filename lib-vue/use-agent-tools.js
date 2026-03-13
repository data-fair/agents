import { onScopeDispose } from 'vue';
import { initializeWebMCPPolyfill } from '@mcp-b/webmcp-polyfill';
initializeWebMCPPolyfill();
export function useAgentTool(agentTool) {
    if (typeof window === 'undefined')
        return;
    navigator.modelContext.registerTool(agentTool);
    onScopeDispose(() => {
        window.navigator.modelContext.unregisterTool(agentTool.name);
    });
}

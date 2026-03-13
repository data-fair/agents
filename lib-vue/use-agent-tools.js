import { inject, markRaw, onScopeDispose, reactive } from 'vue';
import { initializeWebMCPPolyfill } from '@mcp-b/webmcp-polyfill';
initializeWebMCPPolyfill();
export const agentToolsKey = Symbol('agentTools');
export function createAgentTools() {
    const tools = reactive({});
    return {
        install(app) { app.provide(agentToolsKey, tools); },
        state: tools
    };
}
export function useAgentTools() {
    const agentTools = inject(agentToolsKey);
    if (!agentTools)
        throw new Error('useAgentTools requires using the plugin createAgentTools');
    return agentTools;
}
export function useAgentTool(agentTool) {
    if (typeof window === 'undefined')
        return;
    navigator.modelContext.registerTool(agentTool);
    useAgentTools()[agentTool.name] = markRaw(agentTool);
    onScopeDispose(() => {
        window.navigator.modelContext.unregisterTool(agentTool.name);
        delete useAgentTools()[agentTool.name];
    });
}

import type { App } from 'vue';
export declare const agentToolsKey: unique symbol;
export type AgentTool = Parameters<typeof navigator.modelContext.registerTool>[0];
export declare function createAgentTools(): {
    install(app: App): void;
    state: Record<string, Omit<import("@mcp-b/webmcp-types").ToolDescriptor<Record<string, unknown>, unknown, string>, "inputSchema"> & {
        inputSchema?: undefined;
    }>;
};
export declare function useAgentTools(): ReturnType<typeof createAgentTools>["state"];
export declare function useAgentTool(agentTool: AgentTool): void;

/**
 * data-fair's built-in server, as the test seams take it (`platformMcpUrl` of /api/test-env/autonomous-agent and
 * /api/test-env/enrol-autonomous-agent): an agent they enrol gets none unless the caller names one.
 */

/** The dev stand-in (dev/mcp-server.ts, `npm run dev:mcp`): the data tools `platform_*`, whatever the API wires. */
export const STAND_IN_PLATFORM_MCP_URL = `http://localhost:${process.env.DEV_MCP_PORT}/platform/mcp`

/** The server the API itself wires (PRIVATE_MCP_URL, else the stand-in of api/config/development.js): for dev data and simulations. */
export const DEPLOYMENT_PLATFORM_MCP_URL = process.env.PRIVATE_MCP_URL || STAND_IN_PLATFORM_MCP_URL

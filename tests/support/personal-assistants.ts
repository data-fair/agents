/**
 * The servers of the personal assistants, as the test seam takes them (`POST /api/test-env/personal-assistants`).
 *
 * A spec whose personal-assistant turns call the dev MCP fixtures names them here, after its reset (which
 * forgets the choice), rather than relying on the deployment's `personalAssistants`: the development config
 * gives the assistants these servers, a deployment like production none.
 */
import { superAdmin } from './axios.ts'

/** The dev catalog entries (api/config/development.js) the development config puts on both assistants. */
export const DEV_ASSISTANT_SERVERS = ['dev-review-mcp', 'dev-review-session-mcp', 'dev-public-mcp', 'dev-session-mcp'].map(serverId => ({ serverId }))

/** Give both personal assistants of an account (default: test_agents_org1) the dev MCP servers. */
export const giveAssistantsDevServers = async (owner: { type: 'user' | 'organization', id: string } = { type: 'organization', id: 'test_agents_org1' }) => {
  const admin = await superAdmin
  await admin.post('/api/test-env/personal-assistants', {
    owner,
    personalAssistants: { portal: { mcpServers: DEV_ASSISTANT_SERVERS }, backOffice: { mcpServers: DEV_ASSISTANT_SERVERS } }
  })
}

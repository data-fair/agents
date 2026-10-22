/**
 * An autonomous agent on organization test1 with a REAL identity, as a spec needs one to run it.
 *
 * Every agent with an identity calls data-fair's built-in server as itself, so its identity must get a
 * token: the placeholder of `/api/test-env/enrol-autonomous-agent` cannot. A real one's subject names its
 * agent (`autonomous-agent:<id>`, dev/resources/users.template.json), so the id is not free: two slots, for
 * the two fixture identities of test1. A test needing two agents at once takes both.
 */
import { superAdmin } from './axios.ts'

const SLOTS = {
  'test-fixture': 'test-autonomous-agent-nhi',
  // its identity also holds the maximum scopes ["datasets:read"]
  'test-scoped-fixture': 'test-scoped-autonomous-agent-nhi'
} as const
export type AgentSlot = keyof typeof SLOTS

export const createEnrolledAgent = async (autonomousAgent: Record<string, unknown>, slot: AgentSlot = 'test-fixture'): Promise<any> => {
  const admin = await superAdmin
  const home = `http://localhost:${process.env.NGINX_PORT}`
  return (await admin.post('/api/test-env/autonomous-agent', {
    id: slot,
    owner: { type: 'organization', id: 'test1' },
    clientId: SLOTS[slot],
    siteUrl: home,
    issuer: `${home}/agents/api/nhi`,
    autonomousAgent
  })).data
}

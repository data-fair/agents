/**
 * The accounts of this service's test sub-space in simple-directory: every user, organization and member
 * id (and every email) starts with the prefix, so the suite seeds and cleans them without touching the
 * accounts of other sub-spaces (dev data under another prefix, a simulation's context).
 *
 * Upserted by tests/global-setup.ts through simple-directory's test API (POST /api/test-env/seed) before
 * the spec files are loaded (never for a unit-only run), then cleaned (DELETE /api/test-env?prefix=) and
 * seeded again by tests/state-setup.ts, under the stateful lock. Every user with a password uses 'passwd' and an
 * email `<id>@test.com`, which is what the login helpers derive (tests/support/axios.ts, tests/fixtures/login.ts).
 */
export const prefix = 'test_agents_'

const person = (id: string, firstName: string, lastName: string) => ({
  id: prefix + id,
  firstName,
  lastName,
  email: `${prefix}${id}@test.com`,
  password: { clear: 'passwd' }
})

export const sdFixtures = (env: Record<string, string | undefined> = process.env) => {
  // The issuer an autonomous agent's assertions are verified against: this service's own, reached
  // through the dev proxy. simple-directory pins it per NHI, so a wrong port is a uniform 401 at the
  // token exchange.
  const issuer = `http://${env.DEV_HOST}:${env.NGINX_PORT}/agents/api/nhi`

  const users = [
    // a simple-directory admin (ADMINS in docker-compose.yml)
    person('superadmin', 'Test', 'Superadmin'),
    // no organization: its personal account is the one the specs use
    person('standalone', 'Test', 'Standalone'),
    person('org1_admin', 'Org1', 'Admin'),
    person('org1_contrib', 'Org1', 'Contrib'),
    person('org1_user', 'Org1', 'User'),
    // a member of another organization than test_agents_org1
    person('org2_user', 'Org2', 'User'),
    // The identities of the autonomous agents of test_agents_org1. Each subject pins the agent id
    // (autonomous-agent:<id>), see tests/features/autonomous-agents/nhi-fixtures.unit.spec.ts.
    {
      id: `${prefix}org1_agent_nhi`,
      email: `${prefix}org1_agent_nhi@test.com`,
      nhi: { provider: { issuer }, subject: 'autonomous-agent:test-fixture' }
    },
    {
      id: `${prefix}org1_scoped_agent_nhi`,
      email: `${prefix}org1_scoped_agent_nhi@test.com`,
      nhi: { provider: { issuer }, subject: 'autonomous-agent:test-scoped-fixture', scopes: ['datasets:read'] }
    }
  ]

  const organizations = [
    {
      id: `${prefix}org1`,
      name: 'Test Organization 1',
      members: [
        { id: `${prefix}org1_admin`, role: 'admin' },
        { id: `${prefix}org1_contrib`, role: 'contrib' },
        { id: `${prefix}org1_user`, role: 'user' },
        { id: `${prefix}org1_agent_nhi`, role: 'contrib' },
        { id: `${prefix}org1_scoped_agent_nhi`, role: 'contrib' }
      ]
    },
    {
      id: `${prefix}org2`,
      name: 'Test Organization 2',
      members: [{ id: `${prefix}org2_user`, role: 'user' }]
    }
  ]

  return { prefix, users, organizations }
}

/** simple-directory's test API, reached directly (not through nginx) */
export const sdTestEnvUrl = (env: Record<string, string | undefined> = process.env) => `http://localhost:${env.SD_PORT}/api/test-env`

const tooOld = 'simple-directory image too old for prefixed test sub-spaces: run "docker compose pull simple-directory"'

/**
 * POST a sub-space body to simple-directory's seed route and check the counts of the answer: an old image
 * without the prefixed test API answers 200 too, after seeding its own files, and the run would fail later with 401s.
 */
export const postSdSeed = async (url: string, body: { prefix: string, users: unknown[], organizations: unknown[] }) => {
  const seedRes = await fetch(`${url}/seed`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (seedRes.status >= 500) throw new Error(`${tooOld} (HTTP ${seedRes.status} on the seed of ${body.prefix})`)
  if (seedRes.status !== 200) throw new Error(`simple-directory refused the seed of ${body.prefix}: HTTP ${seedRes.status} ${await seedRes.text()}`)
  const counts = await seedRes.json().catch(() => null) as { users: number, organizations: number } | null
  if (counts?.users !== body.users.length || counts?.organizations !== body.organizations.length) {
    throw new Error(tooOld)
  }
  return counts
}

/** Clean the sub-space in simple-directory, then seed its accounts. Idempotent. */
export const seedSdFixtures = async (env: Record<string, string | undefined> = process.env) => {
  const url = sdTestEnvUrl(env)
  const cleanRes = await fetch(`${url}?prefix=${prefix}`, { method: 'DELETE' })
  if (cleanRes.status !== 204) throw new Error(`simple-directory refused the cleanup of ${prefix}: HTTP ${cleanRes.status} ${await cleanRes.text()}`)
  return await postSdSeed(url, sdFixtures(env))
}

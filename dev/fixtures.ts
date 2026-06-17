/**
 * Dev fixtures: seed a few records into the RUNNING dev environment so the
 * activity / trace-review pages have something to show. It imitates the API
 * test helpers (tests/support/axios.ts) but authenticates as a real dev user
 * (alban.mouton@koumoul.com) and targets dev accounts, not test users.
 *
 * Run it (dev env must be up — `bash dev/status.sh`):
 *   npm run dev-fixtures
 *
 * Idempotent-ish: settings are upserted; conversations use stable ids, so a
 * re-run appends more turns to the same conversations rather than duplicating
 * them. It never deletes anything.
 */
import { axiosAuth } from '@data-fair/lib-node/axios-auth.js'

const directoryUrl = `http://localhost:${process.env.NGINX_PORT}/simple-directory`
const baseURL = `http://localhost:${process.env.DEV_API_PORT}`

// Mock-provider settings: the mock model answers "hello" with "world" and needs
// no API key, so the dev env can chat with zero external configuration.
const settingsData = {
  providers: [
    { id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }
  ],
  models: {
    assistant: {
      model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
      inputPricePerMillion: 0,
      outputPricePerMillion: 0
    }
  },
  quotas: {
    global: { unlimited: true, monthlyLimit: 0 },
    admin: { unlimited: true, monthlyLimit: 0 },
    contrib: { unlimited: false, monthlyLimit: 100 },
    user: { unlimited: false, monthlyLimit: 50 },
    external: { unlimited: false, monthlyLimit: 0 },
    anonymous: { unlimited: false, monthlyLimit: 0 }
  },
  // store traces so the seeded conversations show up on the review pages
  storeTraces: true
}

// One stored conversation: its experimental flags (shown as chips on the review
// page) and the per-turn message arrays sent to the gateway. Flags are constant
// per conversation in production, so we set them once per conversation here.
const conversations = [
  {
    ownerType: 'user', ownerId: 'albanm',
    convId: 'dev-fixture-explore',
    flags: { toolExploration: true, subAgents: true, mermaid: false },
    turns: [
      [{ role: 'user', content: 'hello' }],
      [{ role: 'user', content: 'hello' }, { role: 'assistant', content: 'world' }, { role: 'user', content: 'call tool weather {"city":"Paris"}' }]
    ]
  },
  {
    ownerType: 'user', ownerId: 'albanm',
    convId: 'dev-fixture-default',
    flags: { toolExploration: false, subAgents: true, mermaid: false },
    turns: [
      [{ role: 'user', content: 'hello' }]
    ]
  },
  {
    ownerType: 'organization', ownerId: 'dev1',
    convId: 'dev-fixture-mermaid',
    flags: { toolExploration: false, subAgents: false, mermaid: true },
    turns: [
      [{ role: 'user', content: 'hello' }],
      [{ role: 'user', content: 'what is the weather' }]
    ]
  }
]

async function main () {
  const creds = { email: 'alban.mouton@koumoul.com', password: 'passwd', axiosOpts: { baseURL }, directoryUrl }
  // adminMode so the settings PUT (which requires admin mode) is accepted; albanm
  // is a global admin. This session also serves as the gateway caller for the
  // personal account (it is the owner, so role resolves to admin/unlimited).
  const adminAx = await axiosAuth({ ...creds, adminMode: true })
  // A session scoped INTO the dev1 org: the gateway resolves the caller's role
  // from org membership (admin), so quotas apply — an admin-mode personal session
  // would be seen as `external` on someone else's org and blocked.
  const orgAx = await axiosAuth({ ...creds, org: 'dev1' })
  const gatewayAxFor = (ownerType: string) => ownerType === 'organization' ? orgAx : adminAx

  const owners = [...new Set(conversations.map(c => `${c.ownerType}/${c.ownerId}`))]
  for (const owner of owners) {
    await adminAx.put(`/api/settings/${owner}`, settingsData)
    console.log(`settings written for ${owner}`)
  }

  for (const conv of conversations) {
    const ax = gatewayAxFor(conv.ownerType)
    // The gateway records the agent-chat-flags cookie onto each stored trace.
    // Scope it to the gateway path so the jar sends it only on these calls.
    const flagCookie = `agent-chat-flags=${encodeURIComponent(JSON.stringify(conv.flags))}; Path=/api/gateway; SameSite=Lax`
    await ax.cookieJar.setCookie(flagCookie, baseURL)

    for (let i = 0; i < conv.turns.length; i++) {
      await ax.post(`/api/gateway/${conv.ownerType}/${conv.ownerId}/v1/chat/completions`,
        { model: 'assistant', messages: conv.turns[i] },
        { headers: { 'x-trace-consent': 'yes', 'x-trace-conversation': conv.convId, 'x-trace-ctx': `turn:${conv.convId}-${i}` } })
    }
    console.log(`seeded conversation ${conv.convId} (${conv.ownerType}/${conv.ownerId}, ${conv.turns.length} turn(s))`)
  }

  // Traces are written fire-and-forget; wait until they are queryable so the
  // script's success means the data is really there.
  for (const owner of owners) {
    const expected = conversations.filter(c => `${c.ownerType}/${c.ownerId}` === owner).length
    let count = 0
    for (let i = 0; i < 50 && count < expected; i++) {
      const res = await adminAx.get(`/api/traces/${owner}`)
      count = res.data.results.length
      if (count < expected) await new Promise(resolve => setTimeout(resolve, 100))
    }
    console.log(`${owner}: ${count} stored conversation(s)`)
  }

  const ui = `http://localhost:${process.env.NGINX_PORT}/agents`
  console.log('\nDone. Browse the seeded data at:')
  for (const owner of owners) console.log(`  activity: ${ui}/${owner}/activity`)
  for (const conv of conversations) console.log(`  review:   ${ui}/traces/${conv.convId}/review`)
}

main().then(() => {
  // Force exit: the authenticated axios clients keep HTTP keep-alive sockets
  // open, which would otherwise keep the event loop alive and hang the process.
  process.exit(0)
}).catch(err => {
  console.error('fixtures failed:', err?.response?.data ?? err?.message ?? err)
  process.exit(1)
})

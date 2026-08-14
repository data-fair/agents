const SD = 'http://localhost:13992/simple-directory'
const API = 'http://localhost:13993'

const login = async (email, adminMode = false) => {
  const res = await fetch(`${SD}/api/auth/password`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'passwd', adminMode })
  })
  const callback = await res.text()
  const cbRes = await fetch(callback, { redirect: 'manual' })
  const cookies = cbRes.headers.getSetCookie().map(c => c.split(';')[0])
  return cookies.join('; ')
}

const call = async (token, method, path, body) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'content-type': 'application/json', cookie: token },
    body: body ? JSON.stringify(body) : undefined
  })
  const text = await res.text()
  console.log(method, path, res.status, text.slice(0, 2000))
  return text
}

const token = await login('superadmin@test.com', true)
const defaultQuotas = {
  admin: { unlimited: true, monthlyLimit: 0 },
  contrib: { unlimited: false, monthlyLimit: 0 },
  user: { unlimited: false, monthlyLimit: 0 },
  external: { unlimited: false, monthlyLimit: 0 },
  anonymous: { unlimited: false, monthlyLimit: 0 },
  untrusted: { unlimited: false, monthlyLimit: 0 }
}
await call(token, 'PUT', '/api/settings/organization/test1', {
  providers: [{ id: 'mock-provider', type: 'mock', name: 'Mock Provider', enabled: true }],
  models: [{
    model: { id: 'mock-model', name: 'Mock Model', provider: { type: 'mock', name: 'Mock Provider', id: 'mock-provider' } },
    usage: ['assistant', 'tools', 'summarizer', 'evaluator', 'moderator'],
    multiplier: 1
  }]
})
await call(token, 'PUT', '/api/settings/organization/test1/org', {
  modelMapping: { assistant: { provider: 'mock-provider', id: 'mock-model', name: 'Mock Model' } },
  quotas: defaultQuotas,
  moderation: { enabled: false, categories: ['anonymous', 'external'] },
  storeTraces: false
})
await call(token, 'GET', '/api/catalog/organization/test1?usage=assistant')
await call(token, 'GET', '/api/usage/organization/test1')

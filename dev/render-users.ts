/**
 * Render dev/resources/users.json from its committed template.
 *
 * docker-compose mounts that file straight into simple-directory, which reads it VERBATIM — it does
 * no placeholder substitution of its own. A fixture that has to name a URL therefore cannot write
 * the port literally, because the ports are drawn per checkout (df-dev init-env): the autonomous-agent
 * NHI fixtures declare their issuer as http://localhost:{NGINX_PORT}/agents/api/nhi and are resolved here.
 *
 * Run by `df-dev setup` (dev/dev.json "setup"), by the status pane right before it starts the
 * containers (.zellij.kdl), and by CI: so `df-dev init-env --force` drawing new ports can never leave
 * simple-directory with an issuer naming a dead port — the token exchange would then fail with
 * simple-directory's uniform 401, with nothing pointing here.
 */
import { readFileSync, writeFileSync, renameSync } from 'node:fs'
import { parseEnv } from 'node:util'

const root = new URL('..', import.meta.url).pathname

// Substituted ONLY from the .env file, never from the ambient process.env: run from a shell that
// exported a previous .env (a zellij session started before `init-env --force`), a placeholder would
// otherwise resolve to the PREVIOUS port, the guard below would not trip, and the result is the same
// silent 401.
let values: Record<string, string>
try {
  values = parseEnv(readFileSync(root + '.env', 'utf8')) as Record<string, string>
} catch (err: any) {
  if (err.code !== 'ENOENT') throw err
  console.error('no .env in this checkout, run "npx --no df-dev setup" first')
  process.exit(1)
}

let raw = readFileSync(root + 'dev/resources/users.template.json', 'utf8')
for (const [key, value] of Object.entries(values)) {
  // Escaped for the JSON string it lands in. Ports make this a no-op today; it means a future
  // non-numeric value cannot produce a users.json simple-directory fails to parse.
  raw = raw.replaceAll(`{${key}}`, JSON.stringify(String(value)).slice(1, -1))
}
// Case-insensitive on the name: a lowercase typo like {nginx_port} is still a placeholder, and would
// otherwise pass this guard and reach simple-directory literally.
const unresolved = raw.match(/\{[A-Za-z_][A-Za-z0-9_]*\}/g)
if (unresolved) {
  // Fail loudly: an unresolved placeholder would reach simple-directory as a literal and only
  // surface later as an unexplained 401 from the token exchange.
  console.error('unresolved placeholders in users.template.json:', [...new Set(unresolved)].join(', '))
  console.error('known values (.env):', Object.keys(values).join(', '))
  process.exit(1)
}
// Parsed before being published: simple-directory reads this file with readFileSync at boot and a
// malformed one takes the container down, which is a worse failure than this one.
JSON.parse(raw)
writeFileSync(root + 'dev/resources/users.json.tmp', raw)
renameSync(root + 'dev/resources/users.json.tmp', root + 'dev/resources/users.json')

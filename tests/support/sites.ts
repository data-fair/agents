/**
 * Sites in the dev simple-directory, created with its sites secret (SECRET_SITES in docker-compose.yml).
 * Sites live in simple-directory's mongo whatever its user storage, so a spec can give an organization
 * a second domain. The host never has to resolve: every call naming it goes through a private URL with
 * the host in x-forwarded-host.
 */
import axios from 'axios'

const sitesUrl = `http://localhost:${process.env.NGINX_PORT}/simple-directory/api/sites`
const key = 'secret-sites'

export const portalHost = (name: string) => `${name}.localhost:${process.env.NGINX_PORT}`

/**
 * `auth` sets the site's authentication mode, which the secret route does not take: simple-directory's PATCH
 * does, for a superadmin in admin mode.
 */
export async function createSite (host: string, owner: { type: 'organization', id: string, name: string }, auth?: { authMode: string, authOnlyOtherSite?: string }): Promise<string> {
  const res = await axios.post(sitesUrl, { owner, host }, { params: { key } })
  if (auth) {
    const { superAdmin } = await import('./axios.ts')
    await (await superAdmin).patch(`${sitesUrl}/${res.data._id}`, auth)
  }
  return res.data._id
}

export async function deleteSite (id: string): Promise<void> {
  await axios.delete(`${sitesUrl}/${id}`, { params: { key } })
}

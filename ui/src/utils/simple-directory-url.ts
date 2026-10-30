/**
 * The access-ref form names simple-directory with a root-absolute `/simple-directory/...`, but this
 * app is served under a site path (window.__SITE_PATH, e.g. `/agents`), where the directory lives at
 * `$sitePath + '/simple-directory'` — the same prefixing trap use-autonomous-agent-enrolment.ts
 * documents for the NHI calls. json-layout fetches getItems URLs through the `fetch` option, so this
 * rewrite is handed to it there.
 *
 * Absolute urls only: json-layout passes an href built from window.location.origin, and a relative
 * url here would mean the caller forgot something, so it is returned untouched.
 */
export function rewriteSimpleDirectoryUrl (url: string, sdUrl: string): string {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return url
  }
  const prefix = '/simple-directory'
  if (parsed.pathname === prefix || parsed.pathname.startsWith(prefix + '/')) {
    parsed.pathname = sdUrl + parsed.pathname.slice(prefix.length)
  }
  return parsed.href
}

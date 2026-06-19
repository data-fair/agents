// Sync breadcrumbs to the host application that embeds this UI in an iframe.
// The data-fair shell listens for `{ breadcrumbs }` messages and renders them
// above the frame (same convention as the other data-fair services, e.g.
// processings). `to` entries are HOST routes (data-fair SPA paths) navigated on
// the host router; the d-frame then syncs the iframe back to the matching page.
// In standalone mode (no parent frame) there is nothing to render, so we log.
export const setBreadcrumbs = (breadcrumbs: { text: string, to?: string }[]) => {
  if (window.parent && window.parent !== window) parent.postMessage({ breadcrumbs }, '*')
  else console.log('Breadcrumbs:', breadcrumbs)
}

export default setBreadcrumbs

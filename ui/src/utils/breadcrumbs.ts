// Sync breadcrumbs to the host application that embeds this UI in an iframe.
// The data-fair shell listens for `{ breadcrumbs }` messages and renders them
// above the frame (same convention as the other data-fair services, e.g.
// processings). `to` entries are SPA routes navigated back inside this frame.
export const setBreadcrumbs = (breadcrumbs: { text: string; to?: string }[]) => {
  if (window.parent && window.parent !== window) parent.postMessage({ breadcrumbs }, '*')
  else console.log('Breadcrumbs:', breadcrumbs)
}

export default setBreadcrumbs

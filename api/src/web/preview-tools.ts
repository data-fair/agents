// Exact names only: the catalog also holds external MCP servers' tools, whose names must not match by suffix.
const PREVIEW_TOOL_NAMES = ['datafair_preview_application', 'portals_preview_portal_page']

/** The platform's preview tools present in the catalog, in a fixed order. */
export const selectPreviewTools = (catalogTools: Record<string, unknown> | undefined): string[] =>
  PREVIEW_TOOL_NAMES.filter(name => Object.prototype.hasOwnProperty.call(catalogTools ?? {}, name))

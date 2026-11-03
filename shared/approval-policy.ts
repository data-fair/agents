/**
 * The approval routes of a configured autonomous agent: who decides each class of its catalog calls. In
 * shared/ because the server applies them to every turn and the admin page diffs against their default:
 * one copy, so the default a page shows is the one a turn applies.
 * docs/superpowers/specs/2026-11-03-auto-approval-design.md, "The routing"
 */

export type ApprovalClass = 'readOnly' | 'write' | 'destructive'
/** Who decides a reviewed class of call: the reviewer alone, or the reviewer then a person. */
export type ReviewRoute = 'reviewer' | 'reviewer+person'
/** The route of each class that makes changes. A read is never reviewed; there is no unchecked route. */
export type ApprovalRoutes = { write: ReviewRoute, destructive: ReviewRoute }

/**
 * Writes are reviewed, destructive calls reviewed then put to a person. A write put to a person by default
 * would card every tool of every server that declares no annotations — most of them — and teach people to
 * click Approve without reading.
 */
export const DEFAULT_APPROVAL_ROUTES: ApprovalRoutes = { write: 'reviewer', destructive: 'reviewer+person' }

/** The route of a class under the agent's routes (each missing one at its default); none for a read. */
export const routeFor = (cls: ApprovalClass, routes?: Partial<ApprovalRoutes>): ReviewRoute | undefined =>
  cls === 'readOnly' ? undefined : routes?.[cls] ?? DEFAULT_APPROVAL_ROUTES[cls]

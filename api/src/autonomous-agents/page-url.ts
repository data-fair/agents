/**
 * Pure: the UI links a notification carries to an autonomous agent's page (ui/src/pages/[type]/[id]/agents/).
 * A run has its own page, `…/runs/<runId>`: a task run is read there, and a conversation run's page
 * sends the reader on to its conversation's review. Links of the earlier shape (`?tab=history&run=`)
 * are redirected by the agent page.
 */
import type { AccountKeys } from '@data-fair/lib-express'

export const agentPageUrl = (siteUrl: string, owner: Pick<AccountKeys, 'type' | 'id'>, agentId: string) =>
  `${siteUrl.replace(/\/+$/, '')}/agents/${owner.type}/${owner.id}/agents/${agentId}`

export const agentRunUrl = (siteUrl: string, owner: Pick<AccountKeys, 'type' | 'id'>, agentId: string, runId: string) =>
  `${agentPageUrl(siteUrl, owner, agentId)}/runs/${runId}`

import { tool, jsonSchema } from 'ai'
import type { Tool } from 'ai'
import { ofetch } from 'ofetch'
import * as listDatasets from '@data-fair/agent-tools-data-fair/list-datasets'

export interface EvaluatorDataToolsOpts {
  accountType: string
  accountId: string
  department?: string
  dataFairApiPath: string
  // injectable for tests; defaults to a same-origin, credentialed ofetch instance
  apiFetch?: (path: string, opts?: { query?: Record<string, string> }) => Promise<any>
}

const UNAVAILABLE = 'Data exploration is unavailable here (the data-fair API could not be reached). This evaluator may be running outside a data-fair deployment, or a superadmin may need to enable admin mode to access this account.'

export function buildEvaluatorDataTools (opts: EvaluatorDataToolsOpts): Record<string, Tool> {
  const apiFetch = opts.apiFetch ?? ofetch.create({ baseURL: opts.dataFairApiPath, credentials: 'include' })
  const ownerFilter = opts.department
    ? `${opts.accountType}:${opts.accountId}:${opts.department}`
    : `${opts.accountType}:${opts.accountId}`

  // Wrap an execute so any fetch failure degrades to a clear message instead of throwing.
  const safe = <A>(fn: (args: A) => Promise<string>) => async (args: A): Promise<string> => {
    try {
      return await fn(args)
    } catch (err: any) {
      const status = err?.response?.status ?? err?.status
      return status ? `${UNAVAILABLE} (HTTP ${status})` : UNAVAILABLE
    }
  }

  return {
    list_datasets: tool({
      description: listDatasets.schema.description,
      inputSchema: jsonSchema(listDatasets.schema.inputSchema as any),
      execute: safe(async (params: listDatasets.Params) => {
        const { path, query } = listDatasets.buildQuery(params)
        query.owner = ownerFilter
        const data = await apiFetch(path, { query })
        const page = Math.max(params.page || 1, 1)
        const size = Math.min(Math.max(params.size || 10, 1), 50)
        return listDatasets.formatResult(data, page, size).text
      })
    })
  }
}

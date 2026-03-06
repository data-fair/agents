import { tool } from 'ai'
import { z } from 'zod'
import { createAxios } from './axios.ts'
import type { AxiosInstance } from 'axios'

export const description = 'Full-text search for datasets in DataFair. Uses French keywords to search across dataset titles, descriptions, and metadata. Returns a preview of datasets with their essential metadata: ID, title, description, and link to the dataset page that must be included in responses. Then use describe_dataset to get detailed metadata.'

export const inputSchema = z.object({
  query: z.string().min(3, 'Search term must be at least 3 characters long').describe('French keywords for full-text search (simple keywords, not sentences). Examples: "élus", "DPE", "entreprises", "logement social"')
})

export const outputSchema = z.object({
  count: z.number().describe('Number of datasets matching the full-text search criteria'),
  datasets: z.array(
    z.object({
      id: z.string().describe('Unique dataset ID (required for describe_dataset and search_data tools)'),
      title: z.string().describe('Dataset title'),
      summary: z.string().optional().describe('A summary of the dataset content'),
      link: z.string().describe('Link to the dataset page (must be included in responses as citation source)'),
    })
  ).describe('An array of the top 20 datasets matching the full-text search criteria.')
})

export const execute = async (params: z.infer<typeof inputSchema>, axios: AxiosInstance): Promise<z.infer<typeof outputSchema>> => {
  // Fetch datasets matching the search criteria - optimized for discovery
  const fetchedData = (await axios.get(
    '/catalog/datasets',
    { params: { q: params.query, size: 20, select: 'id,title,summary' } }
  )).data

  return {
    datasets: fetchedData.results.map((dataset: any) => {
      const result: any = {
        id: dataset.id,
        title: dataset.title,
        link: dataset.page
      }

      if (dataset.summary) result.summary = dataset.summary

      return result
    }),
    count: fetchedData.count
  }
}

export const createTool = (dataFairUrl: string, cookies?: string) => {
  const axios = createAxios(dataFairUrl, cookies)
  return tool({
    description,
    inputSchema,
    outputSchema,
    strict: true,
    execute: async (params) => execute(params, axios)
  })
}

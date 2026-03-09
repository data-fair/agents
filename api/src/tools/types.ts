import { z } from 'zod'
import type { AxiosInstance } from 'axios'
import type { Tool } from 'ai'

export type ToolModule = {
  description: string
  inputSchema: z.ZodType
  outputSchema: z.ZodType
  execute: (params: any, axios: AxiosInstance) => Promise<any>
  createTool: (dataFairUrl: string, cookies?: string) => Tool
}

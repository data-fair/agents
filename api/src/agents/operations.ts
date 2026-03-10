/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 */

import type { Provider, ModelInfo } from '#types'
import type { ToolSet, LanguageModel } from 'ai'
import { tool, generateText } from 'ai'
import { z } from 'zod'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createMistral } from '@ai-sdk/mistral'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { createOllama } from 'ai-sdk-ollama'
import { searchDatasets, describeDataset, searchData, aggregateData } from '../tools/datasets/index.ts'
import { createMockLanguageModel } from './mock-model.ts'
import { TraceIntegration } from '../telemetry/trace-integration.ts'

export interface AgentInfo {
  id: string
  name: string
}

export const listAgents = (): AgentInfo[] => [
  { id: 'back-office-assistant', name: 'Data Fair Assistant' }
]

export { createMockLanguageModel }

export function createModel (provider: Provider, modelId: string): LanguageModel {
  switch (provider.type) {
    case 'openai':
      return createOpenAI({ apiKey: provider.apiKey })(modelId)
    case 'anthropic':
      return createAnthropic({ apiKey: provider.apiKey })(modelId)
    case 'google':
      return createGoogleGenerativeAI({ apiKey: provider.apiKey })(modelId)
    case 'mistral':
      return createMistral({ apiKey: provider.apiKey })(modelId)
    case 'openrouter':
      return createOpenRouter({ apiKey: provider.apiKey })(modelId) as unknown as LanguageModel
    case 'ollama':
      return createOllama({ baseURL: provider.baseURL })(modelId)
    case 'mock':
      return createMockLanguageModel()
    default:
      throw new Error(`Unknown provider type: ${(provider as Provider).type}`)
  }
}

export function getDatasetTools (dataFairUrl: string, cookies?: string): ToolSet {
  return {
    searchDatasets: searchDatasets.createTool(dataFairUrl, cookies),
    describeDataset: describeDataset.createTool(dataFairUrl, cookies),
    searchData: searchData.createTool(dataFairUrl, cookies),
    aggregateData: aggregateData.createTool(dataFairUrl, cookies)
  }
}

export function createDatasetsExplorerTool (
  dataFairUrl: string,
  cookies: string | undefined,
  providers: Provider[],
  modelInfo: ModelInfo | undefined,
  fallbackModel: LanguageModel,
  traceId?: string,
  traceUserId?: string,
  traceCollection?: any
) {
  const model = modelInfo
    ? createModel(providers.find(p => p.id === modelInfo.provider.id)!, modelInfo.id)
    : fallbackModel

  const datasetsTools = getDatasetTools(dataFairUrl, cookies)

  const inputSchema = z.object({
    question: z.string().describe('The user question about datasets or data to answer')
  })

  const outputSchema = z.object({
    answer: z.string().describe('The answer to the user question'),
    sources: z.array(z.object({
      tool: z.string().describe('The tool that was called'),
      input: z.any().describe('The input parameters to the tool')
    })).optional().describe('The tools that were called to answer the question, providing sourcing information')
  })

  const telemetryConfig = traceId && traceUserId && traceCollection
    ? {
        experimental_telemetry: {
          isEnabled: true,
          functionId: `datasetsExplorer-${traceId}`,
          metadata: {
            traceId,
            userId: traceUserId
          },
          integrations: [new TraceIntegration(traceId, traceUserId, traceCollection)]
        }
      }
    : {}

  return tool({
    description: 'Explore datasets in Data Fair to answer user questions about data. Use this tool when users ask about datasets, data, statistics, or want to analyze data.',
    inputSchema,
    outputSchema,
    strict: true,
    execute: async ({ question }: z.infer<typeof inputSchema>) => {
      const result = await generateText({
        model,
        system: 'You are a data-fair datasets explorer. You aim at answering user questions using search tools and provide both responses and some sourcing elements.',
        prompt: question,
        tools: datasetsTools,
        ...telemetryConfig
      })

      const toolCalls = result.toolCalls.map(tc => ({
        tool: tc.toolName,
        input: tc.input
      }))

      return {
        answer: result.text,
        sources: toolCalls.length > 0 ? toolCalls : undefined
      }
    }
  })
}

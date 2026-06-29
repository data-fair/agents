import { Router } from 'express'
import { type AccountKeys, assertAccountRole, reqSessionAuthenticated } from '@data-fair/lib-express'
import { getRawSettings } from '../settings/service.ts'
import { Ollama } from 'ollama'
import memoize from 'memoizee'
// lib-node axios instance: shorter stack traces, request-context augmentation on
// errors, and pooled http(s) agents tuned for nodejs.
import axios from '@data-fair/lib-node/axios.js'
import type { Model, Provider, Settings } from '#types'
import { scalewayBaseURL, describeFetchError } from './operations.ts'

const router = Router()
export default router

type CoreModelInfo = { id: string, name: string }

/**
 * A provider whose model listing failed. Surfaced to the admin alongside the
 * models so an empty (or short) dropdown is explained instead of silent — the
 * fetch helpers below intentionally let errors propagate up to here.
 */
export type ProviderModelsError = {
  providerId: string
  providerName: string
  providerType: string
  status?: number
  message: string
}

async function fetchOpenAIModels (apiKey: string): Promise<CoreModelInfo[]> {
  const response = await axios.get('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` }
  })
  return response.data.data
    .filter((m: any) => !m.id.startsWith('gpt-') || m.id.includes('-'))
    .map((model: any) => ({
      id: model.id,
      name: model.name || model.id
    }))
}

async function fetchOpenAICompatibleModels (baseURL: string, apiKey?: string): Promise<CoreModelInfo[]> {
  const headers: Record<string, string> = {}
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`
  const response = await axios.get(`${baseURL.replace(/\/$/, '')}/models`, { headers })
  return response.data.data.map((model: any) => ({
    id: model.id,
    name: model.name || model.id
  }))
}

async function fetchAnthropicModels (apiKey: string): Promise<CoreModelInfo[]> {
  const response = await axios.get('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }
  })
  return response.data.data.map((model: any) => ({
    id: model.id,
    name: model.display_name || model.id
  }))
}

async function fetchGoogleModels (apiKey: string): Promise<CoreModelInfo[]> {
  const response = await axios.get(
    `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
  )
  return response.data.models.map((model: any) => ({
    id: model.name.split('/').pop(),
    name: model.displayName || model.name
  }))
}

async function fetchMistralModels (apiKey: string): Promise<CoreModelInfo[]> {
  const response = await axios.get('https://api.mistral.ai/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` }
  })
  return response.data.data.map((model: any) => ({
    id: model.id,
    name: model.id
  }))
}

async function fetchOpenRouterModels (apiKey: string): Promise<CoreModelInfo[]> {
  const response = await axios.get('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` }
  })
  return response.data.data.map((model: any) => ({
    id: model.id,
    name: model.name || model.id
  }))
}

async function fetchOllamaModels (baseURL: string): Promise<CoreModelInfo[]> {
  const ollama = new Ollama({ host: baseURL })
  const models = await ollama.list()
  return models.models.map((model: any) => ({
    id: model.name,
    name: model.name
  }))
}

async function fetchModelsForProvider (
  provider: Provider
): Promise<CoreModelInfo[]> {
  if (provider.type === 'ollama') {
    const baseURL = provider.baseURL
    return fetchOllamaModels(baseURL)
  }

  if (provider.type === 'mock') {
    return [
      { id: 'mock-model', name: 'Mock Model' },
      { id: 'mock-tools', name: 'Mock Tools Model' },
      { id: 'mock-summarizer', name: 'Mock Summarizer Model' },
      { id: 'evaluator-mock-model', name: 'Evaluator Mock Model' }
    ]
  }

  if (provider.type === 'openai-compatible') {
    return fetchOpenAICompatibleModels(provider.baseURL, provider.apiKey)
  }

  if (!provider.apiKey) {
    return []
  }

  switch (provider.type) {
    case 'openai':
      return fetchOpenAIModels(provider.apiKey)
    case 'anthropic':
      return fetchAnthropicModels(provider.apiKey)
    case 'google':
      return fetchGoogleModels(provider.apiKey)
    case 'mistral':
      return fetchMistralModels(provider.apiKey)
    case 'openrouter':
      return fetchOpenRouterModels(provider.apiKey)
    case 'scaleway':
      return fetchOpenAICompatibleModels(scalewayBaseURL(provider.projectId), provider.apiKey)
    default:
      return []
  }
}

export const getModelsForOwner = memoize(
  async (ownerType: string, ownerId: string, settings: Settings): Promise<{ models: Model[], errors: ProviderModelsError[] }> => {
    const models: Model[] = []
    const errors: ProviderModelsError[] = []

    for (const provider of settings.providers) {
      if (!provider.enabled) continue
      try {
        const providerModels = await fetchModelsForProvider(provider)
        models.push(...providerModels.map(m => ({
          id: m.id,
          name: m.name,
          provider: { type: provider.type, name: provider.name, id: provider.id }
        })))
      } catch (err) {
        const { status, message } = describeFetchError(err)
        // Log only the compact description: this is an expected, surfaced error
        // (returned in `errors` below), so dumping the full Axios object with its
        // request/stack just floods the logs without adding actionable detail.
        console.warn(`Failed to fetch models for provider ${provider.type}/${provider.id}: ${status ? `[${status}] ` : ''}${message}`)
        errors.push({ providerId: provider.id, providerName: provider.name, providerType: provider.type, status, message })
      }
    }

    return { models, errors }
  },
  {
    promise: true,
    maxAge: 5 * 60 * 1000,
    primitive: true,
    normalizer: ([, , settings]: [string, string, any]) =>
      `${settings.owner.type}:${settings.owner.id}:${settings.updatedAt}`
  }
)

router.get('/:type/:id', async (req, res, next) => {
  const owner = req.params as AccountKeys
  const session = reqSessionAuthenticated(req)
  assertAccountRole(session, owner, 'admin')

  const settings = await getRawSettings(owner)

  if (!settings || !settings.providers || settings.providers.length === 0) {
    res.json({ results: [], count: 0, errors: [] })
    return
  }

  const { models, errors } = await getModelsForOwner(owner.type, owner.id, settings)

  res.json({ results: models, count: models.length, errors })
})

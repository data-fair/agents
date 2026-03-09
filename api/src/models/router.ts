import { Router } from 'express'
import { type AccountKeys, assertAccountRole, reqSessionAuthenticated } from '@data-fair/lib-express'
import { getRawSettings } from '../settings/service.ts'
import { Ollama } from 'ollama'
import memoize from 'memoizee'
import axios from 'axios'
import type { ModelInfo, Provider, Settings } from '#types'

const router = Router()
export default router

type CoreModelInfo = { id: string, name: string }

async function fetchOpenAIModels (apiKey: string): Promise<CoreModelInfo[]> {
  try {
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` }
    })
    return response.data.data
      .filter((m: any) => !m.id.startsWith('gpt-') || m.id.includes('-'))
      .map((model: any) => ({
        id: model.id,
        name: model.name || model.id
      }))
  } catch (err) {
    console.error('Failed to fetch OpenAI models:', err)
    return []
  }
}

async function fetchAnthropicModels (apiKey: string): Promise<CoreModelInfo[]> {
  try {
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
  } catch (err) {
    console.error('Failed to fetch Anthropic models:', err)
    return []
  }
}

async function fetchGoogleModels (apiKey: string): Promise<CoreModelInfo[]> {
  try {
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    )
    return response.data.models.map((model: any) => ({
      id: model.name.split('/').pop(),
      name: model.displayName || model.name
    }))
  } catch (err) {
    console.error('Failed to fetch Google models:', err)
    return []
  }
}

async function fetchMistralModels (apiKey: string): Promise<CoreModelInfo[]> {
  try {
    const response = await axios.get('https://api.mistral.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` }
    })
    return response.data.data.map((model: any) => ({
      id: model.id,
      name: model.id
    }))
  } catch (err) {
    console.error('Failed to fetch Mistral models:', err)
    return []
  }
}

async function fetchOpenRouterModels (apiKey: string): Promise<CoreModelInfo[]> {
  try {
    const response = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` }
    })
    return response.data.data.map((model: any) => ({
      id: model.id,
      name: model.name || model.id
    }))
  } catch (err) {
    console.error('Failed to fetch OpenRouter models:', err)
    return []
  }
}

async function fetchOllamaModels (baseURL: string): Promise<CoreModelInfo[]> {
  try {
    const ollama = new Ollama({ host: baseURL })
    const models = await ollama.list()
    return models.models.map((model: any) => ({
      id: model.name,
      name: model.name
    }))
  } catch (err) {
    console.error('Failed to fetch Ollama models:', err)
    return []
  }
}

async function fetchModelsForProvider (
  provider: Provider
): Promise<CoreModelInfo[]> {
  if (provider.type === 'ollama') {
    const baseURL = provider.baseURL
    return fetchOllamaModels(baseURL)
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
    default:
      return []
  }
}

export const getModelsForOwner = memoize(
  async (ownerType: string, ownerId: string, settings: Settings): Promise<ModelInfo[]> => {
    const allModels: ModelInfo[] = []

    for (const provider of settings.providers) {
      if (!provider.enabled) continue
      const models = await fetchModelsForProvider(provider)
      allModels.push(...models.map(m => ({ ...m, provider: { type: provider.type, name: provider.name, id: provider.id } })))
    }

    return allModels
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
    res.json({ results: [], count: 0 })
    return
  }

  const allModels = await getModelsForOwner(owner.type, owner.id, settings)

  res.json({ results: allModels, count: allModels.length })
})

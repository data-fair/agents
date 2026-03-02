import { Router } from 'express'
import { reqSessionAuthenticated } from '@data-fair/lib-express'
import { getSettingsByOwner } from '../settings/service.ts'
import { Ollama } from 'ollama'
import memoize from 'memoizee'
import axios from 'axios'

const router = Router()
export default router

interface ModelInfo {
  id: string
  name: string
  provider: string
  providerType: string
}

interface ProviderConfig {
  apiKey?: string
  baseURL?: string
  defaultModel?: string
  name?: string
  [key: string]: unknown
}

async function fetchOpenAIModels (apiKey: string): Promise<ModelInfo[]> {
  try {
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` }
    })
    return response.data.data
      .filter((m: any) => !m.id.startsWith('gpt-') || m.id.includes('-'))
      .map((model: any) => ({
        id: model.id,
        name: model.name || model.id,
        provider: 'OpenAI',
        providerType: 'openai'
      }))
  } catch (err) {
    console.error('Failed to fetch OpenAI models:', err)
    return []
  }
}

async function fetchAnthropicModels (apiKey: string): Promise<ModelInfo[]> {
  try {
    const response = await axios.get('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    })
    return response.data.data.map((model: any) => ({
      id: model.id,
      name: model.display_name || model.id,
      provider: 'Anthropic',
      providerType: 'anthropic'
    }))
  } catch (err) {
    console.error('Failed to fetch Anthropic models:', err)
    return []
  }
}

async function fetchGoogleModels (apiKey: string): Promise<ModelInfo[]> {
  try {
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    )
    return response.data.models.map((model: any) => ({
      id: model.name.split('/').pop(),
      name: model.displayName || model.name,
      provider: 'Google',
      providerType: 'google'
    }))
  } catch (err) {
    console.error('Failed to fetch Google models:', err)
    return []
  }
}

async function fetchMistralModels (apiKey: string): Promise<ModelInfo[]> {
  try {
    const response = await axios.get('https://api.mistral.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` }
    })
    return response.data.data.map((model: any) => ({
      id: model.id,
      name: model.id,
      provider: 'Mistral',
      providerType: 'mistral'
    }))
  } catch (err) {
    console.error('Failed to fetch Mistral models:', err)
    return []
  }
}

async function fetchOpenRouterModels (apiKey: string): Promise<ModelInfo[]> {
  try {
    const response = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` }
    })
    return response.data.data.map((model: any) => ({
      id: model.id,
      name: model.name || model.id,
      provider: 'OpenRouter',
      providerType: 'openrouter'
    }))
  } catch (err) {
    console.error('Failed to fetch OpenRouter models:', err)
    return []
  }
}

async function fetchOllamaModels (baseURL: string): Promise<ModelInfo[]> {
  try {
    const ollama = new Ollama({ host: baseURL })
    const models = await ollama.list()
    return models.models.map((model: any) => ({
      id: model.name,
      name: model.name,
      provider: 'Ollama',
      providerType: 'ollama'
    }))
  } catch (err) {
    console.error('Failed to fetch Ollama models:', err)
    return []
  }
}

async function fetchModelsForProvider (
  providerType: string,
  config: ProviderConfig
): Promise<ModelInfo[]> {
  if (providerType === 'ollama') {
    const baseURL = config.baseURL || 'http://localhost:11434'
    return fetchOllamaModels(baseURL)
  }

  if (providerType === 'custom') {
    return []
  }

  if (!config.apiKey) {
    return []
  }

  switch (providerType) {
    case 'openai':
      return fetchOpenAIModels(config.apiKey)
    case 'anthropic':
      return fetchAnthropicModels(config.apiKey)
    case 'google':
      return fetchGoogleModels(config.apiKey)
    case 'mistral':
      return fetchMistralModels(config.apiKey)
    case 'openrouter':
      return fetchOpenRouterModels(config.apiKey)
    default:
      return []
  }
}

const getModelsForOwner = memoize(
  async (ownerType: string, ownerId: string, settings: any): Promise<ModelInfo[]> => {
    const allModels: ModelInfo[] = []

    for (const provider of settings.providers) {
      if (!provider.enabled) continue

      const config = provider[provider.type] as ProviderConfig | undefined
      if (!config) continue

      const models = await fetchModelsForProvider(provider.type, config)
      allModels.push(...models)
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

router.get('', async (req, res, next) => {
  const session = reqSessionAuthenticated(req)
  const account = session.account

  const settings = await getSettingsByOwner(session, account.type, account.id)

  if (!settings || !settings.providers || settings.providers.length === 0) {
    res.json({ results: [], count: 0 })
    return
  }

  const allModels = await getModelsForOwner(account.type, account.id, settings)

  res.json({ results: allModels, count: allModels.length })
})

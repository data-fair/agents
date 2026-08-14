/**
 * service.ts binds the pure catalog/resolution operations to #config.
 */
import type { LanguageModel } from 'ai'
import config from '#config'
import type { Provider, Settings } from '#types'
import { getModelCatalog, getRoleModel, createModel, type CatalogModel, type ModelRole, type GlobalAiProvider, type GlobalAiModel, type DefaultModelRefs } from './operations.ts'

export function getCatalog (settings: Settings | null): CatalogModel[] {
  return getModelCatalog(config.providers as GlobalAiProvider[], config.models as GlobalAiModel[], settings?.providers ?? [], settings?.models ?? [])
}

export interface ResolvedRoleModel { model: LanguageModel, entry: CatalogModel }

export function resolveRoleModel (settings: Settings | null, role: ModelRole): ResolvedRoleModel {
  const catalog = getCatalog(settings)
  const entry = getRoleModel(catalog, settings?.modelMapping, config.defaultModels as DefaultModelRefs, role)
  const provider = entry.source === 'global'
    ? (config.providers as GlobalAiProvider[]).find(p => p.id === entry.provider.id)
    : settings?.providers.find(p => p.id === entry.provider.id)
  if (!provider) throw new Error(`Provider not found for model ${entry.provider.id}/${entry.id}`)
  if (provider.enabled === false) throw new Error('Provider is disabled')
  return { model: createModel(provider as Provider, entry.id), entry }
}

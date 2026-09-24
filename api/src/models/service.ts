/**
 * service.ts binds the pure catalog/resolution operations to #config.
 */
import type { LanguageModel } from 'ai'
import config from '#config'
import type { Provider, Settings } from '#types'
import { getModelCatalog, getRoleModel, getRoleDefaults, createModel, type CatalogModel, type ModelRole, type GlobalAiProvider, type GlobalAiModel, type DefaultModelRefs } from './operations.ts'

export function getCatalog (settings: Settings | null): CatalogModel[] {
  return getModelCatalog(config.providers as GlobalAiProvider[], config.models as GlobalAiModel[], settings?.providers ?? [], settings?.models ?? [])
}

/**
 * `provider` is the full provider *config* (global or org), not the {type, name, id}
 * snapshot carried by the catalog entry: callers that branch on provider capabilities
 * need the fields only the config has, e.g. `compatibility` for openai-compatible.
 */
export interface ResolvedRoleModel { model: LanguageModel, entry: CatalogModel, provider: Provider }

/** The catalog entry a role resolves to, without instantiating the SDK model. */
export function resolveRoleEntry (settings: Settings | null, role: ModelRole): CatalogModel {
  return getRoleModel(getCatalog(settings), settings?.modelMapping, config.defaultModels as DefaultModelRefs, role)
}

/** What each role resolves to when the org leaves it unmapped (see getRoleDefaults). */
export function resolveRoleDefaults (settings: Settings | null, catalog: CatalogModel[] = getCatalog(settings)) {
  return getRoleDefaults(catalog, settings?.modelMapping, config.defaultModels as DefaultModelRefs)
}

export function resolveRoleModel (settings: Settings | null, role: ModelRole): ResolvedRoleModel {
  const entry = resolveRoleEntry(settings, role)
  const provider = entry.source === 'global'
    ? (config.providers as GlobalAiProvider[]).find(p => p.id === entry.provider.id)
    : settings?.providers.find(p => p.id === entry.provider.id)
  if (!provider) throw new Error(`Provider not found for model ${entry.provider.id}/${entry.id}`)
  if (provider.enabled === false) throw new Error('Provider is disabled')
  return { model: createModel(provider as Provider, entry.id), entry, provider: provider as Provider }
}

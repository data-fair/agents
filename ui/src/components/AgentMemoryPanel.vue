<template>
  <div>
    <v-tabs v-model="tab">
      <v-tab
        value="documents"
        data-testid="memory-tab-documents"
        :text="t('documents')"
      />
      <v-tab
        value="history"
        data-testid="memory-tab-history"
        :text="t('history')"
      />
    </v-tabs>
    <div
      style="min-height: 420px"
      class="pt-4"
    >
      <v-alert
        v-if="memory && !memory.enabled"
        type="info"
        variant="tonal"
        density="compact"
        class="mb-4"
        :text="t('disabled')"
      />
      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="documents">
          <v-row>
            <v-col
              cols="12"
              md="4"
            >
              <div class="text-caption text-medium-emphasis mb-2">
                {{ t('usage', { documents: memory?.usage.documents ?? 0, maxDocuments: memory?.limits.documents ?? 0, chars: (memory?.usage.totalChars ?? 0).toLocaleString(), maxChars: (memory?.limits.totalChars ?? 0).toLocaleString() }) }}
              </div>
              <v-list density="compact">
                <v-list-item
                  v-for="doc of memory?.documents ?? []"
                  :key="doc.path"
                  :data-testid="`memory-document-${doc.path}`"
                  :title="doc.path"
                  :subtitle="doc.description"
                  :active="selected?.path === doc.path"
                  @click="open(doc.path)"
                />
              </v-list>
              <v-btn
                v-if="canConfigure"
                variant="text"
                size="small"
                :text="t('new')"
                @click="startNew()"
              />
            </v-col>
            <v-col
              cols="12"
              md="8"
            >
              <template v-if="selected">
                <v-text-field
                  v-model="selected.path"
                  :label="t('path')"
                  :readonly="!selected.isNew"
                  density="compact"
                />
                <v-text-field
                  v-model="selected.description"
                  :label="t('description')"
                  :readonly="!canConfigure"
                  density="compact"
                />
                <v-textarea
                  v-model="selected.content"
                  data-testid="memory-content"
                  :label="t('content')"
                  :readonly="!canConfigure"
                  rows="14"
                  style="font-family: monospace"
                />
                <div class="text-caption text-medium-emphasis">
                  {{ selected.updatedBy ? authorLabel(selected.updatedBy) : '' }}
                </div>
                <div
                  v-if="canConfigure"
                  class="d-flex ga-2 mt-2"
                >
                  <v-btn
                    color="primary"
                    data-testid="memory-save"
                    :loading="busy"
                    :text="t('save')"
                    @click="save()"
                  />
                  <v-btn
                    v-if="!selected.isNew && selected.path !== 'MEMORY.md'"
                    variant="text"
                    color="error"
                    :text="t('delete')"
                    @click="remove()"
                  />
                </div>
              </template>
              <div
                v-else
                class="text-medium-emphasis"
              >
                {{ t('pick') }}
              </div>
            </v-col>
          </v-row>
        </v-tabs-window-item>
        <v-tabs-window-item value="history">
          <v-list density="compact">
            <v-list-item
              v-for="version of versions"
              :key="version.id"
              data-testid="memory-version"
              :title="`${version.path} · ${version.op} · v${version.version}`"
              :subtitle="`${formatDate(version.createdAt)} · ${authorLabel(version.author)}`"
            >
              <template #append>
                <v-btn
                  v-if="canConfigure && version.author.conversationId"
                  variant="text"
                  size="small"
                  :to="`/${accountType}/${accountId}/review/${version.author.conversationId}`"
                  :text="t('source')"
                />
                <v-btn
                  v-if="canConfigure && version.content !== undefined && !version.redacted"
                  variant="text"
                  size="small"
                  data-testid="memory-version-restore"
                  :text="t('restore')"
                  @click="restore(version.id)"
                />
                <v-btn
                  v-if="canConfigure && version.content !== undefined && !version.redacted"
                  variant="text"
                  size="small"
                  color="error"
                  :text="t('redact')"
                  @click="redact(version.id)"
                />
              </template>
              <pre
                v-if="version.content !== undefined"
                class="text-caption mt-1"
                style="white-space: pre-wrap; max-height: 8em; overflow: auto"
              >{{ version.content }}</pre>
            </v-list-item>
          </v-list>
          <v-btn
            v-if="versions.length < versionsCount"
            variant="text"
            data-testid="memory-load-more"
            :text="t('loadMore')"
            @click="loadMore()"
          />
        </v-tabs-window-item>
      </v-tabs-window>
    </div>
  </div>
</template>

<i18n lang="yaml">
en:
  documents: Documents
  history: History
  disabled: Memory is turned off for this agent. Its existing memory is kept but not used.
  usage: '{documents}/{maxDocuments} documents · {chars}/{maxChars} characters'
  new: New document
  path: Path
  description: Description
  content: Content
  save: Save
  delete: Delete
  pick: Select a document.
  source: Source conversation
  restore: Restore
  redact: Redact
  loadMore: Load more
  byAgent: written by the agent during a conversation
  byConsolidation: written while tidying memory
  byUser: 'edited by {name}'
  confirmRedact: "Redact this version? This blanks the text in the memory history (who changed what, and when, is kept). It does NOT remove copies elsewhere - the conversations' recorded tool calls and, for MEMORY.md, the recorded system prompts of runs that saw it. To remove those, delete the conversations."
fr:
  documents: Documents
  history: Historique
  disabled: La mémoire est désactivée pour cet agent. Sa mémoire existante est conservée mais n'est pas utilisée.
  usage: '{documents}/{maxDocuments} documents · {chars}/{maxChars} caractères'
  new: Nouveau document
  path: Chemin
  description: Description
  content: Contenu
  save: Enregistrer
  delete: Supprimer
  pick: Sélectionnez un document.
  source: Conversation d'origine
  restore: Restaurer
  redact: Caviarder
  loadMore: Charger plus
  byAgent: écrit par l'agent pendant une conversation
  byConsolidation: écrit en remettant la mémoire en ordre
  byUser: 'modifié par {name}'
  confirmRedact: "Caviarder cette version ? Cela efface le texte dans l'historique de la mémoire (qui a modifié quoi, et quand, est conservé). Cela ne supprime PAS les copies ailleurs : les appels d'outils enregistrés dans les conversations et, pour MEMORY.md, les prompts système enregistrés des exécutions qui l'ont vu. Pour les supprimer, supprimez les conversations."
</i18n>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiNotif } from '@data-fair/lib-vue/ui-notif.js'
import { $apiPath, $fetch } from '~/context'

const props = defineProps<{
  agent: { id: string, title: string } | null
  accountType: string
  accountId: string
  canConfigure: boolean
}>()

const { t, locale } = useI18n()
const { sendUiNotif } = useUiNotif()

const tab = ref('documents')
const memory = ref<any>(null)
const versions = ref<any[]>([])
const versionsCount = ref(0)
const versionsPage = ref(1)
const selected = ref<any>(null)
const busy = ref(false)

const PAGE_SIZE = 100
const base = (agentId: string | undefined) => `${$apiPath}/memory/${props.accountType}/${props.accountId}/${agentId}`
const errorMessage = (error: any) => String(error?.data?.message ?? error?.data ?? error?.message ?? error)
const report = (error: unknown) => sendUiNotif({ type: 'error', msg: errorMessage(error), error: error as any })

// Responses are applied only while the panel still shows the autonomous agent they were fetched for, so a
// slow answer for the previous one never lands in the next one's panel.
const load = async () => {
  const agentId = props.agent?.id
  if (!agentId) return
  const [mem, vers] = await Promise.all([
    $fetch<any>(base(agentId), { credentials: 'include' }),
    $fetch<{ count: number, results: any[] }>(`${base(agentId)}/versions`, { query: { page: 1, size: PAGE_SIZE }, credentials: 'include' })
  ])
  if (props.agent?.id !== agentId) return
  memory.value = mem
  versions.value = vers.results
  versionsCount.value = vers.count
  versionsPage.value = 1
}

const loadMore = async () => {
  const agentId = props.agent?.id
  if (!agentId) return
  try {
    const page = versionsPage.value + 1
    const vers = await $fetch<{ count: number, results: any[] }>(`${base(agentId)}/versions`, { query: { page, size: PAGE_SIZE }, credentials: 'include' })
    if (props.agent?.id !== agentId) return
    versions.value = [...versions.value, ...vers.results]
    versionsCount.value = vers.count
    versionsPage.value = page
  } catch (error) { report(error) }
}

const open = async (path: string) => {
  const agentId = props.agent?.id
  if (!agentId) return
  try {
    const doc = await $fetch(`${base(agentId)}/document`, { query: { path }, credentials: 'include' })
    if (props.agent?.id === agentId) selected.value = doc
  } catch (error) { report(error) }
}

watch(() => props.agent?.id, () => {
  selected.value = null
  memory.value = null
  versions.value = []
  versionsCount.value = 0
  tab.value = 'documents'
  load().catch(report)
}, { immediate: true })

const startNew = () => { selected.value = { isNew: true, path: '', description: '', content: '' } }

// Every action reports its failure: a 409 (someone, or the agent, changed it meanwhile) or a 400 (a
// limit) must reach the admin rather than leave the dialog looking as if it saved. The reload is
// reported on its own, so a failed refresh is not mistaken for a failed write.
const act = async (fn: () => Promise<void>) => {
  busy.value = true
  try { await fn() } catch (error) { report(error) }
  try {
    await load()
    // The selection follows the refreshed state: a document that still exists is re-read, one that
    // vanished is dropped, and an unsaved new one is left alone.
    const current = selected.value
    if (current && !current.isNew) {
      if (memory.value?.documents.some((d: any) => d.path === current.path)) await open(current.path)
      else selected.value = null
    }
  } catch (error) { report(error) } finally { busy.value = false }
}

const save = () => act(async () => {
  const { path, description, content, version, isNew } = selected.value
  const written = await $fetch<any>(`${base(props.agent?.id)}/document`, { method: 'PUT', query: { path }, body: { description, content, ...(isNew ? {} : { version }) }, credentials: 'include' })
  selected.value = written
})
const remove = () => act(async () => {
  await $fetch(`${base(props.agent?.id)}/document`, { method: 'DELETE', query: { path: selected.value.path, version: selected.value.version }, credentials: 'include' })
  selected.value = null
})
const restore = (id: string) => act(async () => { await $fetch(`${base(props.agent?.id)}/versions/${id}/restore`, { method: 'POST', credentials: 'include' }) })
const redact = (id: string) => act(async () => {
  if (!window.confirm(t('confirmRedact'))) return
  await $fetch(`${base(props.agent?.id)}/versions/${id}/redact`, { method: 'POST', credentials: 'include' })
})

const authorLabel = (author: any) => author.kind === 'agent'
  ? t('byAgent')
  : author.kind === 'consolidation' ? t('byConsolidation') : t('byUser', { name: author.userName ?? author.userId })
const formatDate = (iso: string) => new Date(iso).toLocaleString(locale.value)
</script>

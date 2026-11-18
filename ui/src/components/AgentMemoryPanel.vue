<template>
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
    <v-row>
      <v-col
        cols="12"
        md="4"
      >
        <div class="text-caption text-medium-emphasis mb-2">
          {{ t('usage', { documents: memory?.usage.documents ?? 0, maxDocuments: memory?.limits.documents ?? 0, chars: (memory?.usage.totalChars ?? 0).toLocaleString(locale), maxChars: (memory?.limits.totalChars ?? 0).toLocaleString(locale) }) }}
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
        <template v-if="canConfigure && deleted.length">
          <v-list-subheader>{{ t('deleted') }}</v-list-subheader>
          <v-list density="compact">
            <v-list-item
              v-for="doc of deleted"
              :key="doc.path"
              :data-testid="`memory-deleted-${doc.path}`"
              :title="doc.path"
              :subtitle="`${formatDate(doc.deletedAt)} · ${authorLabel(doc.deletedBy)}`"
              class="text-medium-emphasis"
              @click="openHistory(doc.path)"
            />
          </v-list>
        </template>
      </v-col>
      <v-col
        cols="12"
        md="8"
      >
        <template v-if="selected">
          <v-text-field
            v-if="selected.isNew"
            v-model="selected.path"
            data-testid="memory-path"
            :label="t('path')"
            :hint="t('pathHint')"
            persistent-hint
            density="compact"
            class="mb-2"
          />
          <div
            v-else
            class="text-h6 mb-2"
          >
            {{ selected.path }}
          </div>
          <!-- keyed on the document: the markdown editor reads its value once when it mounts -->
          <!-- Read-only, the text is rendered by the chat's sanitizing markdown, not by the form: the
               markdown plugin's read-only view writes marked's HTML unsanitized, and memory text can
               come from tool output. -->
          <div
            v-if="!canConfigure"
            data-testid="memory-content"
          >
            <div
              v-if="selected.description"
              class="text-body-2 text-medium-emphasis mb-2"
            >
              {{ selected.description }}
            </div>
            <markdown-content
              :content="selected.content"
              :streaming="false"
              :mermaid="false"
            />
          </div>
          <div
            v-else
            data-testid="memory-content"
          >
            <vjsf-memory-document-form
              :key="`${selected.path}:${selected.version ?? 'new'}`"
              :model-value="{ description: selected.description, content: selected.content }"
              :options="formOptions"
              :locale="locale"
              @update:model-value="(data: any) => { selected.description = data?.description ?? ''; selected.content = data?.content ?? '' }"
            />
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ selected.updatedBy ? `${formatDate(selected.updatedAt)} · ${authorLabel(selected.updatedBy)}` : '' }}
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
              v-if="!selected.isNew"
              variant="text"
              data-testid="memory-history-open"
              :text="t('history')"
              @click="openHistory(selected.path)"
            />
            <v-spacer />
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

    <v-dialog
      :model-value="!!history"
      max-width="800"
      scrollable
      @update:model-value="history = null"
    >
      <v-card
        v-if="history"
        :title="t('historyOf', { path: history.path })"
        data-testid="memory-history"
      >
        <v-card-text>
          <v-expansion-panels
            v-model="history.opened"
            multiple
            variant="accordion"
          >
            <v-expansion-panel
              v-for="entry of historyView"
              :key="entry.version.id"
              :value="entry.version.id"
              data-testid="memory-version"
            >
              <v-expansion-panel-title>
                <div>
                  <div>{{ opLabel(entry.version) }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatDate(entry.version.createdAt) }} · {{ authorLabel(entry.version.author) }}
                  </div>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div
                  v-if="entry.description"
                  class="text-body-2 mb-2"
                >
                  {{ t('descriptionChanged', entry.description) }}
                </div>
                <div
                  v-if="entry.version.redacted"
                  class="text-medium-emphasis"
                >
                  {{ t('redacted') }}
                </div>
                <div
                  v-else-if="entry.baselineUnknown"
                  class="text-medium-emphasis"
                >
                  {{ t('noBaseline') }}
                </div>
                <div
                  v-else-if="entry.lines.length"
                  class="memory-diff text-caption"
                >
                  <div
                    v-for="(line, i) of entry.lines"
                    :key="i"
                    :class="`memory-diff-${line.kind}`"
                    v-text="diffLineText(line)"
                  />
                </div>
                <div
                  v-else-if="entry.version.op === 'update' || entry.version.op === 'restore'"
                  class="text-medium-emphasis"
                >
                  {{ t('noTextChange') }}
                </div>
                <div class="d-flex ga-2 mt-2">
                  <v-btn
                    v-if="entry.version.author.conversationId"
                    variant="text"
                    size="small"
                    :to="`/${accountType}/${accountId}/review/${entry.version.author.conversationId}`"
                    :text="t('source')"
                  />
                  <v-spacer />
                  <v-btn
                    v-if="entry.version.content !== undefined && !entry.version.redacted"
                    variant="text"
                    size="small"
                    data-testid="memory-version-restore"
                    :text="t('restore')"
                    @click="restore(entry.version.id)"
                  />
                  <v-btn
                    v-if="entry.version.content !== undefined && !entry.version.redacted"
                    variant="text"
                    size="small"
                    color="error"
                    :text="t('redact')"
                    @click="redact(entry.version.id)"
                  />
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
          <v-btn
            v-if="history.versions.length < history.count"
            variant="text"
            data-testid="memory-load-more"
            class="mt-2"
            :text="t('loadMore')"
            @click="loadMoreHistory()"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            :text="t('close')"
            @click="history = null"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<i18n lang="yaml">
en:
  history: History
  historyOf: History of {path}
  deleted: Deleted documents
  disabled: Memory is turned off for this agent. Its existing memory is kept but not used.
  usage: '{documents}/{maxDocuments} documents · {chars}/{maxChars} characters'
  new: New document
  path: Path
  pathHint: 'A name ending in .md, such as topics/datasets.md'
  save: Save
  delete: Delete
  close: Close
  pick: Select a document.
  source: Source conversation
  restore: Restore this version
  redact: Redact
  loadMore: Load older versions
  opCreate: Created
  opUpdate: Edited
  opDelete: Deleted
  opRename: 'Renamed from {path}'
  opRestore: Restored from an earlier version
  descriptionChanged: 'Description: "{before}" → "{after}"'
  redacted: This version was redacted.
  noBaseline: The version before is redacted or not loaded, so the change cannot be shown.
  noTextChange: The text did not change.
  byAgentConversation: by the agent, in a conversation
  byAgentTask: by the agent, in a planned task run
  byConsolidation: by the agent's daily memory review
  byUser: 'by {name}'
  confirmRedact: "Redact this version? This blanks the text in the memory history (who changed what, and when, is kept). It does NOT remove copies elsewhere - the conversations' recorded tool calls and, for MEMORY.md, the recorded system prompts of runs that saw it. To remove those, delete the conversations."
fr:
  history: Historique
  historyOf: Historique de {path}
  deleted: Documents supprimés
  disabled: La mémoire est désactivée pour cet agent. Sa mémoire existante est conservée mais n'est pas utilisée.
  usage: '{documents}/{maxDocuments} documents · {chars}/{maxChars} caractères'
  new: Nouveau document
  path: Chemin
  pathHint: 'Un nom terminé par .md, par exemple sujets/jeux-de-donnees.md'
  save: Enregistrer
  delete: Supprimer
  close: Fermer
  pick: Sélectionnez un document.
  source: Conversation d'origine
  restore: Restaurer cette version
  redact: Caviarder
  loadMore: Charger les versions plus anciennes
  opCreate: Créé
  opUpdate: Modifié
  opDelete: Supprimé
  opRename: 'Renommé depuis {path}'
  opRestore: Restauré depuis une version antérieure
  descriptionChanged: 'Description : « {before} » → « {after} »'
  redacted: Cette version a été caviardée.
  noBaseline: La version précédente est caviardée ou pas encore chargée, la modification ne peut pas être affichée.
  noTextChange: Le texte n'a pas changé.
  byAgentConversation: par l'agent, dans une conversation
  byAgentTask: par l'agent, pendant l'exécution d'une tâche planifiée
  byConsolidation: par la révision quotidienne de sa mémoire par l'agent
  byUser: 'par {name}'
  confirmRedact: "Caviarder cette version ? Cela efface le texte dans l'historique de la mémoire (qui a modifié quoi, et quand, est conservé). Cela ne supprime PAS les copies ailleurs : les appels d'outils enregistrés dans les conversations et, pour MEMORY.md, les prompts système enregistrés des exécutions qui l'ont vu. Pour les supprimer, supprimez les conversations."
</i18n>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocaleDayjs } from '@data-fair/lib-vue/locale-dayjs.js'
import { useUiNotif } from '@data-fair/lib-vue/ui-notif.js'
import { $apiPath, $fetch } from '~/context'
import { historyEntries, type DiffLine, type MemoryVersionRow } from '~/utils/memory-history'
import VjsfMemoryDocumentForm from '~/components/vjsf/vjsf-memory-document-form.vue'
import MarkdownContent from '~/components/agent-chat/MarkdownContent.vue'
import { renderMarkdown } from '~/utils/markdown'

// The current documents, for everyone who may instruct the agent. Administrators also get each
// document's history (as changes, from its own History action) and the deleted documents, to restore
// or redact: history is an audit and rollback surface, not something to browse.
const props = defineProps<{
  agent: { id: string, title: string, memory?: { enabled?: boolean } } | null
  accountType: string
  accountId: string
  canConfigure: boolean
}>()

const { t, locale } = useI18n()
const { dayjs } = useLocaleDayjs()
const { sendUiNotif } = useUiNotif()

const memory = ref<any>(null)
const deleted = ref<{ path: string, deletedAt: string, deletedBy: any }[]>([])
const selected = ref<any>(null)
const history = ref<{ path: string, versions: MemoryVersionRow[], count: number, page: number, opened: string[] } | null>(null)
const busy = ref(false)

const PAGE_SIZE = 50
const base = (agentId: string | undefined) => `${$apiPath}/memory/${props.accountType}/${props.accountId}/${agentId}`
const errorMessage = (error: any) => String(error?.data?.message ?? error?.data ?? error?.message ?? error)
const report = (error: unknown) => sendUiNotif({ type: 'error', msg: errorMessage(error), error: error as any })

const formOptions = {
  updateOn: 'input' as const,
  // Not debounced: the markdown editor's input is otherwise held 300 ms, and a Save clicked right after
  // typing wrote the text as it was before. The value only lands in a local ref.
  debounceInputMs: 0,
  density: 'comfortable' as const,
  // The editor's preview goes through the chat's sanitizing renderer (EasyMDE's default does not sanitize).
  pluginsOptions: { markdown: { easyMDEOptions: { previewRender: (text: string) => renderMarkdown(text) } } }
}

const historyView = computed(() => history.value ? historyEntries(history.value.versions, history.value.versions.length < history.value.count) : [])

// Responses are applied only while the panel still shows the autonomous agent they were fetched for, so a
// slow answer for the previous one never lands in the next one's panel.
const load = async () => {
  const agentId = props.agent?.id
  if (!agentId) return
  const [mem, del] = await Promise.all([
    $fetch<any>(base(agentId), { credentials: 'include' }),
    props.canConfigure ? $fetch<any[]>(`${base(agentId)}/deleted`, { credentials: 'include' }) : Promise.resolve([])
  ])
  if (props.agent?.id !== agentId) return
  memory.value = mem
  deleted.value = del
}

const fetchHistoryPage = async (path: string, page: number) => {
  const agentId = props.agent?.id
  const vers = await $fetch<{ count: number, results: MemoryVersionRow[] }>(`${base(agentId)}/versions`, { query: { path, page, size: PAGE_SIZE }, credentials: 'include' })
  return props.agent?.id === agentId ? vers : null
}

const openHistory = async (path: string) => {
  try {
    const vers = await fetchHistoryPage(path, 1)
    if (!vers) return
    history.value = { path, versions: vers.results, count: vers.count, page: 1, opened: vers.results.slice(0, 1).map(v => v.id) }
  } catch (error) { report(error) }
}

const loadMoreHistory = async () => {
  const current = history.value
  if (!current) return
  try {
    const vers = await fetchHistoryPage(current.path, current.page + 1)
    if (!vers || history.value !== current) return
    current.versions = [...current.versions, ...vers.results]
    current.count = vers.count
    current.page++
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
  deleted.value = []
  history.value = null
  load().catch(report)
}, { immediate: true })

// The "turned off" notice follows the stored setting: saving it in the configuration must not leave it stale.
watch(() => props.agent?.memory?.enabled, () => { load().catch(report) })

const startNew = () => { selected.value = { isNew: true, path: '', description: '', content: '' } }

// Every action reports its failure: a 409 (someone, or the agent, changed it meanwhile) or a 400 (a
// limit) must reach the admin rather than leave the panel looking as if it saved. The reload is
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
    // An open history shows the version just written (a restore, a redaction).
    if (history.value) await openHistory(history.value.path)
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
const restore = (id: string) => act(async () => {
  const written = await $fetch<any>(`${base(props.agent?.id)}/versions/${id}/restore`, { method: 'POST', credentials: 'include' })
  selected.value = written
})
const redact = (id: string) => act(async () => {
  if (!window.confirm(t('confirmRedact'))) return
  await $fetch(`${base(props.agent?.id)}/versions/${id}/redact`, { method: 'POST', credentials: 'include' })
})

const diffLineText = (line: DiffLine) => line.kind === 'skipped'
  ? '⋯'
  : `${line.kind === 'added' ? '+' : line.kind === 'removed' ? '-' : ' '} ${line.text}`
const opLabel = (version: MemoryVersionRow) => {
  switch (version.op) {
    case 'create': return t('opCreate')
    case 'update': return t('opUpdate')
    case 'delete': return t('opDelete')
    case 'rename': return t('opRename', { path: version.previousPath ?? '' })
    case 'restore': return t('opRestore')
  }
}
const authorLabel = (author: any) => {
  if (author.kind === 'consolidation') return t('byConsolidation')
  if (author.kind === 'agent') return author.taskId && !author.conversationId ? t('byAgentTask') : t('byAgentConversation')
  return t('byUser', { name: author.userName ?? author.userId })
}
const formatDate = (iso: string) => dayjs(iso).format('lll')
</script>

<style scoped>
.memory-diff {
  font-family: monospace;
  white-space: pre-wrap;
  max-height: 24em;
  overflow: auto;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
}
.memory-diff > div { padding: 0 8px; }
.memory-diff-added { background: rgba(var(--v-theme-success), 0.15); }
.memory-diff-removed { background: rgba(var(--v-theme-error), 0.15); }
.memory-diff-skipped { color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity)); }
</style>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="960"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card :title="t('title', { agent: agent?.title ?? '' })">
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
      <v-card-text style="min-height: 420px">
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
                    class="font-monospace"
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
                    v-if="version.author.conversationId"
                    variant="text"
                    size="small"
                    :to="`/${accountType}/${accountId}/traces/${version.author.conversationId}`"
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
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          :text="t('close')"
          @click="emit('update:modelValue', false)"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<i18n lang="yaml">
en:
  title: Memory of {agent}
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
  close: Close
  byAgent: written by the agent during a conversation
  byReflection: written while reviewing a conversation
  byUser: 'edited by {name}'
  confirmRedact: Redact this version? Its content is replaced for good; who changed what, and when, is kept.
fr:
  title: Mémoire de {agent}
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
  close: Fermer
  byAgent: écrit par l'agent pendant une conversation
  byReflection: écrit en relisant une conversation
  byUser: 'modifié par {name}'
  confirmRedact: Caviarder cette version ? Son contenu est remplacé définitivement ; qui a modifié quoi, et quand, est conservé.
</i18n>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getUiNotif } from '@data-fair/lib-vue/ui-notif.js'
import { $apiPath, $fetch } from '~/context'

const props = defineProps<{
  modelValue: boolean
  agent: { id: string, title: string } | null
  accountType: string
  accountId: string
  canConfigure: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { t, locale } = useI18n()
const { sendUiNotif } = getUiNotif()

const tab = ref('documents')
const memory = ref<any>(null)
const versions = ref<any[]>([])
const selected = ref<any>(null)
const busy = ref(false)

const base = () => `${$apiPath}/memory/${props.accountType}/${props.accountId}/${props.agent?.id}`

const load = async () => {
  if (!props.agent) return
  memory.value = await $fetch(base(), { credentials: 'include' })
  versions.value = (await $fetch<{ results: any[] }>(`${base()}/versions`, { query: { size: 100 }, credentials: 'include' })).results
}

watch(() => [props.modelValue, props.agent?.id], () => {
  if (props.modelValue) { selected.value = null; tab.value = 'documents'; load() }
}, { immediate: true })

const open = async (path: string) => {
  selected.value = await $fetch(`${base()}/document`, { query: { path }, credentials: 'include' })
}
const startNew = () => { selected.value = { isNew: true, path: '', description: '', content: '' } }

// Every action reports its failure: a 409 (someone, or the agent, changed it meanwhile) or a 400 (a
// limit) must reach the admin rather than leave the dialog looking as if it saved.
const act = async (fn: () => Promise<void>) => {
  busy.value = true
  try { await fn(); await load() } catch (error) { sendUiNotif({ type: 'error', msg: String((error as any)?.data?.message ?? (error as any)?.data ?? (error as any)?.message ?? error), error }) } finally { busy.value = false }
}

const save = () => act(async () => {
  const { path, description, content, version, isNew } = selected.value
  const written = await $fetch<any>(`${base()}/document`, { method: 'PUT', query: { path }, body: { description, content, ...(isNew ? {} : { version }) }, credentials: 'include' })
  selected.value = written
})
const remove = () => act(async () => {
  await $fetch(`${base()}/document`, { method: 'DELETE', query: { path: selected.value.path, version: selected.value.version }, credentials: 'include' })
  selected.value = null
})
const restore = (id: string) => act(async () => { await $fetch(`${base()}/versions/${id}/restore`, { method: 'POST', credentials: 'include' }) })
const redact = (id: string) => act(async () => {
  if (!window.confirm(t('confirmRedact'))) return
  await $fetch(`${base()}/versions/${id}/redact`, { method: 'POST', credentials: 'include' })
})

const authorLabel = (author: any) => author.kind === 'agent'
  ? t('byAgent')
  : author.kind === 'reflection' ? t('byReflection') : t('byUser', { name: author.userName ?? author.userId })
const formatDate = (iso: string) => new Date(iso).toLocaleString(locale.value)
</script>

<template>
  <div
    data-testid="mcp-profiles-tree"
    class="mb-4"
  >
    <div class="text-subtitle-2 mb-1">
      {{ t('title') }}
    </div>
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      density="compact"
      :text="error"
    />
    <!-- registers with the surrounding v-form: an unreadable vocabulary leaves the form invalid -->
    <v-input
      v-if="error"
      :model-value="modelValue"
      :rules="[() => t('unreadable')]"
      class="d-none"
    />
    <v-alert
      v-else-if="data?.roleError"
      type="warning"
      variant="tonal"
      density="compact"
      class="mb-2"
      :text="t('roleError', { error: data.roleError })"
    />
    <v-alert
      v-else-if="!role && data"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-2"
      :text="t('noRole')"
    />
    <template
      v-for="root in tree"
      :key="root.name"
    >
      <div class="d-flex align-center">
        <v-btn
          v-if="root.children.length"
          :icon="isOpen(root) ? mdiChevronDown : mdiChevronRight"
          size="x-small"
          variant="text"
          :aria-label="root.title ?? root.name"
          @click="open[root.name] = !isOpen(root)"
        />
        <v-checkbox
          :model-value="root.checked || !!root.implied"
          :label="root.title ?? root.name"
          :disabled="!!root.implied || (!root.offered && !root.checked)"
          :hint="root.implied ? t('includedBy', { name: root.implied }) : !root.offered ? t('notOffered', { role }) : root.description"
          persistent-hint
          density="compact"
          @update:model-value="(on: boolean | null) => toggle(root.name, !!on)"
        />
      </div>
      <div
        v-if="isOpen(root)"
        class="ml-10"
      >
        <v-checkbox
          v-for="leaf in root.children"
          :key="leaf.name"
          :model-value="leaf.checked || !!leaf.implied"
          :label="leaf.title ?? leaf.name"
          :disabled="!!leaf.implied || (!leaf.offered && !leaf.checked)"
          :hint="leaf.implied ? t('includedBy', { name: leaf.implied }) : undefined"
          :persistent-hint="!!leaf.implied"
          density="compact"
          @update:model-value="(on: boolean | null) => toggle(leaf.name, !!on)"
        />
      </div>
    </template>
  </div>
</template>

<i18n lang="yaml">
en:
  title: Profiles
  includedBy: "included by {name}"
  notOffered: "not offered: the agent's identity is {role} in the account"
  noRole: The choice will be narrowed to the role of the agent's identity once it is set.
  unreadable: The profiles of this server could not be read.
  roleError: "Every profile is offered: the role of the agent's identity could not be read ({error})."
fr:
  title: Profils
  includedBy: "inclus par {name}"
  notOffered: "non proposé : l'identité de l'agent est {role} dans le compte"
  noRole: Le choix sera restreint au rôle de l'identité de l'agent une fois celle-ci définie.
  unreadable: Les profils de ce serveur n'ont pas pu être lus.
  roleError: "Tous les profils sont proposés : le rôle de l'identité de l'agent n'a pas pu être lu ({error})."
</i18n>

<script lang="ts" setup>
// The profile choice of one profiled server (spec §3): what the author checks is stored, what it includes
// is shown greyed, roots outside the identity's role are disabled unless already saved.
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiChevronDown, mdiChevronRight } from '@mdi/js'
import { treeState, type McpProfile, type TreeNode } from '@agents/shared/mcp-profiles'
import { $apiPath } from '~/context'

const props = defineProps<{ accountType: string, accountId: string, agentId?: string, serverId?: string, modelValue: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()
const { t } = useI18n()
const open = reactive<Record<string, boolean | undefined>>({})

// useFetch is auto-imported, as in MonitoringGlobalSection.vue; no server selected yet, nothing to fetch
const fetched = useFetch<{ profiles: McpProfile[], role?: string, roleError?: string, offered: string[] }>(
  () => props.serverId ? `${$apiPath}/autonomous-agents/${props.accountType}/${props.accountId}/mcp-servers/${props.serverId}/profiles` : null,
  { query: computed(() => props.agentId ? { agentId: props.agentId } : {}) }
)
const data = computed(() => fetched.data.value)
const role = computed(() => data.value?.role)
const error = computed(() => fetched.error.value ? String(fetched.error.value.message ?? fetched.error.value) : undefined)
const tree = computed(() => data.value ? treeState(data.value.profiles, props.modelValue, role.value) : [])

// a root opens by itself when something under it is checked or included, so a selection's effect is in view
const isOpen = (root: TreeNode) => open[root.name] ?? root.children.some(c => c.checked || !!c.implied)

const toggle = (name: string, on: boolean) => {
  const next = props.modelValue.filter(p => p !== name)
  emit('update:modelValue', on ? [...next, name] : next)
}
</script>

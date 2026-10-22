<template>
  <div>
    <v-select
      :model-value="modelValue"
      :items="selectItems"
      :label="t('label')"
      :readonly="readonly"
      multiple
      chips
      closable-chips
      hide-details
      data-testid="autonomous-agent-scopes"
      @update:model-value="(value: string[]) => emit('update:modelValue', value)"
    >
      <template #item="{ props: itemProps, item }">
        <v-list-item
          v-bind="itemProps"
          :subtitle="item.subtitle"
        />
      </template>
    </v-select>
    <div class="text-caption text-medium-emphasis mt-1">
      <span
        v-if="readonly"
        data-testid="autonomous-agent-scopes-elsewhere"
      >{{ t('elsewhere') }}</span>
      <span
        v-else-if="!modelValue.length"
        data-testid="autonomous-agent-scopes-unrestricted"
      >{{ t('unrestricted') }}</span>
      <span v-else>{{ t('hint') }}</span>
    </div>
    <!-- data-fair's MCP is built into every agent with an identity: these scopes are all that limits it there. -->
    <div
      class="text-caption text-medium-emphasis"
      data-testid="autonomous-agent-scopes-platform"
    >
      {{ t('platform') }}
    </div>
  </div>
</template>

<i18n lang="yaml">
en:
  label: Scopes
  hint: What the platform lets this identity do, within what its role allows.
  unrestricted: 'No restriction: everything its role allows in the organization.'
  elsewhere: Managed outside this page.
  platform: These scopes decide what the agent can do on Data Fair.
fr:
  label: Portées
  hint: Ce que la plateforme permet à cette identité, dans la limite de son rôle.
  unrestricted: 'Aucune restriction : tout ce que son rôle permet dans l''organisation.'
  elsewhere: Gérées en dehors de cette page.
  platform: Ces portées décident de ce que l'agent peut faire sur Data Fair.
</i18n>

<script lang="ts" setup>
/**
 * An autonomous agent's identity's maximum scopes, as simple-directory stores them on its NHI. The token
 * exchange grants them whole, and the scope-filtered MCP server lists the tools they cover.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ScopeRow } from '~/utils/nhi-scopes'

const props = defineProps<{ modelValue: string[], items: ScopeRow[], readonly?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [string[]] }>()
const { t } = useI18n()

// A stored scope simple-directory no longer lists stays shown, so it can be seen and removed.
const selectItems = computed(() => {
  const known = new Set(props.items.map(row => row.scope))
  return [...props.items, ...props.modelValue.filter(scope => !known.has(scope)).map(scope => ({ scope, description: '' }))]
    .map(row => ({ title: row.scope, value: row.scope, subtitle: row.description }))
})
</script>

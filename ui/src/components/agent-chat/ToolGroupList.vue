<template>
  <div
    v-if="!groups.length"
    class="text-caption text-medium-emphasis pa-2"
  >
    {{ t('noTools') }}
  </div>
  <div
    v-else
    class="px-2"
  >
    <div
      v-for="group in groups"
      :key="`${group.kind}-${group.server}`"
      class="mb-2"
      data-testid="tool-group"
      :data-kind="group.kind"
    >
      <v-chip
        v-if="group.kind"
        size="x-small"
        label
        :color="sourceColor(group.kind)"
        class="mb-1"
        data-testid="tool-group-source"
      >
        {{ t(`sources.${group.kind}`, { server: group.server ?? '' }) }}
      </v-chip>
      <div class="text-caption">
        <template
          v-for="(name, i) in group.names"
          :key="name"
        >
          <!-- A description, when the page has one to give, on hover: the list stays one line per group. -->
          <span :title="descriptions?.[name]">{{ name }}</span>{{ i < group.names.length - 1 ? ', ' : '' }}
        </template>
      </div>
    </div>
  </div>
</template>

<i18n lang="yaml">
fr:
  noTools: Aucun outil
  sources:
    platform: Data Fair
    catalog: MCP · {server}
    external: MCP externe · {server}
    page: Cette page (WebMCP)
    service: Intégrés au service
en:
  noTools: No tools
  sources:
    platform: Data Fair
    catalog: MCP · {server}
    external: External MCP · {server}
    page: This page (WebMCP)
    service: Built into the service
</i18n>

<script lang="ts" setup>
/** Tools grouped by where they come from: the chat's params dialog and the review page show them alike. */
import { useI18n } from 'vue-i18n'
import type { ToolSourceKind } from '@agents/shared/tool-source'
import type { ToolGroup } from '~/utils/tool-groups'

defineProps<{
  groups: ToolGroup[]
  descriptions?: Record<string, string>
}>()

const { t } = useI18n()

const sourceColor = (kind: ToolSourceKind) => ({ platform: 'success', catalog: 'primary', external: 'warning', page: 'accent', service: 'secondary' })[kind]
</script>

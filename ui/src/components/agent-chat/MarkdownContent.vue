<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div
    :key="themeName"
    ref="root"
    v-html="html"
  />
</template>

<i18n lang="yaml">
en:
  fixDiagram: Fix this diagram
fr:
  fixDiagram: Corriger ce diagramme
</i18n>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useTheme } from 'vuetify'
import { useI18n } from 'vue-i18n'
import { renderStreamingMarkdown } from '~/utils/markdown'
import { renderMermaidIn, buildMermaidThemeVariables } from '~/utils/mermaid'

const props = defineProps<{
  content: string
  streaming: boolean
  mermaid: boolean
}>()

const theme = useTheme()
const { t } = useI18n()
const themeName = computed(() => theme.global.name.value)

const html = computed(() => renderStreamingMarkdown(props.content, props.streaming, { mermaid: props.mermaid }))

const root = ref<HTMLElement | null>(null)

async function runMermaid () {
  // Don't render half-streamed diagrams; the post-stream update re-triggers this.
  if (!props.mermaid || props.streaming || !root.value) return
  await renderMermaidIn(root.value, buildMermaidThemeVariables(theme.current.value.colors as Record<string, string>), t('fixDiagram'))
}

onMounted(runMermaid)
// Re-run when the rendered html changes, when streaming ends, or when the theme
// changes (themeName is also the :key, so the container is recreated with a fresh
// <pre class="mermaid"> for re-rendering under the new palette).
watch([html, () => props.streaming, themeName], async () => {
  await nextTick()
  await runMermaid()
})
</script>

<style>
.mermaid-block {
  overflow-x: auto;
}
.mermaid-error {
  border-left: 3px solid rgb(var(--v-theme-error));
  padding-left: 8px;
}
.mermaid-error-title {
  font-weight: 600;
  color: rgb(var(--v-theme-error));
  margin-bottom: 2px;
}
.mermaid-error-detail,
.mermaid-error-source {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.75rem;
  margin: 0;
}
.mermaid-fix-btn {
  margin-top: 6px;
  padding: 2px 10px;
  font-size: 0.75rem;
  border-radius: 4px;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
  cursor: pointer;
}
.mermaid-fix-btn:hover {
  background: rgba(var(--v-theme-primary), 0.16);
}
</style>

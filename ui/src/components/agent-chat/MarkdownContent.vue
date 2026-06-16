<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div
    :key="themeName"
    ref="root"
    v-html="html"
  />
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useTheme } from 'vuetify'
import { renderStreamingMarkdown } from '~/utils/markdown'
import { renderMermaidIn, buildMermaidThemeVariables } from '~/utils/mermaid'

const props = defineProps<{
  content: string
  streaming: boolean
  mermaid: boolean
}>()

const theme = useTheme()
const themeName = computed(() => theme.global.name.value)

const html = computed(() => renderStreamingMarkdown(props.content, props.streaming, { mermaid: props.mermaid }))

const root = ref<HTMLElement | null>(null)

async function runMermaid () {
  // Don't render half-streamed diagrams; the post-stream update re-triggers this.
  if (!props.mermaid || props.streaming || !root.value) return
  await renderMermaidIn(root.value, buildMermaidThemeVariables(theme.current.value.colors as Record<string, string>))
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
</style>

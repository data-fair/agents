<template>
  <v-container class="summary-dev-container">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">
          {{ t('title') }}
        </h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-textarea
          v-model="content"
          :label="t('contentLabel')"
          :placeholder="t('contentPlaceholder')"
          rows="6"
          variant="outlined"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="prompt"
          :label="t('promptLabel')"
          :placeholder="t('promptPlaceholder')"
          variant="outlined"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="auto">
        <v-btn
          color="primary"
          :loading="loading"
          :disabled="!content.trim()"
          @click="summarize"
        >
          {{ t('summarize') }}
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-if="error">
      <v-col cols="12">
        <v-alert
          type="error"
          variant="tonal"
        >
          {{ error }}
        </v-alert>
      </v-col>
    </v-row>

    <v-row v-if="result">
      <v-col cols="12">
        <h2 class="text-h6 mb-2">
          {{ t('result') }}
        </h2>
        <v-sheet
          class="pa-4"
          variant="outlined"
        >
          <pre class="summary-result">{{ result }}</pre>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  title: Summary Dev
  contentLabel: Contenu à résumer
  contentPlaceholder: Entrez le texte à résumer...
  promptLabel: Prompt optionnel
  promptPlaceholder: "Par défaut: Summarize the following content concisely:"
  summarize: Résumer
  result: Résumé
en:
  title: Summary Dev
  contentLabel: Content to summarize
  contentPlaceholder: Enter text to summarize...
  promptLabel: Optional prompt
  promptPlaceholder: "Default: Summarize the following content concisely:"
  summarize: Summarize
  result: Summary
</i18n>

<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { $apiPath } from '~/context'
import { useSessionAuthenticated } from '@data-fair/lib-vue/session.js'

const { t } = useI18n()
const session = useSessionAuthenticated()

const content = ref('')
const prompt = ref('')
const loading = ref(false)
const error = ref('')
const result = ref('')

const summarize = async () => {
  if (!content.value.trim()) return

  loading.value = true
  error.value = ''
  result.value = ''

  try {
    const body: { content: string; prompt?: string } = { content: content.value }
    if (prompt.value.trim()) {
      body.prompt = prompt.value
    }

    const res = await fetch(`${$apiPath}/summary/${session.account.value.type}/${session.account.value.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || `HTTP ${res.status}`)
    }

    const data = await res.json()
    result.value = data.summary
  } catch (err: any) {
    error.value = err.message || 'Failed to summarize'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.summary-dev-container {
  max-width: 800px;
}

.summary-result {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  font-family: inherit;
}
</style>

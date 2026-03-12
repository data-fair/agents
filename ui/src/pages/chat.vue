<template>
  <v-container
    class="chat-container"
    fluid
  >
    <v-row class="fill-height">
      <v-col
        cols="12"
        class="d-flex flex-column chat-col"
      >
        <div class="chat-header mb-4 d-flex justify-space-between align-center">
          <div>
            <h1 class="text-h5">
              {{ t('title') }}
            </h1>
            <p class="text-body-2 text-medium-emphasis">
              {{ t('subtitle') }}
            </p>
          </div>
          <div class="d-flex align-center ga-2">
            <v-switch
              v-model="debugEnabledLocal"
              :label="t('debug')"
              density="compact"
              hide-details
              color="primary"
            />
          </div>
        </div>

        <AgentChat :debug="debugEnabled" />
      </v-col>
    </v-row>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  title: Assistant
  subtitle: Discutez avec l'agent IA
  debug: Débogage
en:
  title: Assistant
  subtitle: Chat with the AI agent
  debug: Debug
</i18n>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AgentChat from '~/components/AgentChat.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const debugEnabled = computed(() => route.query.debug === 'true')

const debugEnabledLocal = computed({
  get: () => debugEnabled.value,
  set: (value: boolean) => {
    router.replace({
      query: { ...route.query, debug: value ? 'true' : undefined }
    })
  }
})
</script>

<style scoped>
.chat-container {
  height: calc(100vh - 100px);
  max-width: 900px;
  margin: 0 auto;
}

.chat-col {
  height: 100%;
}
</style>

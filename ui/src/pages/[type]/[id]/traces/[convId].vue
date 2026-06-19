<template>
  <trace-review
    :conversation-id="conversationId"
    @loaded="onLoaded"
  />
</template>

<i18n lang="yaml">
fr:
  storedConversations: Conversations enregistrées
en:
  storedConversations: Stored conversations
</i18n>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import TraceReview from '~/components/TraceReview.vue'
import { setBreadcrumbs } from '~/utils/breadcrumbs'

const { t } = useI18n()
const route = useRoute()
const conversationId = route.params.convId as string

const onLoaded = ({ label }: { label: string }) => {
  setBreadcrumbs([
    { text: t('storedConversations'), to: '/agents-activity' },
    { text: label }
  ])
}
</script>

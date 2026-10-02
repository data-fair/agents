<template>
  <conversation-review
    :conversation-id="conversationId"
    :owner="owner"
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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import ConversationReview from '~/components/ConversationReview.vue'
import { setBreadcrumbs } from '~/utils/breadcrumbs'

const { t } = useI18n()
const route = useRoute('/[type]/[id]/traces/[convId]')
const conversationId = route.params.convId as string
// The owner comes from the path: review is authorized per account, so the component must not have to
// guess which account it is reading.
const owner = computed(() => ({ type: route.params.type as string, id: route.params.id as string }))

const onLoaded = ({ label }: { label: string }) => {
  setBreadcrumbs([
    { text: t('storedConversations'), to: '/agents-activity' },
    { text: label }
  ])
}
</script>

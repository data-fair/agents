<template>
  <trace-review
    v-if="session.state.user?.isAdmin"
    :conversation-id="conversationId"
    @loaded="onLoaded"
  />
</template>

<i18n lang="yaml">
fr:
  agents: Agents
en:
  agents: Agents
</i18n>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useSession } from '@data-fair/lib-vue/session.js'
import TraceReview from '~/components/TraceReview.vue'
import { setBreadcrumbs } from '~/utils/breadcrumbs'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const session = useSession()

// superadmin gate
if (!session.state.user?.isAdmin) router.replace('/')

const accountType = route.params.type as string
const accountId = route.params.id as string
const conversationId = route.params.convId as string

const onLoaded = ({ label }: { label: string }) => {
  setBreadcrumbs([
    { text: t('agents'), to: '/admin/agents' },
    { text: accountId, to: `/admin/agents/${accountType}/${accountId}` },
    { text: label }
  ])
}
</script>

<template>
  <trace-review
    v-if="session.state.user?.isAdmin"
    :conversation-id="conversationId"
    :promoted-evaluator="promotedEvaluator"
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
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useSession } from '@data-fair/lib-vue/session.js'
import TraceReview from '~/components/TraceReview.vue'
import { setBreadcrumbs } from '~/utils/breadcrumbs'
import { $fetch } from '~/context'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const session = useSession()

// superadmin gate
if (!session.state.user?.isAdmin) router.replace('/')

const accountType = route.params.type as string
const accountId = route.params.id as string
const conversationId = route.params.convId as string

const promotedEvaluator = ref<{ account: { type: string, id: string } | null, available: boolean }>({ account: null, available: false })
onMounted(async () => {
  try {
    const info = await $fetch('/admin/info') as { evaluatorAccount: { type: string, id: string } | null, evaluatorAvailable: boolean }
    promotedEvaluator.value = { account: info.evaluatorAccount, available: !!info.evaluatorAvailable }
  } catch {
    promotedEvaluator.value = { account: null, available: false }
  }
})

const onLoaded = ({ label }: { label: string }) => {
  setBreadcrumbs([
    { text: t('agents'), to: '/admin/agents' },
    { text: accountId, to: `/admin/agents/${accountType}/${accountId}` },
    { text: label }
  ])
}
</script>

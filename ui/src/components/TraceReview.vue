<template>
  <v-container
    fluid
    class="trace-review pa-0"
  >
    <p
      v-if="loadError"
      class="text-error pa-3"
    >
      {{ loadError }}
    </p>
    <template v-else-if="recorder && owner">
      <div class="trace-review__bar d-flex align-center ga-2 px-3 py-1">
        <v-btn
          v-if="!recorderB"
          size="small"
          variant="tonal"
          :prepend-icon="mdiCompareHorizontal"
          @click="pickerOpen = true"
        >
          {{ t('compareWith') }}
        </v-btn>
        <template v-else>
          <span class="text-caption">{{ t('comparing') }}</span>
          <v-btn
            size="small"
            variant="text"
            :prepend-icon="mdiClose"
            @click="clearCompare"
          >
            {{ t('clearCompare') }}
          </v-btn>
          <v-spacer />
          <v-btn
            size="small"
            variant="text"
            :prepend-icon="evaluatorCollapsed ? mdiChevronLeft : mdiChevronRight"
            @click="evaluatorCollapsed = !evaluatorCollapsed"
          >
            {{ evaluatorCollapsed ? t('showEvaluator') : t('hideEvaluator') }}
          </v-btn>
        </template>
      </div>
      <p
        v-if="compareError"
        class="text-error text-caption px-3"
      >
        {{ compareError }}
      </p>
      <v-row
        no-gutters
        class="trace-review__panes"
      >
        <v-col
          cols="12"
          :md="traceCols"
          class="trace-review__pane"
        >
          <trace-view
            :trace-overview="traceOverview"
            :recorder="recorder"
          />
        </v-col>
        <v-col
          v-if="recorderB"
          cols="12"
          :md="traceCols"
          class="trace-review__pane"
        >
          <trace-view
            :trace-overview="traceOverviewB"
            :recorder="recorderB"
          />
        </v-col>
        <v-col
          v-if="!evaluatorCollapsed"
          cols="12"
          :md="evaluatorCols"
          class="trace-review__pane trace-review__chat"
        >
          <evaluator-chat
            v-if="evaluatorEnabled && evaluatorOwner"
            :key="recorderB ? 'compare-' + (route.query.compare ?? '') : 'single'"
            :recorder="recorder"
            :recorder-b="recorderB ?? undefined"
            :account-type="evaluatorOwner.type"
            :account-id="evaluatorOwner.id"
          />
          <div
            v-else
            class="pa-4 text-body-2 text-medium-emphasis"
          >
            {{ evaluatorHint }}
          </div>
        </v-col>
      </v-row>
      <trace-compare-picker
        v-model="pickerOpen"
        :account-type="owner.type"
        :account-id="owner.id"
        :exclude-id="conversationId"
        @select="onSelectCompare"
      />
    </template>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  loadError: Trace introuvable ou accès refusé.
  review: Analyse
  compareWith: Comparer avec…
  comparing: Comparaison de deux traces (A / B)
  clearCompare: Fermer la comparaison
  hideEvaluator: Masquer l'évaluateur
  showEvaluator: Afficher l'évaluateur
  compareError: Trace de comparaison introuvable ou propriétaire différent.
  evaluatorNotConfigured: "Aucun compte évaluateur n'est configuré sur cette instance (config.evaluatorAccount avec un modèle évaluateur)."
  enableAdminMode: "Activez le mode administrateur pour analyser les traces."
en:
  loadError: Trace not found or access denied.
  review: Review
  compareWith: Compare with…
  comparing: Comparing two traces (A / B)
  clearCompare: Close comparison
  hideEvaluator: Hide evaluator
  showEvaluator: Show evaluator
  compareError: Comparison trace not found or has a different owner.
  evaluatorNotConfigured: "No evaluator account is configured on this instance (config.evaluatorAccount with an evaluator model)."
  enableAdminMode: "Enable admin mode to review traces."
</i18n>

<script lang="ts" setup>
import { ref, shallowRef, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { mdiCompareHorizontal, mdiClose, mdiChevronLeft, mdiChevronRight } from '@mdi/js'
import { SessionRecorder } from '~/traces/session-recorder'
import type { TraceOverviewEntry } from '~/traces/session-recorder'
import { reconstructTrace } from '~/traces/reconstruct-trace'
import { $apiPath } from '~/context'
import TraceView from '~/components/agent-chat/TraceView.vue'
import EvaluatorChat from '~/components/EvaluatorChat.vue'
import TraceComparePicker from '~/components/TraceComparePicker.vue'
import { useSession } from '@data-fair/lib-vue/session.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const props = defineProps<{
  conversationId: string
  promotedEvaluator?: { account: { type: string, id: string } | null, available: boolean }
}>()
const emit = defineEmits<{ loaded: [{ owner: { type: string, id: string }, label: string }] }>()
const conversationId = props.conversationId
const session = useSession()

// In superadmin (promoted) mode the evaluator runs against the configured source
// account, never the reviewed owner; account-admins keep using their own account.
const evaluatorOwner = computed(() => props.promotedEvaluator?.account ?? owner.value)
const evaluatorEnabled = computed(() => {
  if (!props.promotedEvaluator) return true
  return props.promotedEvaluator.available && !!session.state.user?.adminMode
})
const evaluatorHint = computed(() => props.promotedEvaluator && !props.promotedEvaluator.available
  ? t('evaluatorNotConfigured')
  : t('enableAdminMode'))

const recorder = shallowRef<SessionRecorder | null>(null)
const recorderB = shallowRef<SessionRecorder | null>(null)
const owner = ref<{ type: string, id: string } | null>(null)
const loadError = ref('')
const compareError = ref('')
const pickerOpen = ref(false)
const evaluatorCollapsed = ref(false)

const traceOverview = computed<TraceOverviewEntry[]>(() =>
  recorder.value ? recorder.value.getTraceOverview() : []
)
const traceOverviewB = computed<TraceOverviewEntry[]>(() =>
  recorderB.value ? recorderB.value.getTraceOverview() : []
)

// Layout: single = trace 6 / evaluator 6. Compare with evaluator shown = 4/4/4.
// Compare with evaluator collapsed = 6/6 traces, evaluator hidden.
const traceCols = computed(() => {
  if (!recorderB.value) return 6
  return evaluatorCollapsed.value ? 6 : 4
})
const evaluatorCols = computed(() => (recorderB.value ? 4 : 6))

async function fetchTrace (id: string): Promise<{ owner: { type: string, id: string }, recorder: SessionRecorder } | null> {
  const res = await fetch(`${$apiPath}/traces/conversation/${id}`, { credentials: 'include' })
  if (!res.ok) return null
  const body = await res.json()
  return {
    owner: body.owner as { type: string, id: string },
    recorder: SessionRecorder.fromTrace(reconstructTrace(body.results))
  }
}

async function loadCompare (id: string) {
  compareError.value = ''
  const loaded = await fetchTrace(id).catch(() => null)
  // cross-owner comparison is not allowed (evaluator is owner-scoped)
  if (!loaded || !owner.value || loaded.owner.type !== owner.value.type || loaded.owner.id !== owner.value.id) {
    compareError.value = t('compareError')
    recorderB.value = null
    return
  }
  recorderB.value = loaded.recorder
}

function onSelectCompare (id: string) {
  router.replace({ query: { ...route.query, compare: id } })
}

function clearCompare () {
  const { compare, ...rest } = route.query
  router.replace({ query: rest })
}

// React to the ?compare= param (set by the picker or present on initial load).
watch(() => route.query.compare, async (compareId) => {
  if (typeof compareId === 'string' && compareId && compareId !== conversationId) {
    await loadCompare(compareId)
  } else {
    recorderB.value = null
    compareError.value = ''
    // The collapse toggle only renders in compare mode; reset it so the
    // evaluator pane is never left hidden after returning to single view.
    evaluatorCollapsed.value = false
  }
})

onMounted(async () => {
  try {
    const loaded = await fetchTrace(conversationId)
    if (!loaded) { loadError.value = t('loadError'); return }
    owner.value = loaded.owner
    recorder.value = loaded.recorder
    const firstMessage = recorder.value.getTrace().turns[0]?.userMessage?.trim()
    emit('loaded', { owner: loaded.owner, label: firstMessage ? firstMessage.slice(0, 60) : t('review') })
    // Honor a ?compare= param present on first load (deep link / refresh).
    const compareId = route.query.compare
    if (typeof compareId === 'string' && compareId && compareId !== conversationId) {
      await loadCompare(compareId)
    }
  } catch {
    loadError.value = t('loadError')
  }
})
</script>

<style scoped>
/* Fixed viewport height (no data-iframe-height) so each pane scrolls on its own:
   scrolling one trace stack no longer drives the others. The thin bar at the top
   holds the compare / collapse controls; the panes fill the rest. */
.trace-review { height: 100vh; display: flex; flex-direction: column; }
.trace-review__bar { flex: 0 0 auto; border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.trace-review__panes { flex: 1 1 auto; min-height: 0; }
.trace-review__pane { height: 100%; overflow-y: auto; border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.trace-review__chat { border-right: none; }
</style>

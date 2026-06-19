<template>
  <div
    v-if="session.state.user?.isAdmin"
    class="d-flex flex-column fill-height"
  >
    <div class="d-flex align-center ga-4 pa-4 flex-shrink-0">
      <h2 class="text-title-large">
        {{ t('agents') }}
      </h2>
      <v-autocomplete
        v-model="selectedOwner"
        v-model:search="search"
        :items="owners"
        item-title="name"
        :item-value="(o: any) => o"
        :label="t('org')"
        :loading="ownersFetch.loading.value"
        :no-filter="true"
        :return-object="true"
        :placeholder="t('searchName')"
        density="compact"
        hide-details
        hide-no-data
        max-width="300"
        variant="outlined"
        @update:model-value="onSelect"
      />
    </div>
    <div class="flex-grow-1 overflow-auto">
      <router-view />
    </div>
  </div>
</template>

<i18n lang="yaml">
fr:
  agents: Agents
  org: Organisation
  searchName: Saisissez un nom d'organisation
en:
  agents: Agents
  org: Organization
  searchName: Search an organization name
</i18n>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useSession } from '@data-fair/lib-vue/session.js'

type Owner = { type: string, id: string, name: string }

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const session = useSession()

// superadmin gate
if (!session.state.user?.isAdmin) router.replace('/')

const selectedOwner = ref<Owner | null>(null)

const syncFromRoute = () => {
  const type = route.params.type as string | undefined
  const id = route.params.id as string | undefined
  if (type && id) {
    if (!selectedOwner.value || selectedOwner.value.type !== type || selectedOwner.value.id !== id) {
      selectedOwner.value = { type, id, name: id }
    }
  } else {
    selectedOwner.value = null
  }
}
syncFromRoute()
watch(() => [route.params.type, route.params.id], syncFromRoute)

const search = ref('')
const query = () => ({ type: 'organization', q: search.value, size: 20 })
const ownersFetch = useFetch<{ results: Owner[] }>($sitePath + '/simple-directory/api/accounts', { query })

const owners = computed(() => {
  const results = ownersFetch.data.value?.results ?? []
  if (selectedOwner.value && !results.find(o => o.id === selectedOwner.value!.id && o.type === selectedOwner.value!.type)) {
    return [selectedOwner.value, ...results]
  }
  return results
})

const onSelect = (o: Owner | null) => {
  if (o) router.push(`/admin/${o.type}/${o.id}`)
  else router.push('/admin')
}
</script>

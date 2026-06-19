<template>
  <div
    v-if="session.state.user?.isAdmin"
    class="d-flex flex-column fill-height"
  >
    <div class="d-flex align-center ga-4 pa-4 flex-shrink-0">
      <h2 class="text-title-large">
        {{ t('agents') }}
      </h2>
      <account-selector />
    </div>
    <v-container data-iframe-height>
      <p class="text-medium-emphasis">
        {{ t('selectAccount') }}
      </p>
    </v-container>
  </div>
</template>

<i18n lang="yaml">
fr:
  agents: Agents
  selectAccount: Sélectionnez une organisation pour gérer la configuration de ses agents.
en:
  agents: Agents
  selectAccount: Select an organization to manage its agents configuration.
</i18n>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useSession } from '@data-fair/lib-vue/session.js'
import AccountSelector from '~/components/AccountSelector.vue'
import { setBreadcrumbs } from '~/utils/breadcrumbs'

const { t } = useI18n()
const router = useRouter()
const session = useSession()

// superadmin gate
if (!session.state.user?.isAdmin) router.replace('/')

setBreadcrumbs([])
</script>

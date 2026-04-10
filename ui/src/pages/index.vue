<template>
  <v-app-bar density="comfortable">
    <v-spacer />
    <v-btn
      v-if="session.account.value"
      :to="`/${session.account.value.type}/${session.account.value.id}/settings`"
    >
      {{ t('settings') }}
    </v-btn>
    <personal-menu dark-mode-switch />
  </v-app-bar>
  <v-container class="fill-height">
    <v-row
      align="center"
      justify="center"
    >
      <v-col
        cols="12"
        sm="8"
        md="6"
      >
        <v-card class="pt-8 pb-4 px-8">
          <v-card-title class="text-h4 text-center mb-4">
            Welcome to @data-fair/agents
          </v-card-title>
          <v-card-text class="text-center text-body-1">
            <p class="mb-4">
              This service provides agentic capabilities for the data-fair stack.
            </p>
            <p class="text-grey">
              Manage AI providers and configure agents using tools that integrate with other data-fair services.
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<i18n lang="yaml">
fr:
  settings: Paramètres
en:
  settings: Settings
</i18n>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import personalMenu from '@data-fair/lib-vuetify/personal-menu.vue'
import { useSessionAuthenticated } from '@data-fair/lib-vue/session.js'

const { t } = useI18n()
const session = useSessionAuthenticated()
</script>

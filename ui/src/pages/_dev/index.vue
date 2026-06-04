<template>
  <v-container>
    <v-row justify="center">
      <v-col
        cols="12"
        sm="10"
        md="8"
      >
        <v-card class="pa-4 mb-4">
          <v-card-title class="text-headline-small">
            Account pages
          </v-card-title>
          <v-card-subtitle>
            Real application pages for the current account.
          </v-card-subtitle>
          <v-list>
            <v-list-item
              v-for="page in accountPages"
              :key="page.path"
              :to="page.path"
              :title="page.title"
              :subtitle="page.path"
              prepend-icon="mdi-chevron-right"
            />
          </v-list>
        </v-card>
        <v-card class="pa-4">
          <v-card-title class="text-headline-small">
            Dev pages
          </v-card-title>
          <v-card-subtitle>
            Development-only pages for testing chat components and integrations.
          </v-card-subtitle>
          <v-list>
            <v-list-item
              v-for="page in devPages"
              :key="page.path"
              :to="page.path"
              :title="page.title"
              :subtitle="page.path"
              prepend-icon="mdi-chevron-right"
            />
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionAuthenticated } from '@data-fair/lib-vue/session.js'

const router = useRouter()
const session = useSessionAuthenticated()

const devPages = computed(() => router.getRoutes()
  .filter(r => r.path.startsWith('/_dev/') && r.path !== '/_dev/')
  .map(r => ({
    path: r.path,
    title: r.path.replace('/_dev/', '').replace(/-/g, ' ')
  }))
  .sort((a, b) => a.path.localeCompare(b.path)))

const accountPages = computed(() => {
  const account = session.account.value
  if (!account) return []
  const base = `/${account.type}/${account.id}`
  return [
    { path: `${base}/settings`, title: 'settings' },
    { path: `${base}/chat`, title: 'chat' }
  ]
})
</script>

<template>
  <trace-review :conversation-id="conversationId" />
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router'
import TraceReview from '~/components/TraceReview.vue'

const route = useRoute()
const conversationId = route.params.convId as string
</script>

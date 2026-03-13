<template>
  <AgentChat
    :debug="true"
    :external-tools="tools"
  />
</template>

<script lang="ts" setup>
import AgentChat from '~/components/AgentChat.vue'
import { useFrameTools } from '~/composables/use-frame-tools'

const { tools } = useFrameTools()
</script>

<style scoped>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>

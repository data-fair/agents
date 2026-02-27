<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
      <v-app-bar-title>Agents</v-app-bar-title>
      <v-spacer />
      <v-btn variant="text" href="/">Home</v-btn>
    </v-app-bar>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
</script>

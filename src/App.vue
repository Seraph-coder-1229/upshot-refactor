<!-- src/App.vue -->
<template>
  <div id="app" class="h-full bg-gray-50">
    <AppLayout />
    <AppNotifications />
  </div>
</template>

<script setup lang="ts">
import AppLayout from "./components/layout/AppLayout.vue";
import AppNotifications from "./components/ui/AppNotifications.vue";
</script>

<style>
/* Ensuring the app takes up the full height */
html,
body,
#app {
  height: 100%;
}
</style>

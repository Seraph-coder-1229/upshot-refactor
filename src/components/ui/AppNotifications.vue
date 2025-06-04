<template>
  <div class="fixed top-4 right-4 z-50 space-y-2">
    <div
      v-for="notification in uiStore.notifications"
      :key="notification.id"
      @click="uiStore.removeNotification(notification.id)"
      class="p-4 rounded-md shadow-lg cursor-pointer"
      :class="{
        'bg-blue-500 text-white': notification.type === 'info',
        'bg-green-500 text-white': notification.type === 'success',
        'bg-yellow-500 text-black': notification.type === 'warning',
        'bg-red-500 text-white': notification.type === 'error',
      }"
    >
      {{ notification.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from "../../stores/uiStore"; //

const uiStore = useUiStore(); //
</script>

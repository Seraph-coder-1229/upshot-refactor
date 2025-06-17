<template>
  <div class="border-b border-gray-200 pb-5 mb-8">
    <div class="sm:flex sm:items-baseline sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900">
          {{ title }}
        </h1>
        <p v-if="subtitle" class="mt-2 text-sm text-gray-500">
          {{ subtitle }}
        </p>
      </div>
      <div class="mt-4 flex items-center justify-start sm:mt-0 sm:ml-4">
        <slot name="actions"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from "vue";
defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>

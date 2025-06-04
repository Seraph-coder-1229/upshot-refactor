<template>
  <div class="app-layout min-h-screen flex flex-col">
    <header class="p-4 bg-gray-800 text-white shadow-md">
      <h1 class="text-xl font-semibold">UPSHOT Application</h1>
    </header>
    <main class="flex-grow p-4">
      <slot></slot>
    </main>
    <footer class="p-4 bg-gray-200 text-center text-sm text-gray-600">
      <p>&copy; {{ new Date().getFullYear() }} UPSHOT Refactored</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
// No script logic needed for this basic layout stub
</script>

<style scoped>
/* Add any layout-specific styles if needed */
</style>

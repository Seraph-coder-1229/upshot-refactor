<template>
  <div class="app-layout min-h-screen flex flex-col">
    <header class="p-4 bg-gray-800 text-white shadow-md">
      <div class="container mx-auto flex justify-between items-center">
        <h1 class="text-xl font-semibold">UPSHOT Application</h1>
        <nav class="space-x-4">
          <router-link to="/" class="hover:text-indigo-300 cursor-pointer"
            >Dashboard</router-link
          >
          <router-link to="/import" class="hover:text-indigo-300 cursor-pointer"
            >Import Data</router-link
          >
          <router-link
            to="/syllabi"
            class="hover:text-indigo-300 cursor-pointer"
            >Syllabi</router-link
          >
          <router-link
            to="/personnel"
            class="hover:text-indigo-300 cursor-pointer"
            >Personnel</router-link
          >
          <router-link
            to="/reports"
            class="hover:text-indigo-300 cursor-pointer"
            >Reports</router-link
          >
          <router-link
            to="/flight-hours"
            class="hover:text-indigo-300 cursor-pointer"
            >Flight Hours</router-link
          >
          <router-link
            to="/settings"
            class="hover:text-indigo-300 cursor-pointer"
            >Settings</router-link
          >
          <router-link to="/help" class="hover:text-indigo-300 cursor-pointer"
            >Help</router-link
          >
        </nav>
      </div>
    </header>
    <main class="flex-grow container mx-auto py-4">
      <router-view />
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

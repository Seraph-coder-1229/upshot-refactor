<template>
  <div class="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6">
    <div class="flex h-16 shrink-0 items-center">
      <img
        class="h-8 w-auto"
        src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
        alt="Your Company"
      />
    </div>
    <nav class="flex flex-1 flex-col">
      <ul role="list" class="flex flex-1 flex-col gap-y-7">
        <li>
          <ul role="list" class="-mx-2 space-y-1">
            <li v-for="item in navigation" :key="item.name">
              <router-link
                :to="item.href"
                class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                active-class="bg-gray-50 text-indigo-600"
                :class="[
                  'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                ]"
              >
                <component
                  :is="item.icon"
                  class="size-6 shrink-0 text-gray-400 group-hover:text-indigo-600"
                  :class="{ 'text-indigo-600': $route.path === item.href }"
                  aria-hidden="true"
                />
                {{ item.name }}
              </router-link>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
import {
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  HomeIcon,
  UsersIcon,
  QuestionMarkCircleIcon,
  ArrowDownTrayIcon,
} from "@heroicons/vue/24/outline";

const navigation = [
  { name: "Dashboard", href: "/", icon: HomeIcon },
  { name: "Import Data", href: "/import", icon: ArrowDownTrayIcon },
  { name: "Syllabi", href: "/syllabi", icon: DocumentDuplicateIcon },
  { name: "Personnel", href: "/personnel", icon: UsersIcon },
  { name: "Reports", href: "/reports", icon: ChartBarIcon },
  { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
  { name: "Help", href: "/help", icon: QuestionMarkCircleIcon },
];
</script>

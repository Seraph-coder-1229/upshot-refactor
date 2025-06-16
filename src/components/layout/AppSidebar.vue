<template>
  <div class="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6">
    <div class="flex h-16 shrink-0 items-center"></div>
    <nav class="flex flex-1 flex-col">
      <ul role="list" class="flex flex-1 flex-col gap-y-7">
        <li>
          <ul role="list" class="-mx-2 space-y-1">
            <li v-for="item in navigation" :key="item.name">
              <router-link
                :to="item.href"
                class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                active-class="bg-mint-500 text-primary-default"
                :class="[
                  'text-secondary-foreground hover:bg-secondary-default hover:text-mint-500',
                ]"
              >
                <component
                  :is="item.icon"
                  class="size-6 shrink-0 text-secondary-foreground/50 group-hover:text-mint-500"
                  :class="{ 'text-mint-500': $route.path === item.href }"
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

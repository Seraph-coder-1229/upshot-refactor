<template>
  <div class="py-5 border-b border-gray-200">
    <dt>
      <button
        @click="toggle"
        type="button"
        class="flex w-full items-start justify-between text-left text-gray-400"
      >
        <span class="text-base font-medium text-gray-900">{{ question }}</span>
        <span class="ml-6 flex h-7 items-center">
          <ChevronDownIcon
            :class="[
              isOpen ? '-rotate-180' : 'rotate-0',
              'h-6 w-6 transform transition-transform',
            ]"
          />
        </span>
      </button>
    </dt>
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <dd v-if="isOpen" class="mt-4 pr-12">
        <p class="text-base text-gray-600">
          <slot />
        </p>
      </dd>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps } from "vue";
import { ChevronDownIcon } from "@heroicons/vue/24/outline";

defineProps({
  question: {
    type: String,
    required: true,
  },
});

const isOpen = ref(false);

const toggle = () => {
  isOpen.value = !isOpen.value;
};
</script>

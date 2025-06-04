<template>
  <teleport to="body">
    <transition name="modal-fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
        @click.self="closeModal"
      >
        <div
          class="bg-white rounded-lg shadow-xl transform transition-all sm:max-w-2xl w-full"
          :class="modalSizeClass"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="`modal-title-${modalId}`"
        >
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3
                :id="`modal-title-${modalId}`"
                class="text-lg font-medium text-gray-900"
              >
                <slot name="header">
                  {{ title }}
                </slot>
              </h3>
              <button
                @click="closeModal"
                type="button"
                class="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md"
                aria-label="Close modal"
              >
                <svg
                  class="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div class="px-6 py-5">
            <slot name="body"> </slot>
          </div>

          <div
            v-if="hasFooterSlot"
            class="px-6 py-4 bg-gray-50 border-t border-gray-200 text-right space-x-3 rounded-b-lg"
          >
            <slot name="footer"> </slot>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  useSlots,
  onMounted,
  onUnmounted,
  defineProps,
  defineEmits,
} from "vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: "Modal Title",
  },
  size: {
    type: String, // e.g., 'sm', 'md', 'lg', 'xl', '2xl', 'full' (maps to Tailwind max-w)
    default: "2xl", // Corresponds to sm:max-w-2xl
  },
});

const emit = defineEmits(["close"]);

const modalId = `modal-${Math.random().toString(36).substring(2, 9)}`;
const slots = useSlots();
const hasFooterSlot = computed(() => !!slots.footer);

const closeModal = () => {
  emit("close");
};

// Optional: Close modal on Escape key press
const handleEscKey = (event: KeyboardEvent) => {
  if (event.key === "Escape" && props.isOpen) {
    closeModal();
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleEscKey);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscKey);
});

// Prevent body scroll when modal is open
watch(
  () => props.isOpen,
  (newValue) => {
    if (typeof document !== "undefined" && document.body) {
      if (newValue) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
  }
);

const modalSizeClass = computed(() => {
  switch (props.size) {
    case "sm":
      return "sm:max-w-sm";
    case "md":
      return "sm:max-w-md";
    case "lg":
      return "sm:max-w-lg";
    case "xl":
      return "sm:max-w-xl";
    case "full":
      return "sm:max-w-full h-full"; // For a full screen modal experience
    case "2xl": // Default
    default:
      return "sm:max-w-2xl";
  }
});
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Optional: Transition for the modal dialog itself */
.modal-fade-enter-active .bg-white,
.modal-fade-leave-active .bg-white {
  transition: all 0.3s ease-out;
}
.modal-fade-enter-from .bg-white,
.modal-fade-leave-to .bg-white {
  transform: translateY(-20px);
  opacity: 0;
}
</style>

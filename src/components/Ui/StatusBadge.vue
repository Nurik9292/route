<template>
  <span
      class="status-badge"
      :class="statusClass"
  >
    <Icon :icon="statusIcon" class="status-icon" />
    {{ statusText }}
  </span>
</template>

<script>
export default {
  name: 'StatusBadge',

  props: {
    isActive: {
      type: Boolean,
      default: true
    },
    size: {
      type: String,
      default: 'default', // 'small', 'default', 'large'
      validator: (value) => ['small', 'default', 'large'].includes(value)
    }
  },

  computed: {
    statusClass() {
      return [
        this.isActive ? 'active' : 'inactive',
        `size-${this.size}`
      ];
    },

    statusIcon() {
      return this.isActive ? ['fas', 'check-circle'] : ['fas', 'times-circle'];
    },

    statusText() {
      return this.isActive ? 'Активен' : 'Неактивен';
    }
  }
};
</script>

<style lang="postcss" scoped>
.status-badge {
  @apply inline-flex items-center rounded-full font-medium;
  @apply transition-all duration-200;
}

.status-badge.size-small {
  @apply px-2 py-0.5 text-xs;
}

.status-badge.size-default {
  @apply px-2.5 py-0.5 text-xs;
}

.status-badge.size-large {
  @apply px-3 py-1 text-sm;
}

.status-badge.active {
  background-color: color-mix(in srgb, var(--color-success) 20%, transparent);
  color: var(--color-success);
  border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent);
}

.status-badge.inactive {
  background-color: color-mix(in srgb, var(--color-danger) 20%, transparent);
  color: var(--color-danger);
  border: 1px solid color-mix(in srgb, var(--color-danger) 30%, transparent);
}

.status-icon {
  @apply mr-1;
}

.size-small .status-icon {
  @apply w-3 h-3;
}

.size-default .status-icon {
  @apply w-3 h-3;
}

.size-large .status-icon {
  @apply w-4 h-4;
}

/* Hover effects */
.status-badge:hover {
  @apply transform scale-105;
}

.status-badge.active:hover {
  background-color: color-mix(in srgb, var(--color-success) 30%, transparent);
  border-color: color-mix(in srgb, var(--color-success) 50%, transparent);
}

.status-badge.inactive:hover {
  background-color: color-mix(in srgb, var(--color-danger) 30%, transparent);
  border-color: color-mix(in srgb, var(--color-danger) 50%, transparent);
}
</style>
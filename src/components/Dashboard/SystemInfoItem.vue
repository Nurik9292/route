<template>
  <div class="system-info-item flex items-center justify-between py-2">
    <div class="flex items-center">
      <span :class="statusIndicatorClasses" class="w-2 h-2 rounded-full mr-3"></span>
      <span class="text-sm text-k-text-secondary font-medium">{{ label }}</span>
    </div>

    <div class="flex items-center">
      <span :class="valueClasses" class="text-sm font-medium">
        {{ value }}
      </span>
      <Icon v-if="statusIcon" :icon="statusIcon" :class="statusIconClasses" class="ml-2 text-sm" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'SystemInfoItem',

  props: {
    label: {
      type: String,
      required: true
    },
    value: {
      type: [String, Number],
      required: true
    },
    status: {
      type: String,
      default: 'neutral',
      validator: (value) => ['success', 'warning', 'error', 'info', 'neutral'].includes(value)
    }
  },

  computed: {
    statusIndicatorClasses() {
      const colorMap = {
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        neutral: 'bg-gray-400'
      };

      return colorMap[this.status];
    },

    valueClasses() {
      const colorMap = {
        success: 'text-green-600',
        warning: 'text-yellow-600',
        error: 'text-red-600',
        info: 'text-blue-600',
        neutral: 'text-k-text-primary'
      };

      return colorMap[this.status];
    },

    statusIcon() {
      const iconMap = {
        success: ['fas', 'check-circle'],
        warning: ['fas', 'exclamation-triangle'],
        error: ['fas', 'times-circle'],
        info: ['fas', 'info-circle'],
        neutral: null
      };

      return iconMap[this.status];
    },

    statusIconClasses() {
      const colorMap = {
        success: 'text-green-500',
        warning: 'text-yellow-500',
        error: 'text-red-500',
        info: 'text-blue-500',
        neutral: 'text-gray-400'
      };

      return colorMap[this.status];
    }
  }
};
</script>

<style lang="postcss" scoped>
.system-info-item {
  @apply transition-colors duration-200;
}

.system-info-item:hover {
  @apply bg-gray-50 rounded px-2;
}
</style>
<template>
  <div class="stat-card bg-white rounded-lg border border-k-bg-secondary p-6 hover:shadow-md transition-shadow">
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <p class="text-sm text-k-text-secondary font-medium uppercase tracking-wide">
          {{ title }}
        </p>
        <div class="mt-2">
          <div v-if="loading" class="animate-pulse">
            <div class="h-8 bg-gray-200 rounded w-16"></div>
          </div>
          <p v-else class="text-3xl font-bold text-k-text-primary">
            {{ formattedValue }}
          </p>
        </div>
        <div v-if="trend && !loading" class="mt-2 flex items-center">
          <Icon
              :icon="trend.direction === 'up' ? ['fas', 'caret-up'] : ['fas', 'caret-down']"
              :class="trend.direction === 'up' ? 'text-green-500' : 'text-red-500'"
              class="mr-1"
          />
          <span :class="trend.direction === 'up' ? 'text-green-600' : 'text-red-600'" class="text-sm font-medium">
            {{ trend.value }}%
          </span>
        </div>
      </div>

      <div :class="iconClasses" class="stat-icon rounded-full p-3 ml-4">
        <Icon :icon="iconName" class="text-xl text-white" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatCard',

  props: {
    title: {
      type: String,
      required: true
    },
    value: {
      type: [Number, String],
      default: 0
    },
    loading: {
      type: Boolean,
      default: false
    },
    icon: {
      type: String,
      default: 'info'
    },
    color: {
      type: String,
      default: 'blue',
      validator: (value) => ['blue', 'green', 'amber', 'purple', 'red'].includes(value)
    },
    trend: {
      type: Object,
      default: null
      // { value: 5, direction: 'up' | 'down' }
    }
  },

  computed: {
    formattedValue() {
      if (typeof this.value === 'number') {
        return this.value.toLocaleString('ru-RU');
      }
      return this.value;
    },

    iconName() {
      const iconMap = {
        'route': ['fas', 'route'],
        'shop': ['fas', 'shop'],
        'users': ['fas', 'users'],
        'bus': ['fas', 'bus'],
        'info': ['fas', 'info']
      };

      return iconMap[this.icon] || ['fas', 'info'];
    },

    iconClasses() {
      const colorMap = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        amber: 'bg-amber-500',
        purple: 'bg-purple-500',
        red: 'bg-red-500'
      };

      return colorMap[this.color] || 'bg-blue-500';
    }
  }
};
</script>

<style lang="postcss" scoped>
.stat-card {
  @apply transition-all duration-200;
}

.stat-card:hover {
  @apply shadow-lg;
}

.stat-icon {
  @apply flex items-center justify-center w-12 h-12;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}
</style>
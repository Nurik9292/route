<template>
  <div class="stat-card bg-k-bg-secondary border border-k-border rounded-lg p-4 hover:border-k-primary/30 transition-colors">
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <h3 class="text-sm font-medium text-k-text-secondary uppercase tracking-wide">
          {{ title }}
        </h3>

        <div class="mt-2">
          <div v-if="loading" class="animate-pulse">
            <div class="h-8 bg-k-bg-primary rounded w-16"></div>
          </div>
          <div v-else class="text-2xl font-bold text-k-text-primary">
            {{ formattedValue }}
          </div>
        </div>

        <div v-if="change" class="mt-1 flex items-center text-sm">
          <Icon
              :icon="change > 0 ? ['fas', 'arrow-up'] : ['fas', 'arrow-down']"
              :class="change > 0 ? 'text-green-500' : 'text-red-500'"
              class="mr-1"
          />
          <span :class="change > 0 ? 'text-green-500' : 'text-red-500'">
            {{ Math.abs(change) }}%
          </span>
          <span class="text-k-text-secondary ml-1">за неделю</span>
        </div>
      </div>

      <div :class="iconColorClass" class="p-3 rounded-lg">
        <Icon :icon="iconName" class="text-xl" />
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
    icon: {
      type: String,
      default: 'chart-line'
    },
    color: {
      type: String,
      default: 'blue'
    },
    loading: {
      type: Boolean,
      default: false
    },
    change: {
      type: Number,
      default: null
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
        'map-marker': ['fas', 'map-marker-alt'],
        'bus': ['fas', 'bus'],
        'users': ['fas', 'users'],
        'chart-line': ['fas', 'chart-line']
      };
      return iconMap[this.icon] || ['fas', 'chart-line'];
    },

    iconColorClass() {
      const colorMap = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        yellow: 'bg-yellow-100 text-yellow-600',
        purple: 'bg-purple-100 text-purple-600',
        red: 'bg-red-100 text-red-600'
      };
      return colorMap[this.color] || colorMap.blue;
    }
  }
};
</script>
<template>
  <button
      class="quick-action-card bg-k-bg-secondary border border-k-border rounded-lg p-4 text-left hover:border-k-primary/30 hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-k-primary/20"
      @click="$emit('click')">

    <div class="flex items-start gap-3">
      <div :class="iconColorClass" class="p-2 rounded-lg flex-shrink-0">
        <Icon :icon="iconName" />
      </div>

      <div class="flex-1 min-w-0">
        <h4 class="font-medium text-k-text-primary text-sm mb-1">
          {{ title }}
        </h4>
        <p class="text-xs text-k-text-secondary line-clamp-2">
          {{ description }}
        </p>
      </div>
    </div>
  </button>
</template>

<script>
export default {
  name: 'QuickActionCard',

  props: {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      default: 'cog'
    },
    color: {
      type: String,
      default: 'blue'
    }
  },

  emits: ['click'],

  computed: {
    iconName() {
      const iconMap = {
        'route': ['fas', 'route'],
        'map-marker': ['fas', 'map-marker-alt'],
        'bus': ['fas', 'bus'],
        'user-plus': ['fas', 'user-plus'],
        'cog': ['fas', 'cog']
      };
      return iconMap[this.icon] || ['fas', 'cog'];
    },

    iconColorClass() {
      const colorMap = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        yellow: 'bg-yellow-100 text-yellow-600',
        purple: 'bg-purple-100 text-purple-600'
      };
      return colorMap[this.color] || colorMap.blue;
    }
  }
};
</script>
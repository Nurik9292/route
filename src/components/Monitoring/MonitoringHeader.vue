<template>
  <div class="flex items-center gap-4">
    <!-- Селектор маршрута -->
    <div class="min-w-48">
      <SelectBox
          :model-value="selectedRoute?.id"
          :options="routeOptions"
          placeholder="Выберите маршрут"
          @update:model-value="$emit('route-selected', $event)"
      />
    </div>

    <!-- Toggle направления -->
    <div v-if="selectedRoute" class="flex bg-k-bg-secondary rounded-lg p-1">
      <button
          @click="$emit('direction-changed', 'forward')"
          :class="directionButtonClass('forward')"
          class="px-3 py-1 text-sm rounded transition-colors"
      >
        <Icon :icon="['fas', 'arrow-right']" class="mr-1 text-blue-500" />
        Прямое
      </button>
      <button
          @click="$emit('direction-changed', 'backward')"
          :class="directionButtonClass('backward')"
          class="px-3 py-1 text-sm rounded transition-colors"
      >
        <Icon :icon="['fas', 'arrow-left']" class="mr-1 text-red-500" />
        Обратное
      </button>
    </div>

    <!-- Статистика -->
    <div v-if="monitoringStats" class="text-sm text-k-text-secondary">
      <span class="inline-flex items-center">
        <Icon :icon="['fas', 'bus']" class="mr-1 text-orange-500" />
        {{ monitoringStats.activeBuses }} онлайн
      </span>
    </div>
  </div>
</template>

<script>
import SelectBox from '@/components/Ui/Form/SelectBox.vue'

export default {
  name: 'MonitoringHeader',

  components: {
    SelectBox,
  },

  props: {
    routes: {
      type: Array,
      default: () => []
    },
    selectedRoute: {
      type: Object,
      default: null
    },
    activeDirection: {
      type: String,
      default: 'forward'
    },
    monitoringStats: {
      type: Object,
      default: null
    }
  },

  emits: ['route-selected', 'direction-changed'],

  computed: {
    routeOptions() {
      return this.routes.map(route => ({
        value: route.id,
        label: `№${route.route_number} - ${route.name}`
      }))
    }
  },

  methods: {
    directionButtonClass(direction) {
      const isActive = this.activeDirection === direction
      return isActive
          ? 'bg-k-bg-primary text-k-text-primary shadow-sm'
          : 'text-k-text-secondary hover:text-k-text-primary'
    }
  }
}
</script>
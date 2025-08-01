<template>
  <div class="bus-status-item p-3 rounded-lg border hover:bg-gray-50 transition-colors">
    <div class="flex items-center justify-between">
      <div class="flex items-center flex-1">
        <!-- Статус индикатор -->
        <div class="flex items-center mr-3">
          <span :class="statusClasses" class="w-3 h-3 rounded-full mr-2"></span>
          <span class="font-medium text-k-text-primary">{{ bus.vehicleNumber }}</span>
        </div>

        <!-- Информация о маршруте -->
        <div class="flex-1">
          <div class="flex items-center text-sm">
            <Icon :icon="['fas', 'route']" class="mr-1 text-k-text-secondary" />
            <span class="text-k-text-primary font-medium">{{ bus.routeNumber }}</span>
          </div>
          <div v-if="bus.nextStop" class="text-xs text-k-text-secondary mt-1">
            → {{ bus.nextStop }}
          </div>
        </div>
      </div>

      <!-- Дополнительная информация -->
      <div class="text-right text-sm">
        <div class="flex items-center text-k-text-secondary">
          <Icon :icon="statusIcon" class="mr-1" />
          <span>{{ statusText }}</span>
        </div>
        <div class="text-xs text-k-text-secondary mt-1">
          {{ formatLastUpdate(bus.lastUpdate) }}
        </div>
      </div>
    </div>

    <div v-if="showDetails" class="mt-3 pt-3 border-t border-gray-200">
      <div class="grid grid-cols-2 gap-4 text-xs">
        <div>
          <span class="text-k-text-secondary">Скорость:</span>
          <span class="ml-1 text-k-text-primary">{{ bus.speed || 0 }} км/ч</span>
        </div>
        <div>
          <span class="text-k-text-secondary">Координаты:</span>
          <span class="ml-1 text-k-text-primary">{{ formatCoordinates(bus.latitude, bus.longitude) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export default {
  name: 'BusStatusItem',

  props: {
    bus: {
      type: Object,
      required: true
    },
    showDetails: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    statusClasses() {
      const statusMap = {
        'moving': 'bg-green-500 animate-pulse',
        'stopped': 'bg-yellow-500',
        'offline': 'bg-red-500',
        'maintenance': 'bg-gray-500'
      };

      return statusMap[this.bus.status] || 'bg-gray-400';
    },

    statusIcon() {
      const iconMap = {
        'moving': ['fas', 'route'],
        'stopped': ['fas', 'pause'],
        'offline': ['fas', 'times-circle'],
        'maintenance': ['fas', 'wrench']
      };

      return iconMap[this.bus.status] || ['fas', 'question'];
    },

    statusText() {
      const textMap = {
        'moving': 'В движении',
        'stopped': 'Остановлен',
        'offline': 'Офлайн',
        'maintenance': 'Обслуживание'
      };

      return textMap[this.bus.status] || 'Неизвестно';
    }
  },

  methods: {
    formatLastUpdate(date) {
      if (!date) return 'Неизвестно';
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: ru
      });
    },

    formatCoordinates(lat, lon) {
      if (!lat || !lon) return 'Не определены';
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  }
};
</script>

<style lang="postcss" scoped>
.bus-status-item {
  @apply transition-all duration-200;
}

.bus-status-item:hover {
  @apply bg-gray-50 shadow-sm;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}
</style>
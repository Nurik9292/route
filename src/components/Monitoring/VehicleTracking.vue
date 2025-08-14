<template>
  <div class="p-4 border-b border-k-border">
    <h3 class="font-medium text-k-text-primary mb-4">
      Автобусы онлайн
      <span v-if="activeVehicles.length" class="text-sm font-normal text-k-text-secondary">
        ({{ activeVehicles.length }})
      </span>
    </h3>

    <!-- Нет выбранного маршрута -->
    <div v-if="!selectedRoute" class="text-sm text-k-text-secondary py-8 text-center">
      <Icon :icon="['fas', 'info-circle']" class="text-gray-400 mb-2 text-lg" />
      <div>Выберите маршрут для отслеживания автобусов</div>
    </div>

    <!-- Загрузка автобусов -->
    <div v-else-if="vehiclesLoading" class="py-4">
      <ListSkeleton />
      <div class="mt-2 text-sm text-k-text-secondary text-center">Поиск автобусов...</div>
    </div>

    <!-- Нет активных автобусов -->
    <div v-else-if="!activeVehicles.length" class="text-sm text-k-text-secondary py-8 text-center">
      <Icon :icon="['fas', 'bus']" class="text-gray-400 mb-2 text-lg" />
      <div>Нет активных автобусов</div>
      <div class="text-xs mt-1">на маршруте №{{ selectedRoute.route_number }}</div>
    </div>

    <!-- Список активных автобусов -->
    <div v-else class="space-y-2 max-h-64 overflow-y-auto">
      <div
          v-for="vehicle in activeVehicles"
          :key="vehicle.id"
          @click="focusOnVehicle(vehicle)"
          class="p-3 bg-k-bg-primary rounded border border-k-border hover:border-orange-500 cursor-pointer transition-all duration-200 hover:shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="text-sm font-medium">{{ vehicle.vehicleNumber }}</div>
            <VehicleStatusBadge :vehicle="vehicle" />
          </div>
          <div class="text-xs text-k-text-secondary">
            {{ vehicle.speed }} км/ч
          </div>
        </div>

        <div class="text-xs text-k-text-secondary mt-2 space-y-1">
          <div class="flex justify-between">
            <span>Последнее обновление:</span>
            <span>{{ formatTime(vehicle.lastUpdate) }}</span>
          </div>
          <div v-if="vehicle.distanceToNextStop" class="flex justify-between">
            <span>До следующей остановки:</span>
            <span>{{ vehicle.distanceToNextStop }}м</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Кнопки управления -->
    <div v-if="activeVehicles.length" class="mt-4 flex gap-2">
      <BtnComponent
          @click="refreshVehicles"
          small
          white
          :loading="vehiclesLoading"
          class="flex-1"
      >
        <Icon :icon="['fas', 'sync-alt']" class="mr-1" />
        Обновить
      </BtnComponent>

      <BtnComponent
          @click="showAllVehicles"
          small
          blue
          class="flex-1"
      >
        <Icon :icon="['fas', 'eye']" class="mr-1" />
        Показать все
      </BtnComponent>
    </div>
  </div>
</template>

<script>
import BtnComponent from '@/components/Ui/Form/BtnComponent.vue'
import ListSkeleton from '@/components/Ui/Skeletons/ListSkeleton.vue'
import VehicleStatusBadge from '@/components/Monitoring/VehicleStatusBadge.vue'

export default {
  name: 'VehicleTracking',

  components: {
    BtnComponent,
    ListSkeleton,
    VehicleStatusBadge
  },

  props: {
    selectedRoute: {
      type: Object,
      default: null
    },
    activeVehicles: {
      type: Array,
      default: () => []
    },
    vehiclesLoading: {
      type: Boolean,
      default: false
    }
  },

  emits: ['vehicle-focused', 'refresh-vehicles', 'show-all-vehicles'],

  methods: {
    focusOnVehicle(vehicle) {
      this.$emit('vehicle-focused', vehicle)
    },

    refreshVehicles() {
      this.$emit('refresh-vehicles')
    },

    showAllVehicles() {
      this.$emit('show-all-vehicles')
    },

    formatTime(timestamp) {
      if (!timestamp) return 'Неизвестно'

      const date = new Date(timestamp)
      const now = new Date()
      const diffMinutes = Math.floor((now - date) / (1000 * 60))

      if (diffMinutes < 1) return 'Только что'
      if (diffMinutes < 60) return `${diffMinutes}м назад`

      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
/* Скролл для списка автобусов */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
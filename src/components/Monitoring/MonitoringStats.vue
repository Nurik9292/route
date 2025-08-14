<template>
  <div class="p-4 flex-1">
    <h3 class="font-medium text-k-text-primary mb-4">Статистика</h3>

    <!-- Статистика по выбранному маршруту -->
    <div v-if="selectedRoute" class="space-y-3">
      <StatItem
          label="Всего остановок"
          :value="totalStops"
          icon="map-marker-alt"
          color="blue"
      />

      <StatItem
          label="Активных автобусов"
          :value="activeVehicles.length"
          icon="bus"
          color="green"
      />

      <StatItem
          label="Длина маршрута"
          :value="`${routeDistance} км`"
          icon="route"
          color="purple"
      />

      <StatItem
          label="Среднее время в пути"
          :value="`${estimatedDuration}м`"
          icon="clock"
          color="orange"
      />

      <StatItem
          label="Средняя скорость"
          :value="`${averageSpeed} км/ч`"
          icon="tachometer-alt"
          color="indigo"
      />

      <!-- Статистика по направлениям -->
      <div class="mt-4 pt-3 border-t border-k-border">
        <h4 class="text-sm font-medium text-k-text-secondary mb-2">По направлениям</h4>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="bg-blue-50 p-2 rounded">
            <div class="flex items-center text-blue-600">
              <Icon :icon="['fas', 'arrow-right']" class="mr-1" />
              Прямое
            </div>
            <div class="font-medium">{{ forwardVehicles }} автобусов</div>
          </div>
          <div class="bg-red-50 p-2 rounded">
            <div class="flex items-center text-red-600">
              <Icon :icon="['fas', 'arrow-left']" class="mr-1" />
              Обратное
            </div>
            <div class="font-medium">{{ backwardVehicles }} автобусов</div>
          </div>
        </div>
      </div>

      <!-- Статистика активности -->
      <div class="mt-4 pt-3 border-t border-k-border">
        <h4 class="text-sm font-medium text-k-text-secondary mb-2">Активность</h4>
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-k-text-secondary">В движении:</span>
            <span class="font-medium text-green-600">{{ movingVehicles }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-k-text-secondary">На остановках:</span>
            <span class="font-medium text-yellow-600">{{ stoppedVehicles }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-k-text-secondary">Офлайн:</span>
            <span class="font-medium text-gray-500">{{ offlineVehicles }}</span>
          </div>
        </div>
      </div>

      <!-- Обновление данных -->
      <div class="mt-4 pt-3 border-t border-k-border">
        <div class="flex items-center justify-between text-xs text-k-text-secondary">
          <span>Последнее обновление:</span>
          <span>{{ lastUpdateTime }}</span>
        </div>
        <div class="flex items-center justify-between text-xs text-k-text-secondary mt-1">
          <span>Статус соединения:</span>
          <ConnectionStatus :is-connected="isConnected" />
        </div>
      </div>
    </div>

    <!-- Нет выбранного маршрута -->
    <div v-else class="text-sm text-k-text-secondary py-8 text-center">
      <Icon :icon="['fas', 'chart-line']" class="text-gray-400 mb-2 text-lg" />
      <div>Выберите маршрут для</div>
      <div>просмотра статистики</div>
    </div>
  </div>
</template>

<script>
import StatItem from '@/components/Monitoring/StatItem.vue'
import ConnectionStatus from '@/components/Monitoring/ConnectionStatus.vue'

export default {
  name: 'MonitoringStats',

  components: {
    StatItem,
    ConnectionStatus
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
    routeDistance: {
      type: String,
      default: '0'
    },
    estimatedDuration: {
      type: Number,
      default: 0
    },
    isConnected: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    totalStops() {
      if (!this.selectedRoute) return 0
      const forward = this.selectedRoute.forwardStops?.length || 0
      const backward = this.selectedRoute.backwardStops?.length || 0
      return Math.max(forward, backward)
    },

    averageSpeed() {
      if (!this.activeVehicles.length) return 0

      const totalSpeed = this.activeVehicles.reduce((sum, vehicle) => {
        return sum + (vehicle.speed || 0)
      }, 0)

      return Math.round(totalSpeed / this.activeVehicles.length)
    },

    movingVehicles() {
      return this.activeVehicles.filter(v => v.isMoving && this.isVehicleOnline(v)).length
    },

    stoppedVehicles() {
      return this.activeVehicles.filter(v => !v.isMoving && this.isVehicleOnline(v)).length
    },

    offlineVehicles() {
      return this.activeVehicles.filter(v => !this.isVehicleOnline(v)).length
    },

    forwardVehicles() {
      // Примерное разделение по направлениям
      // В реальности нужна логика определения направления по GPS
      return Math.ceil(this.activeVehicles.length / 2)
    },

    backwardVehicles() {
      return Math.floor(this.activeVehicles.length / 2)
    },

    lastUpdateTime() {
      if (!this.activeVehicles.length) return 'Нет данных'

      const latestUpdate = this.activeVehicles.reduce((latest, vehicle) => {
        const vehicleTime = new Date(vehicle.lastUpdate || 0)
        return vehicleTime > latest ? vehicleTime : latest
      }, new Date(0))

      return latestUpdate.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
  },

  methods: {
    isVehicleOnline(vehicle) {
      if (!vehicle.lastUpdate) return false

      const lastUpdate = new Date(vehicle.lastUpdate)
      const now = new Date()
      const diffMinutes = (now - lastUpdate) / (1000 * 60)

      return diffMinutes < 5
    }
  }
}
</script>

<style scoped>
.grid {
  gap: 0.5rem;
}
</style>
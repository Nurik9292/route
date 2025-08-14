<template>
  <BaseView>
    <template #header>
      <ScreenHeader layout="collapsed">
        Мониторинг маршрутов
        <template #meta>
          <span class="text-k-text-secondary">
            Отслеживание автобусов и планирование поездок в реальном времени
          </span>
        </template>

        <template #actions>
          <MonitoringHeader
              :routes="effectiveRoutes"
              :selected-route="selectedRoute"
              :active-direction="activeDirection"
              :monitoring-stats="monitoringStats"
              @route-selected="onRouteSelected"
              @direction-changed="onDirectionChanged"
          />
        </template>
      </ScreenHeader>
    </template>

    <div class="h-full flex flex-col">
      <div class="flex-1 flex overflow-hidden">
        <!-- Карта (70% ширины) -->
        <section class="flex-1 relative">
          <MonitoringMap
              ref="monitoringMap"
              :selected-route="selectedRoute"
              :active-direction="activeDirection"
              :route-geometry="routeGeometry"
              :active-vehicles="activeVehicles"
              :trip-option="selectedTripOption"
              :is-map-click-mode="isMapClickMode"
              :trip-from-point="tripFromPoint"
              :trip-to-point="tripToPoint"
              :show-trip-points="showTripPoints"
              @vehicle-focused="onVehicleFocused"
              @stop-clicked="onStopClicked"
              @map-clicked="onMapClicked"
              @trip-point-clicked="onTripPointClicked"
          />
        </section>

        <!-- Боковая панель (30% ширины) -->
        <aside class="w-96 bg-k-bg-secondary border-l border-k-border flex flex-col">
          <!-- Планировщик поездок -->
          <TripPlanner
              ref="tripPlanner"
              @trip-searched="onTripSearched"
              @trip-option-selected="onTripOptionSelected"
              @map-click-mode-changed="onMapClickModeChanged"
              @clear-trip-points="onClearTripPoints"
          />

          <!-- Отслеживание автобусов -->
          <VehicleTracking
              :selected-route="selectedRoute"
              :active-vehicles="activeVehicles"
              :vehicles-loading="vehiclesLoading"
              @vehicle-focused="onVehicleFocused"
              @refresh-vehicles="loadRouteVehicles"
              @show-all-vehicles="showAllVehicles"
          />

          <!-- Статистика мониторинга -->
          <MonitoringStats
              :selected-route="selectedRoute"
              :active-vehicles="activeVehicles"
              :route-distance="routeDistance"
              :estimated-duration="estimatedDuration"
              :is-connected="isWebSocketConnected"
          />
        </aside>
      </div>
    </div>
  </BaseView>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import BaseView from '@/views/BaseView.vue'
import ScreenHeader from '@/components/Ui/ScreenHeader.vue'
import MonitoringHeader from '@/components/Monitoring/MonitoringHeader.vue'
import MonitoringMap from '@/components/Monitoring/MonitoringMap.vue'
import TripPlanner from '@/components/Monitoring/TripPlanner.vue'
import VehicleTracking from '@/components/Monitoring/VehicleTracking.vue'
import MonitoringStats from '@/components/Monitoring/MonitoringStats.vue'
import { monitoringAPI } from "@/api/index.js";
import { logger } from '@/utils/index.js'

export default {
  name: 'RouteMonitoringView',

  components: {
    BaseView,
    ScreenHeader,
    MonitoringHeader,
    MonitoringMap,
    TripPlanner,
    VehicleTracking,
    MonitoringStats
  },

  data() {
    return {
      // Локальные маршруты как fallback
      localRoutes: [],
      selectedRouteId: null,
      selectedRoute: null,
      activeDirection: 'forward',
      routeGeometry: null,
      activeVehicles: [],
      vehiclesLoading: false,
      selectedTripOption: null,
      vehicleWebSocket: null,
      isWebSocketConnected: false,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      routesLoading: true,

      // Trip planning состояние
      isMapClickMode: false,
      tripFromPoint: null,
      tripToPoint: null,
      showTripPoints: false
    }
  },

  computed: {
    ...mapGetters('routes', ['getRoutes']),

    // Эффективные маршруты - либо из store, либо локальные
    effectiveRoutes() {
      const storeRoutes = this.getRoutes || []
      return storeRoutes.length > 0 ? storeRoutes : this.localRoutes
    },

    routeDistance() {
      if (!this.routeGeometry) return '0'
      const geometry = this.activeDirection === 'forward'
          ? this.routeGeometry.forward
          : this.routeGeometry.backward

      if (!geometry?.coordinates) return '0'
      return (geometry.coordinates.length * 0.1).toFixed(1)
    },

    estimatedDuration() {
      return Math.ceil(parseFloat(this.routeDistance) * 2.5)
    },

    monitoringStats() {
      if (!this.selectedRoute) return null
      return {
        activeBuses: this.activeVehicles.length,
        totalStops: this.currentDirectionStops.length,
        distance: this.routeDistance
      }
    },

    currentDirectionStops() {
      if (!this.selectedRoute) return []
      return this.activeDirection === 'forward'
          ? this.selectedRoute.forwardStops || []
          : this.selectedRoute.backwardStops || []
    }
  },

  async mounted() {
    console.log('🚀 Инициализация RouteMonitoringView')
    await this.loadRoutes()
    this.routesLoading = false
  },

  beforeUnmount() {
    this.disconnectWebSocket()
  },

  methods: {
    ...mapActions('routes', ['paginate', 'fetchById']),

    async loadRoutes() {
      try {
        console.log('📊 Загружаем маршруты...')

        // Сначала пробуем Vuex store
        try {
          await this.paginate({ size: 100 })
        } catch (storeError) {
          console.warn('⚠️ Ошибка загрузки из store:', storeError)
        }

        // Если в store пусто, используем direct API
        if (!this.effectiveRoutes || this.effectiveRoutes.length === 0) {
          console.log('📦 Загружаем маршруты через Monitoring API...')
          const response = await monitoringAPI.getAllRoutes()
          this.localRoutes = response.routes || response || []
        }

        logger.info('✅ Маршруты загружены:', this.effectiveRoutes.length)
      } catch (error) {
        logger.error('❌ Ошибка загрузки маршрутов:', error)
        this.localRoutes = []
      }
    },

    async onRouteSelected(routeId) {
      if (!routeId) {
        this.clearSelection()
        return
      }

      try {
        this.selectedRouteId = routeId
        this.selectedRoute = this.effectiveRoutes.find(route => route.id === routeId)

        if (!this.selectedRoute) {
          logger.warn('❌ Маршрут не найден:', routeId)
          return
        }

        logger.info('✅ Выбран маршрут:', this.selectedRoute.route_number)

        await this.loadRouteGeometry()
        await this.loadRouteVehicles()
        this.connectToVehicleStream()

      } catch (error) {
        logger.error('❌ Ошибка загрузки маршрута:', error)
      }
    },

    onDirectionChanged(direction) {
      this.activeDirection = direction
      logger.info('🔄 Изменено направление:', direction)
    },

    async loadRouteGeometry() {
      try {
        // Проверяем, есть ли уже геометрия в объекте маршрута
        if (this.selectedRoute.forward_geometry || this.selectedRoute.backward_geometry) {
          this.routeGeometry = {
            forward: this.parseGeometry(this.selectedRoute.forward_geometry),
            backward: this.parseGeometry(this.selectedRoute.backward_geometry)
          }
          logger.info('✅ Геометрия маршрута из store')
          return
        }

        logger.info('ℹ️ Геометрия не найдена в данных маршрута')
        this.routeGeometry = null
      } catch (error) {
        logger.error('❌ Ошибка загрузки геометрии:', error)
        this.routeGeometry = null
      }
    },

    async loadRouteVehicles() {
      if (!this.selectedRoute?.route_number) return

      this.vehiclesLoading = true
      try {
        const response = await monitoringAPI.getVehiclesRoute(this.selectedRoute.route_number)

        // Преобразуем данные в нужный формат
        this.activeVehicles = (response.vehicles || response || []).map(vehicle => ({
          id: vehicle.id,
          vehicleNumber: vehicle.vehicle_number || vehicle.number || `Bus-${vehicle.id}`,
          latitude: vehicle.latitude,
          longitude: vehicle.longitude,
          speed: vehicle.speed || 0,
          isMoving: vehicle.speed > 5,
          lastUpdate: vehicle.last_update || vehicle.timestamp || new Date().toISOString(),
          routeNumber: vehicle.route_number || this.selectedRoute.route_number
        }))

        logger.info('✅ Загружено автобусов:', this.activeVehicles.length)
      } catch (error) {
        logger.error('❌ Ошибка загрузки автобусов:', error)
        this.activeVehicles = []
      } finally {
        this.vehiclesLoading = false
      }
    },

    connectToVehicleStream() {
      if (!this.selectedRoute?.route_number) return

      this.disconnectWebSocket()

      try {
        this.vehicleWebSocket = monitoringAPI.createVehicleStream(
            [this.selectedRoute.route_number],
            this.onVehicleUpdate,
            this.onWebSocketError
        )

        this.vehicleWebSocket.onopen = () => {
          this.isWebSocketConnected = true
          this.reconnectAttempts = 0
          logger.info('✅ WebSocket подключен для маршрута:', this.selectedRoute.route_number)
        }

        this.vehicleWebSocket.onclose = () => {
          this.isWebSocketConnected = false
          this.scheduleReconnect()
        }

      } catch (error) {
        logger.error('❌ Ошибка подключения WebSocket:', error)
      }
    },

    onVehicleUpdate(data) {
      const positions = data.positions || data.vehicles || []
      this.activeVehicles = positions.map(pos => ({
        id: pos.id,
        vehicleNumber: pos.vehicle_number || `Bus-${pos.id}`,
        latitude: pos.latitude,
        longitude: pos.longitude,
        speed: pos.speed || 0,
        isMoving: pos.speed > 5,
        lastUpdate: pos.timestamp || new Date().toISOString(),
        routeNumber: pos.route_number
      }))
      logger.debug('🔄 Обновлены позиции автобусов:', this.activeVehicles.length)
    },

    onWebSocketError(error) {
      logger.error('❌ WebSocket ошибка:', error)
      this.isWebSocketConnected = false
    },

    scheduleReconnect() {
      if (this.reconnectAttempts < this.maxReconnectAttempts && this.selectedRoute) {
        this.reconnectAttempts++
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)

        logger.info(`🔄 Переподключение через ${delay}ms (попытка ${this.reconnectAttempts})`)

        setTimeout(() => {
          if (this.selectedRoute && !this.isWebSocketConnected) {
            this.connectToVehicleStream()
          }
        }, delay)
      }
    },

    disconnectWebSocket() {
      if (this.vehicleWebSocket) {
        this.vehicleWebSocket.close()
        this.vehicleWebSocket = null
        this.isWebSocketConnected = false
      }
    },

    // ========= TRIP PLANNING МЕТОДЫ =========

    onMapClickModeChanged(isMapMode) {
      this.isMapClickMode = isMapMode
      this.showTripPoints = isMapMode

      if (!isMapMode) {
        this.clearTripPoints()
      }

      logger.info('🗺️ Режим карты:', isMapMode ? 'Выбор точек' : 'Просмотр')
    },

    onMapClicked(coordinates) {
      if (!this.isMapClickMode) return

      // Передаем координаты в TripPlanner
      if (this.$refs.tripPlanner) {
        this.$refs.tripPlanner.onMapClick(coordinates)
        this.updateTripPoints()
      }
    },

    onTripPointClicked(pointType) {
      // Обработка клика по точкам поездки
      logger.info('📍 Клик по точке поездки:', pointType)
    },

    onClearTripPoints(type) {
      if (type === 'from' || type === 'all') {
        this.tripFromPoint = null
      }
      if (type === 'to' || type === 'all') {
        this.tripToPoint = null
      }

      this.updateTripPoints()
    },

    updateTripPoints() {
      // Синхронизируем состояние точек с TripPlanner
      if (this.$refs.tripPlanner) {
        const tripForm = this.$refs.tripPlanner.tripForm
        this.tripFromPoint = tripForm.from ? [tripForm.from.lat, tripForm.from.lng] : null
        this.tripToPoint = tripForm.to ? [tripForm.to.lat, tripForm.to.lng] : null
      }
    },

    clearTripPoints() {
      this.tripFromPoint = null
      this.tripToPoint = null
      if (this.$refs.tripPlanner) {
        this.$refs.tripPlanner.clearAllPoints()
      }
    },

    async onTripSearched(tripResults) {
      logger.info('🔍 Найдено вариантов поездки:', tripResults.length)
    },

    onTripOptionSelected(tripOption) {
      this.selectedTripOption = tripOption
      logger.info('✅ Выбран вариант поездки:', tripOption.type)
    },

    // ========= ОСТАЛЬНЫЕ МЕТОДЫ =========

    onVehicleFocused(vehicle) {
      if (this.$refs.monitoringMap) {
        this.$refs.monitoringMap.focusOnVehicle(vehicle)
        logger.info('🎯 Фокус на автобусе:', vehicle.vehicleNumber)
      }
    },

    onStopClicked(stop) {
      logger.info('🚏 Клик по остановке:', stop.name)
    },

    showAllVehicles() {
      if (this.$refs.monitoringMap) {
        this.$refs.monitoringMap.fitMapBounds()
      }
    },

    clearSelection() {
      this.selectedRouteId = null
      this.selectedRoute = null
      this.routeGeometry = null
      this.activeVehicles = []
      this.selectedTripOption = null
      this.disconnectWebSocket()
      logger.info('🧹 Выбор маршрута очищен')
    },

    // Вспомогательный метод для парсинга геометрии
    parseGeometry(geometryString) {
      try {
        if (!geometryString) return null

        if (typeof geometryString === 'string') {
          // Если это WKT формат LINESTRING
          if (geometryString.startsWith('LINESTRING')) {
            const coords = geometryString
                .replace('LINESTRING(', '')
                .replace(')', '')
                .split(',')
                .map(pair => {
                  const [lng, lat] = pair.trim().split(' ').map(Number)
                  return [lng, lat]
                })

            return { type: 'LineString', coordinates: coords }
          }

          // Если это JSON строка
          return JSON.parse(geometryString)
        }

        // Если это уже объект
        return geometryString
      } catch (error) {
        console.error('Ошибка парсинга геометрии:', error)
        return null
      }
    }
  }
}
</script>

<style scoped>
.monitoring-content {
  height: calc(100vh - 140px);
}

/* Обеспечиваем корректное отображение карты */
:deep(.leaflet-container) {
  height: 100% !important;
  width: 100% !important;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  aside {
    width: 24rem;
  }
}

@media (max-width: 768px) {
  .flex-1.flex {
    flex-direction: column;
  }

  aside {
    width: 100%;
    height: 50vh;
    border-left: none;
    border-top: 1px solid var(--k-border);
  }
}

/* Убираем возможные z-index конфликты */
aside {
  z-index: 10;
}

section {
  z-index: 1;
}
</style>
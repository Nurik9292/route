
<template>
  <div class="absolute inset-0 bg-gray-100">
    <!-- Leaflet карта с правильными импортами -->
    <LMap
        :use-global-leaflet="false"
        ref="mapRef"
        v-model:zoom="defaultZoom"
        :center="defaultCenter"
        class="w-full h-full"
        @ready="onMapReady"
        @click="onMapClick"
    >
      <LTileLayer
          :url="mapUrl"
          layer-type="base"
          name="OpenStreetMap"
      />

      <!-- Маркеры остановок -->
      <LMarker
          v-for="stop in currentDirectionStops"
          :key="`stop-${stop.id}`"
          :lat-lng="[stop.latitude, stop.longitude]"
          @click="onStopClick(stop)"
      >
        <LTooltip>{{ stop.name }}</LTooltip>
        <LPopup>
          <div class="text-sm">
            <h4 class="font-medium">{{ stop.name }}</h4>
            <p class="text-gray-600">{{ stop.description }}</p>
          </div>
        </LPopup>
      </LMarker>

      <!-- Маркеры автобусов -->
      <LMarker
          v-for="vehicle in activeVehicles"
          :key="`vehicle-${vehicle.id}`"
          :lat-lng="[vehicle.latitude, vehicle.longitude]"
          @click="onVehicleClick(vehicle)"
      >
        <LIcon
            :icon-url="getBusIcon(vehicle)"
            :icon-size="[32, 32]"
            :icon-anchor="[16, 16]"
        />
        <LTooltip>
          {{ vehicle.vehicleNumber }} - {{ vehicle.speed }} км/ч
        </LTooltip>
        <LPopup>
          <div class="text-sm">
            <h4 class="font-medium">Автобус {{ vehicle.vehicleNumber }}</h4>
            <p>Скорость: {{ vehicle.speed }} км/ч</p>
            <p>Статус: {{ vehicle.isMoving ? 'В движении' : 'Стоит' }}</p>
            <p>Обновление: {{ formatTime(vehicle.lastUpdate) }}</p>
          </div>
        </LPopup>
      </LMarker>

      <!-- Геометрия маршрута -->
      <LPolyline
          v-if="currentRouteGeometry"
          :lat-lngs="currentRouteGeometry"
          :color="routeColor"
          :weight="5"
          :opacity="0.8"
      />

      <!-- Маркеры для точек планирования поездки -->
      <template v-if="showTripPoints">
        <!-- Точка "Откуда" -->
        <LMarker
            v-if="tripFromPoint"
            :lat-lng="tripFromPoint"
            @click="onTripPointClick('from')"
        >
          <LIcon
              :icon-size="[30, 30]"
              :icon-anchor="[15, 30]"
              class-name="trip-marker-from"
          >
            <div class="trip-marker trip-marker-from">
              <div class="marker-inner">📍</div>
            </div>
          </LIcon>
          <LTooltip>
            <div class="trip-tooltip">
              <strong>Откуда</strong><br>
              {{ tripFromPoint[0].toFixed(4) }}, {{ tripFromPoint[1].toFixed(4) }}
            </div>
          </LTooltip>
        </LMarker>

        <!-- Точка "Куда" -->
        <LMarker
            v-if="tripToPoint"
            :lat-lng="tripToPoint"
            @click="onTripPointClick('to')"
        >
          <LIcon
              :icon-size="[30, 30]"
              :icon-anchor="[15, 30]"
              class-name="trip-marker-to"
          >
            <div class="trip-marker trip-marker-to">
              <div class="marker-inner">🎯</div>
            </div>
          </LIcon>
          <LTooltip>
            <div class="trip-tooltip">
              <strong>Куда</strong><br>
              {{ tripToPoint[0].toFixed(4) }}, {{ tripToPoint[1].toFixed(4) }}
            </div>
          </LTooltip>
        </LMarker>
      </template>

      <!-- Маркеры остановок -->
      <LMarker
          v-for="stop in currentDirectionStops"
          :key="`stop-${stop.id}`"
          :lat-lng="[stop.latitude, stop.longitude]"
          @click="onStopClick(stop)"
      >
        <LIcon
            :icon-size="[24, 24]"
            :icon-anchor="[12, 12]"
            class-name="bus-stop-marker"
        >
          <div class="bus-stop-marker">
            <div class="stop-inner">🚏</div>
          </div>
        </LIcon>
        <LTooltip>
          <div class="stop-tooltip">
            <strong>{{ stop.name }}</strong>
            <div class="text-xs">{{ stop.description }}</div>
          </div>
        </LTooltip>
        <LPopup>
          <div class="stop-popup">
            <h4 class="font-medium text-gray-900">{{ stop.name }}</h4>
            <p class="text-gray-600 text-sm">{{ stop.description }}</p>
          </div>
        </LPopup>
      </LMarker>

      <!-- Маркеры автобусов -->
      <LMarker
          v-for="vehicle in activeVehicles"
          :key="`vehicle-${vehicle.id}`"
          :lat-lng="[vehicle.latitude, vehicle.longitude]"
          @click="onVehicleClick(vehicle)"
      >
        <LIcon
            :icon-size="[32, 32]"
            :icon-anchor="[16, 16]"
            :class-name="`vehicle-marker ${getVehicleStatusClass(vehicle)}`"
        >
          <div class="vehicle-marker" :class="getVehicleStatusClass(vehicle)">
            <div class="vehicle-inner">🚌</div>
          </div>
        </LIcon>
        <LTooltip>
          <div class="vehicle-tooltip">
            <strong>{{ vehicle.vehicleNumber }}</strong><br>
            Скорость: {{ vehicle.speed }} км/ч<br>
            Статус: {{ vehicle.isMoving ? 'В движении' : 'Стоит' }}
          </div>
        </LTooltip>
        <LPopup>
          <div class="vehicle-popup">
            <h4 class="font-medium text-gray-900">Автобус {{ vehicle.vehicleNumber }}</h4>
            <div class="text-sm space-y-1">
              <p>Скорость: <span class="font-medium">{{ vehicle.speed }} км/ч</span></p>
              <p>Статус: <span class="font-medium">{{ vehicle.isMoving ? 'В движении' : 'Стоит' }}</span></p>
              <p>Обновление: <span class="font-medium">{{ formatTime(vehicle.lastUpdate) }}</span></p>
            </div>
          </div>
        </LPopup>
      </LMarker>
    </LMap>

    <!-- Overlay с информацией о маршруте -->
    <div
        v-if="selectedRoute"
        class="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-sm z-[1000]"
    >
      <h3 class="font-semibold text-gray-800 mb-2">
        Маршрут №{{ selectedRoute.route_number }}
      </h3>
      <div class="text-sm text-gray-600 space-y-1">
        <div>{{ selectedRoute.name }}</div>
        <div class="flex items-center">
          <div
              class="w-3 h-3 rounded-full mr-2"
              :class="activeDirection === 'forward' ? 'bg-blue-500' : 'bg-red-500'"
          ></div>
          {{ activeDirection === 'forward' ? 'Прямое направление' : 'Обратное направление' }}
        </div>
        <div v-if="routeGeometry">
          Остановок: {{ currentDirectionStops.length }} •
          Расстояние: {{ routeDistance }} км
        </div>
      </div>
    </div>

    <!-- Loading карты -->
    <div v-if="mapLoading" class="absolute inset-0 flex items-center justify-center bg-white/80 z-[1000]">
      <div class="text-center">
        <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div class="mt-2 text-sm text-gray-600">Загрузка карты...</div>
      </div>
    </div>
  </div>
</template>

<script>
// КРИТИЧЕСКИ ВАЖНО: Правильные импорты Leaflet
import "leaflet/dist/leaflet.css"
import {
  LMap,
  LTileLayer,
  LMarker,
  LPolyline,
  LTooltip,
  LPopup,
  LIcon
} from "@vue-leaflet/vue-leaflet"

export default {
  name: 'MonitoringMap',

  components: {
    LMap,
    LTileLayer,
    LMarker,
    LPolyline,
    LTooltip,
    LPopup,
    LIcon
  },

  props: {
    selectedRoute: {
      type: Object,
      default: null
    },
    activeDirection: {
      type: String,
      default: 'forward'
    },
    routeGeometry: {
      type: Object,
      default: null
    },
    activeVehicles: {
      type: Array,
      default: () => []
    },
    tripOption: {
      type: Object,
      default: null
    },
    // Новые props для trip planning
    isMapClickMode: {
      type: Boolean,
      default: false
    },
    tripFromPoint: {
      type: Object,
      default: null
    },
    tripToPoint: {
      type: Object,
      default: null
    },
    showTripPoints: {
      type: Boolean,
      default: false
    }
  },

  emits: ['vehicle-focused', 'stop-clicked', 'map-clicked', 'trip-point-clicked'],

  data() {
    return {
      mapLoading: true,
      defaultCenter: [37.9601, 58.3261], // Центр Ашхабада
      defaultZoom: 12,
      mapUrl: 'https://osm.onlinetaxi.ulgam.biz/tile/{z}/{x}/{y}.png',
      map: null
    }
  },

  computed: {
    currentRouteGeometry() {
      if (!this.routeGeometry) return null

      const geometry = this.activeDirection === 'forward'
          ? this.routeGeometry.forward
          : this.routeGeometry.backward

      if (!geometry?.coordinates) return null

      // Конвертируем координаты для Leaflet [lat, lng]
      return geometry.coordinates.map(coord => [coord[1], coord[0]])
    },

    currentDirectionStops() {
      if (!this.selectedRoute) return []
      return this.activeDirection === 'forward'
          ? this.selectedRoute.forwardStops || []
          : this.selectedRoute.backwardStops || []
    },

    routeColor() {
      return this.activeDirection === 'forward' ? '#3B82F6' : '#EF4444'
    },

    routeDistance() {
      if (!this.currentRouteGeometry) return '0'
      return (this.currentRouteGeometry.length * 0.1).toFixed(1)
    },

    tripRouteSegments() {
      if (!this.tripOption?.route_segments) return []

      return this.tripOption.route_segments
          .filter(segment => segment.route_geometry?.coordinates)
          .map(segment => ({
            coordinates: segment.route_geometry.coordinates.map(coord => [coord[1], coord[0]]),
            color: segment.type === 'walking' ? '#10B981' : '#8B5CF6',
            weight: segment.type === 'walking' ? 3 : 5,
            dashArray: segment.type === 'walking' ? '5, 5' : null
          }))
    }
  },

  watch: {
    currentRouteGeometry: {
      handler() {
        this.$nextTick(() => {
          this.fitMapBounds()
        })
      },
      deep: true
    },

    activeVehicles: {
      handler() {
        // Карта автоматически обновится через reactive props
      },
      deep: true
    }
  },

  mounted() {
    this.mapLoading = false
    this.$nextTick(() => {
      this.fitMapBounds()
    })
  },

  methods: {
    onMapReady(mapObject) {
      this.map = mapObject.leafletObject || mapObject
      this.mapLoading = false
      console.log('✅ Карта Monitoring готова')

      // Обеспечиваем корректный размер карты
      this.$nextTick(() => {
        if (this.map) {
          this.map.invalidateSize()
          this.fitMapBounds()
        }
      })
    },

    onVehicleClick(vehicle) {
      this.$emit('vehicle-focused', vehicle)
      console.log('🚌 Клик по автобусу:', vehicle.vehicleNumber)
    },

    onMapClick(event) {
      if (this.isMapClickMode) {
        const coordinates = {
          lat: event.latlng.lat,
          lng: event.latlng.lng
        }
        this.$emit('map-clicked', coordinates)
        console.log('🗺️ Клик по карте:', coordinates)
      }
    },

    onTripPointClick(pointType) {
      this.$emit('trip-point-clicked', pointType)
      console.log('📍 Клик по точке:', pointType)
    },

    focusOnVehicle(vehicle) {
      if (this.map) {
        this.map.setView([vehicle.latitude, vehicle.longitude], 16)
        console.log('🎯 Фокус на автобусе:', vehicle.vehicleNumber)
      }
    },

    fitMapBounds() {
      if (!this.map) return

      // Создаем bounds для маршрута
      if (this.currentRouteGeometry && this.currentRouteGeometry.length > 0) {
        const group = L.featureGroup()
        const polyline = L.polyline(this.currentRouteGeometry)
        group.addLayer(polyline)

        this.map.fitBounds(group.getBounds(), { padding: [20, 20] })
        console.log('📏 Bounds установлены для маршрута')
      } else if (this.activeVehicles.length > 0) {
        // Если нет геометрии маршрута, фокусируемся на автобусах
        const points = this.activeVehicles.map(v => [v.latitude, v.longitude])
        const group = L.featureGroup()
        points.forEach(point => {
          group.addLayer(L.marker(point))
        })
        this.map.fitBounds(group.getBounds(), { padding: [50, 50] })
        console.log('📍 Bounds установлены для автобусов')
      }
    },

    getBusIcon(vehicle) {
      // Возвращаем CSS класс вместо иконки
      return null // Используем CSS маркеры
    },

    getVehicleStatusClass(vehicle) {
      const isOnline = this.isVehicleOnline(vehicle)
      if (isOnline && vehicle.isMoving) return 'vehicle-moving'
      if (isOnline && !vehicle.isMoving) return 'vehicle-stopped'
      return 'vehicle-offline'
    },

    isVehicleOnline(vehicle) {
      if (!vehicle.lastUpdate) return false
      const lastUpdate = new Date(vehicle.lastUpdate)
      const now = new Date()
      const diffMinutes = (now - lastUpdate) / (1000 * 60)
      return diffMinutes < 5
    },

    formatTime(timestamp) {
      if (!timestamp) return 'Неизвестно'
      return new Date(timestamp).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
/* КРИТИЧЕСКИ ВАЖНО: Стили для корректного отображения */
:deep(.leaflet-container) {
  height: 100% !important;
  width: 100% !important;
  border-radius: 0;
  z-index: 1;
}

/* Исправляем z-index конфликты */
:deep(.leaflet-control-zoom) {
  z-index: 1000;
}

:deep(.leaflet-control-attribution) {
  z-index: 1000;
}

/* ========== СТИЛИ ДЛЯ МАРКЕРОВ ========== */

/* Маркеры точек поездки */
:deep(.trip-marker) {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  cursor: pointer;
  transition: transform 0.2s ease;
}

:deep(.trip-marker:hover) {
  transform: scale(1.2);
}

:deep(.trip-marker-from) {
  background: #10b981;
}

:deep(.trip-marker-to) {
  background: #ef4444;
}

/* Маркеры остановок */
:deep(.bus-stop-marker) {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #3b82f6;
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  cursor: pointer;
}

:deep(.bus-stop-marker:hover) {
  transform: scale(1.3);
}

/* Маркеры автобусов */
:deep(.vehicle-marker) {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  cursor: pointer;
  transition: all 0.3s ease;
}

:deep(.vehicle-moving) {
  background: #10b981;
  animation: vehicle-pulse 2s infinite;
}

:deep(.vehicle-stopped) {
  background: #f59e0b;
}

:deep(.vehicle-offline) {
  background: #6b7280;
}

:deep(.vehicle-marker:hover) {
  transform: scale(1.3);
  z-index: 1001;
}

/* Анимация для движущихся автобусов */
@keyframes vehicle-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.6);
  }
}

/* ========== СТИЛИ ДЛЯ TOOLTIPS И POPUPS ========== */

:deep(.leaflet-tooltip) {
  background: rgba(0, 0, 0, 0.9) !important;
  border: none !important;
  border-radius: 6px !important;
  color: white !important;
  font-size: 12px !important;
  padding: 8px 12px !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
  max-width: 200px !important;
}

:deep(.leaflet-tooltip-top:before) {
  border-top-color: rgba(0, 0, 0, 0.9) !important;
}

:deep(.leaflet-tooltip-bottom:before) {
  border-bottom-color: rgba(0, 0, 0, 0.9) !important;
}

:deep(.leaflet-tooltip-left:before) {
  border-left-color: rgba(0, 0, 0, 0.9) !important;
}

:deep(.leaflet-tooltip-right:before) {
  border-right-color: rgba(0, 0, 0, 0.9) !important;
}

:deep(.leaflet-popup-content-wrapper) {
  background: white !important;
  border-radius: 8px !important;
  box-shadow: 0 8px 25px rgba(0,0,0,0.2) !important;
  padding: 0 !important;
}

:deep(.leaflet-popup-content) {
  margin: 0 !important;
  padding: 16px !important;
  color: #374151 !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
  min-width: 200px !important;
}

:deep(.leaflet-popup-tip) {
  background: white !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
}

/* Стили для контента в tooltips и popups */
.trip-tooltip,
.stop-tooltip,
.vehicle-tooltip {
  text-align: center;
}

.stop-popup h4,
.vehicle-popup h4 {
  margin-bottom: 8px;
  color: #111827;
}

.vehicle-popup .space-y-1 > * + * {
  margin-top: 0.25rem;
}

/* ========== УБИРАЕМ ДЕФОЛТНЫЕ МАРКЕРЫ LEAFLET ========== */
:deep(.leaflet-default-icon-path) {
  display: none;
}

:deep(.leaflet-marker-icon) {
  background: transparent !important;
  border: none !important;
}

/* Стили для overlay */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}
</style>
<template>
  <div class="monitoring-map-container">
    <div v-if="mapLoading" class="map-loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">Загрузка карты...</div>
    </div>

    <LMap
        ref="map"
        :zoom="13"
        :center="[37.9601, 58.3261]"
        @ready="onMapReady"
        @click="onMapClick"
        class="monitoring-map"
    >
      <LTileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
      />

      <!-- Геометрия выбранного автобусного маршрута -->
      <LPolyline
          v-if="currentRouteGeometry && !selectedTripOption"
          :lat-lngs="currentRouteGeometry"
          :color="routeColor"
          :weight="6"
          :opacity="0.8"
      />

      <!-- ✅ НОВОЕ: Сегменты поездки -->
      <LPolyline
          v-for="(segment, index) in tripRouteSegments"
          :key="`trip-segment-${index}`"
          :lat-lngs="segment.coordinates"
          :color="segment.color"
          :weight="segment.weight"
          :opacity="segment.opacity"
          :dash-array="segment.dashArray"
      />

      <!-- ✅ НОВОЕ: Точки маршрута поездки -->
      <LMarker
          v-for="(point, index) in tripRoutePoints"
          :key="`trip-point-${index}`"
          :lat-lng="point.coordinates"
          @click="() => onTripPointClick(point.type)"
      >
        <LIcon
            :icon-size="[32, 32]"
            :icon-anchor="[16, 16]"
        >
          <div :class="[
            'trip-point-marker',
            `trip-point-${point.type}`,
            `trip-segment-${point.segmentType}`
          ]">
            <Icon
                :icon="getTripPointIcon(point.type)"
                class="trip-point-icon"
            />
          </div>
        </LIcon>
        <LTooltip>{{ point.name }}</LTooltip>
      </LMarker>

      <!-- Точки выбора поездки (от/до) -->
      <LMarker
          v-if="tripFromPoint && showTripPoints"
          :lat-lng="tripFromPoint"
          @click="() => onTripPointClick('from')"
      >
        <LIcon :icon-size="[24, 24]" :icon-anchor="[12, 12]">
          <div class="trip-point-marker trip-point-start">
            <Icon :icon="['fas', 'play']" class="trip-point-icon" />
          </div>
        </LIcon>
        <LTooltip>Точка отправления</LTooltip>
      </LMarker>

      <LMarker
          v-if="tripToPoint && showTripPoints"
          :lat-lng="tripToPoint"
          @click="() => onTripPointClick('to')"
      >
        <LIcon :icon-size="[24, 24]" :icon-anchor="[12, 12]">
          <div class="trip-point-marker trip-point-end">
            <Icon :icon="['fas', 'stop']" class="trip-point-icon" />
          </div>
        </LIcon>
        <LTooltip>Точка назначения</LTooltip>
      </LMarker>

      <!-- Автобусы -->
      <LMarker
          v-for="vehicle in activeVehicles"
          :key="`vehicle-${vehicle.id}`"
          :lat-lng="[vehicle.latitude, vehicle.longitude]"
          @click="() => onVehicleClick(vehicle)"
      >
        <LIcon :icon-size="[24, 24]" :icon-anchor="[12, 12]">
          <div :class="['vehicle-marker', { 'vehicle-moving': vehicle.isMoving }]">
            <Icon :icon="['fas', 'bus']" class="vehicle-icon" />
          </div>
        </LIcon>
        <LTooltip>
          Автобус {{ vehicle.vehicleNumber }}<br>
          Скорость: {{ vehicle.speed }} км/ч
        </LTooltip>
      </LMarker>

      <!-- Остановки текущего маршрута -->
      <LCircleMarker
          v-for="stop in currentDirectionStops"
          :key="`stop-${stop.id}`"
          :lat-lng="[stop.latitude, stop.longitude]"
          :radius="6"
          :color="'#1976D2'"
          :fill-color="'#1976D2'"
          :fill-opacity="0.8"
          @click="() => $emit('stop-clicked', stop)"
      >
        <LTooltip>{{ stop.stop_name }}</LTooltip>
      </LCircleMarker>
    </LMap>
  </div>
</template>

<script>
import { LMap, LTileLayer, LMarker, LPolyline, LCircleMarker, LIcon, LTooltip } from '@vue-leaflet/vue-leaflet'
import L from 'leaflet'

export default {
  name: 'MonitoringMap',

  components: {
    LMap,
    LTileLayer,
    LMarker,
    LPolyline,
    LCircleMarker,
    LIcon,
    LTooltip
  },

  props: {
    selectedRoute: { type: Object, default: null },
    activeDirection: { type: String, default: 'forward' },
    routeGeometry: { type: Object, default: null },
    activeVehicles: { type: Array, default: () => [] },
    tripOption: { type: Object, default: null },
    isMapClickMode: { type: Boolean, default: false },
    tripFromPoint: { type: Array, default: null },
    tripToPoint: { type: Array, default: null },
    showTripPoints: { type: Boolean, default: false }
  },

  emits: [
    'vehicle-focused',
    'stop-clicked',
    'map-clicked',
    'trip-point-clicked'
  ],

  data() {
    return {
      map: null,
      mapLoading: true
    }
  },

  computed: {
    // Текущая геометрия автобусного маршрута
    currentRouteGeometry() {
      if (!this.routeGeometry) return null

      const geometry = this.activeDirection === 'forward'
          ? this.routeGeometry.forward
          : this.routeGeometry.backward

      if (!geometry?.coordinates) return null

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

    // ✅ ИСПРАВЛЕННОЕ: Правильная обработка сегментов поездки
    tripRouteSegments() {
      if (!this.tripOption?.route_segments) {
        console.log('❌ Нет route_segments в tripOption')
        return []
      }

      console.log('🔍 Обработка сегментов поездки:', this.tripOption.route_segments.length)

      const segments = []

      this.tripOption.route_segments.forEach((segment, index) => {
        console.log(`📍 Сегмент ${index}:`, {
          type: segment.type,
          hasGeometry: !!segment.route_geometry,
          hasFromTo: !!(segment.from_location && segment.to_location)
        })

        if (segment.type === 'bus_ride' && segment.route_geometry?.coordinates) {
          // Автобусный сегмент с геометрией
          const coordinates = segment.route_geometry.coordinates.map(coord => [coord[1], coord[0]])
          segments.push({
            type: 'bus_ride',
            coordinates: coordinates,
            color: '#3B82F6', // Синий для автобуса
            weight: 5,
            dashArray: null,
            opacity: 0.8,
            routeNumber: segment.route_number
          })
          console.log(`✅ Добавлен автобусный сегмент с ${coordinates.length} точками`)

        } else if (segment.type === 'walking' && segment.from_location && segment.to_location) {
          // Пешеходный сегмент - прямая линия
          const coordinates = [
            [segment.from_location.latitude, segment.from_location.longitude],
            [segment.to_location.latitude, segment.to_location.longitude]
          ]
          segments.push({
            type: 'walking',
            coordinates: coordinates,
            color: '#10B981', // Зеленый для ходьбы
            weight: 3,
            dashArray: '5, 5',
            opacity: 0.6
          })
          console.log('✅ Добавлен пешеходный сегмент')
        } else {
          console.log(`⚠️ Сегмент ${index} пропущен:`, segment.type)
        }
      })

      console.log(`📊 Итого сегментов для отрисовки: ${segments.length}`)
      return segments
    },

    // ✅ НОВОЕ: Точки маршрута для отображения
    tripRoutePoints() {
      if (!this.tripOption?.route_segments) return []

      const points = []

      this.tripOption.route_segments.forEach((segment, index) => {
        // Добавляем начальную точку
        if (segment.from_location && index === 0) {
          points.push({
            type: 'start',
            name: segment.from_location.name || 'Точка отправления',
            coordinates: [segment.from_location.latitude, segment.from_location.longitude],
            segmentType: segment.type
          })
        }

        // Добавляем промежуточные точки (пересадки)
        if (segment.to_location && index < this.tripOption.route_segments.length - 1) {
          points.push({
            type: 'transfer',
            name: segment.to_location.name || 'Пересадка',
            coordinates: [segment.to_location.latitude, segment.to_location.longitude],
            segmentType: segment.type
          })
        }

        // Добавляем конечную точку
        if (segment.to_location && index === this.tripOption.route_segments.length - 1) {
          points.push({
            type: 'end',
            name: segment.to_location.name || 'Точка назначения',
            coordinates: [segment.to_location.latitude, segment.to_location.longitude],
            segmentType: segment.type
          })
        }
      })

      return points
    },

    // Выбранная поездка (для реактивности)
    selectedTripOption() {
      return this.tripOption
    }
  },

  watch: {
    currentRouteGeometry: {
      handler() {
        this.$nextTick(() => {
          if (!this.selectedTripOption) {
            this.fitMapBounds()
          }
        })
      },
      deep: true
    },

    selectedTripOption: {
      handler(newTrip, oldTrip) {
        if (newTrip && newTrip !== oldTrip) {
          console.log('🗺️ Новая поездка выбрана, фокусируем карту')
          this.$nextTick(() => {
            this.fitTripBounds()
          })
        }
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
      console.log('✅ Карта готова')

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

    // ✅ НОВЫЙ МЕТОД: Фокусировка на области поездки
    fitTripBounds() {
      if (!this.map || (!this.tripRouteSegments.length && !this.tripRoutePoints.length)) {
        console.log('❌ Нет данных для фокусировки на поездке')
        return
      }

      const allCoordinates = []

      // Собираем координаты из сегментов
      this.tripRouteSegments.forEach(segment => {
        allCoordinates.push(...segment.coordinates)
      })

      // Добавляем точки маршрута
      this.tripRoutePoints.forEach(point => {
        allCoordinates.push(point.coordinates)
      })

      if (allCoordinates.length > 0) {
        const group = L.featureGroup()
        allCoordinates.forEach(coord => {
          L.marker(coord).addTo(group)
        })

        this.map.fitBounds(group.getBounds(), {
          padding: [30, 30],
          maxZoom: 15
        })
        console.log('🗺️ Карта сфокусирована на поездке')
      }
    },

    fitMapBounds() {
      if (!this.map) return

      // Если есть выбранная поездка, фокусируемся на ней
      if (this.selectedTripOption) {
        this.fitTripBounds()
        return
      }

      // Иначе фокусируемся на автобусном маршруте
      if (this.currentRouteGeometry && this.currentRouteGeometry.length > 0) {
        const group = L.featureGroup()
        this.currentRouteGeometry.forEach(coord => {
          L.marker(coord).addTo(group)
        })

        this.map.fitBounds(group.getBounds(), { padding: [20, 20] })
      } else if (this.activeVehicles.length > 0) {
        // Фокусируемся на автобусах
        const group = L.featureGroup()
        this.activeVehicles.forEach(vehicle => {
          L.marker([vehicle.latitude, vehicle.longitude]).addTo(group)
        })

        this.map.fitBounds(group.getBounds(), { padding: [20, 20] })
      }
    },

    // Иконки для точек поездки
    getTripPointIcon(type) {
      const icons = {
        'start': ['fas', 'play'],
        'end': ['fas', 'stop'],
        'transfer': ['fas', 'exchange-alt'],
        'intermediate': ['fas', 'circle']
      }
      return icons[type] || ['fas', 'map-marker-alt']
    }
  }
}
</script>

<style scoped>
.monitoring-map-container {
  position: relative;
  height: 100%;
  width: 100%;
}

.monitoring-map {
  height: 100%;
  width: 100%;
  z-index: 1;
}

.map-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3B82F6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #666;
  font-size: 14px;
}

/* Стили для маркеров */
.vehicle-marker {
  background: #3B82F6;
  border: 2px solid white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.vehicle-marker.vehicle-moving {
  background: #10B981;
}

.vehicle-icon {
  color: white;
  font-size: 12px;
}

.trip-point-marker {
  border: 2px solid white;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.trip-point-start {
  background: #10B981; /* Зеленый для старта */
}

.trip-point-end {
  background: #EF4444; /* Красный для финиша */
}

.trip-point-transfer {
  background: #F59E0B; /* Оранжевый для пересадок */
}

.trip-point-icon {
  color: white;
  font-size: 14px;
}

@media (max-width: 768px) {
  .trip-point-marker {
    width: 28px;
    height: 28px;
  }

  .trip-point-icon {
    font-size: 12px;
  }
}
</style>
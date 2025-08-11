<template>
  <LMap :use-global-leaflet="true" ref="mapRef" v-model:zoom="defaultZoom" :center="defaultCenter"
        @ready="onMapReady">
    <LTileLayer :url="mapUrl" layer-type="base" name="OpenStreetMap" />
  </LMap>
</template>

<script>
import "@modules/leaflet";

import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

export default {
  name: 'GeoMap',

  props: {
    // Существующая геометрия для отображения
    existingGeometry: {
      type: Array,
      default: () => []
    },
    // Цвет линии для текущего направления
    lineColor: {
      type: String,
      default: '#3B82F6'
    }
  },

  data() {
    return {
      defaultCenter: [37.93585208752015, 58.39120934103419],
      defaultZoom: 13,
      mapUrl: 'https://osm.onlinetaxi.ulgam.biz/tile/{z}/{x}/{y}.png',
      mapReady: false,
      mapRef: null,
      points: [],
      geomanInitialized: false,
      map: null,
      isUpdatingFromProps: false,
      mapLayers: [], // Массив всех геометрических слоев на карте
      existingPolyline: null // Слой для существующей геометрии
    }
  },

  watch: {
    // Отслеживаем изменения существующей геометрии
    existingGeometry: {
      handler(newGeometry) {
        if (this.mapReady && !this.isUpdatingFromProps) {
          this.loadExistingGeometry(newGeometry);
        }
      },
      immediate: true
    },

    lineColor(newColor) {
      // Обновляем цвет для всех слоев
      this.updateAllLayersColor(newColor);
    }
  },

  methods: {
    invalidateMapSize() {
      const map = this.$refs.mapRef?.leafletObject;
      if (map) {
        map.invalidateSize();
      }
    },

    fetchPoints() {
      return this.points;
    },

    // КЛЮЧЕВОЙ МЕТОД: Собрать все геометрические слои с карты
    collectAllMapLayers() {
      this.mapLayers = [];

      // Перебираем все слои карты (как в рабочем примере)
      for (let key in this.map._layers) {
        const layer = this.map._layers[key];

        // Проверяем, что это геометрический слой (polyline/polygon)
        if (layer.hasOwnProperty("_bounds") && !layer.hasOwnProperty("_layers")) {
          this.mapLayers.push(layer);
        }
      }

      console.log('📊 Найдено геометрических слоев на карте:', this.mapLayers.length);
      return this.mapLayers;
    },

    // КЛЮЧЕВОЙ МЕТОД: Объединить координаты всех слоев
    combineAllCoordinates() {
      this.collectAllMapLayers();

      let allCoordinates = [];

      // Объединяем координаты всех слоев (как в рабочем примере)
      this.mapLayers.forEach(layer => {
        const layerCoords = layer.getLatLngs();
        allCoordinates = [...allCoordinates, ...layerCoords];
      });

      // Преобразуем в стандартный формат [lat, lng]
      const coordinates = allCoordinates.map(latlng => {
        if (latlng.lat !== undefined && latlng.lng !== undefined) {
          return [latlng.lat, latlng.lng];
        }
        return latlng;
      });

      console.log('🔗 Объединено координат со всех слоев:', coordinates.length);
      return coordinates;
    },

    // Загрузка существующей геометрии
    loadExistingGeometry(geometry) {
      if (!this.map || !geometry || geometry.length < 2) {
        console.log('⚠️ Нет геометрии для отображения');
        return;
      }

      console.log('📍 Загружаем существующую геометрию:', geometry.length, 'точек');

      // Удаляем предыдущую существующую геометрию
      if (this.existingPolyline) {
        this.map.removeLayer(this.existingPolyline);
        this.existingPolyline = null;
      }

      // Преобразуем координаты
      const leafletCoordinates = geometry.map(point => {
        if (Array.isArray(point) && point.length === 2) {
          const lat = point[0];
          const lng = point[1];

          if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return [lat, lng];
          } else {
            return [lng, lat];
          }
        }
        return point;
      });

      // Создаем polyline для существующей геометрии
      this.existingPolyline = L.polyline(leafletCoordinates, {
        color: this.lineColor,
        weight: 4,
        opacity: 0.8,
        noClip: true
      });

      // Включаем редактирование
      this.existingPolyline.pm.enable();

      // Добавляем на карту
      this.existingPolyline.addTo(this.map);

      // Добавляем обработчик редактирования для существующей геометрии
      this.existingPolyline.on('pm:edit', () => {
        this.handleGeometryChange();
      });

      // Обновляем координаты
      this.handleGeometryChange();

      console.log('✅ Существующая геометрия загружена и готова к редактированию');
    },

    // УНИВЕРСАЛЬНЫЙ ОБРАБОТЧИК изменения геометрии
    handleGeometryChange() {
      console.log('🔄 Обработка изменения геометрии');

      this.isUpdatingFromProps = true;

      // Собираем все координаты со всех слоев
      const allCoordinates = this.combineAllCoordinates();

      // Обновляем внутреннее состояние
      this.points = allCoordinates;

      // Уведомляем родительский компонент
      this.createPoint();

      setTimeout(() => {
        this.isUpdatingFromProps = false;
      }, 50);
    },

    // Обновление цвета всех слоев
    updateAllLayersColor(newColor) {
      this.collectAllMapLayers();

      this.mapLayers.forEach(layer => {
        if (layer.setStyle) {
          layer.setStyle({ color: newColor });
        }
      });

      console.log('🎨 Обновлен цвет для', this.mapLayers.length, 'слоев');
    },

    onMapReady(mapObject) {
      const map = mapObject.leafletObject || this.$refs.mapRef.leafletObject;
      this.map = map;

      if (map && map.pm && !this.geomanInitialized) {
        this.geomanInitialized = true;

        // Настройка Geoman (как в рабочем примере)
        map.pm.addControls({
          position: 'topleft',
          drawCircleMarker: false,
          drawMarker: false,
          drawRectangle: false,
          drawPolygon: false,
          drawCircle: false,
          drawText: false,
          dragMode: false,
          cutPolygon: false,
          rotateMode: false,
        }, {
          polyline: {
            simplifyFactor: 0,
          },
        });

        // Устанавливаем стиль для новых слоев
        map.pm.setPathOptions({
          color: this.lineColor,
          weight: 4,
          opacity: 0.8,
        });

        this.mapReady = true;

        // ОБРАБОТЧИК СОЗДАНИЯ (как в рабочем примере)
        map.on('pm:create', ({ layer }) => {
          console.log('🆕 Создан новый слой');

          // Добавляем обработчик редактирования к новому слою
          layer.on('pm:edit', () => {
            this.handleGeometryChange();
          });

          // Сразу обрабатываем создание
          this.handleGeometryChange();
        });

        // ОБРАБОТЧИК ОКОНЧАНИЯ РИСОВАНИЯ (как в рабочем примере)
        map.on('pm:drawend', () => {
          console.log('🏁 Рисование завершено');
          this.handleGeometryChange();
        });

        // ОБРАБОТЧИК УДАЛЕНИЯ (как в рабочем примере)
        map.on('pm:remove', () => {
          console.log('🗑️ Слой удален');
          this.handleGeometryChange();
        });

        // Загружаем существующую геометрию после инициализации
        if (this.existingGeometry && this.existingGeometry.length > 0) {
          this.loadExistingGeometry(this.existingGeometry);
        }

        console.log('✅ GeoMap инициализирован по рабочему образцу');
      } else {
        console.error("Leaflet-Geoman не инициализирован.");
      }
    },

    createPoint() {
      console.log('📡 Уведомляем родителя, количество точек:', this.points.length);
      this.$emit('create', this.points);
    },

    // Очистка всех слоев
    clearCurrentGeometry() {
      // Удаляем существующую геометрию
      if (this.existingPolyline) {
        this.map.removeLayer(this.existingPolyline);
        this.existingPolyline = null;
      }

      // Удаляем все остальные геометрические слои
      this.collectAllMapLayers();
      this.mapLayers.forEach(layer => {
        this.map.removeLayer(layer);
      });

      this.points = [];
      this.createPoint();
    },

    // Диагностика
    diagnoseMap() {
      this.collectAllMapLayers();

      console.log('🔍 ДИАГНОСТИКА КАРТЫ:');
      console.log('- Всего слоев на карте:', Object.keys(this.map._layers).length);
      console.log('- Геометрических слоев:', this.mapLayers.length);
      console.log('- Внутренних точек:', this.points.length);
      console.log('- Существующая геометрия:', this.existingPolyline ? 'есть' : 'нет');

      return {
        totalLayers: Object.keys(this.map._layers).length,
        geometryLayers: this.mapLayers.length,
        points: this.points.length,
        hasExisting: !!this.existingPolyline
      };
    }
  },

  beforeUnmount() {
    if (this.existingPolyline && this.map) {
      this.map.removeLayer(this.existingPolyline);
    }
  }
}
</script>

<style scoped>
.leaflet-container {
  height: 100%;
  width: 100%;
}

.leaflet-pm-toolbar {
  z-index: 1000;
}

.leaflet-pm-toolbar .leaflet-pm-icon-active {
  background-color: #3B82F6;
  border-color: #2563EB;
}
</style>
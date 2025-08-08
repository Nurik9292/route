<template>
  <div class="route-geometry-modal fixed inset-0 z-50 overflow-auto bg-black/70">
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="bg-k-bg-primary rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <!-- Header -->
        <header class="p-6 border-b border-k-border">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-semibold text-k-text-primary">
                Геометрия маршрута: {{ route?.routeNumber }}
              </h2>
              <p class="text-sm text-k-text-secondary mt-1">
                {{ route?.routeName }}
              </p>
            </div>
            <BtnComponent @click="close" white small>
              <Icon :icon="['fas', 'times']" />
            </BtnComponent>
          </div>
        </header>

        <!-- Content -->
        <div class="flex-1 overflow-hidden">
          <div class="h-[60vh] bg-gray-100 relative">
            <!-- GeoMap Component -->
            <GeoMap
                v-if="mapVisible"
                ref="geoMap"
                @create="onGeometryCreated"
                class="w-full h-full"
            />

            <!-- Loading State -->
            <div v-if="!mapVisible" class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <Icon :icon="['fas', 'spinner']" class="animate-spin text-3xl text-blue-500 mb-2" />
                <p class="text-gray-600">Загрузка карты...</p>
              </div>
            </div>

            <!-- Drawing Instructions Overlay -->
            <div v-if="mapVisible && !hasGeometry" class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-lg text-center">
                <Icon :icon="['fas', 'map']" class="text-4xl text-blue-500 mb-3" />
                <h3 class="text-lg font-medium text-gray-700 mb-2">
                  Нарисуйте маршрут
                </h3>
                <p class="text-sm text-gray-600 mb-3">
                  Используйте инструменты на карте слева для создания линии маршрута
                </p>
                <div class="text-xs text-gray-500">
                  <p>• Выберите инструмент "Линия"</p>
                  <p>• Кликайте по карте для добавления точек</p>
                  <p>• Завершите двойным кликом</p>
                </div>
              </div>
            </div>

            <!-- Route Info Panel -->
            <div v-if="routePoints.length > 0" class="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg">
              <div class="text-sm space-y-2">
                <div class="font-medium text-gray-700">Информация о маршруте</div>
                <div class="text-xs text-gray-600">
                  <div>Точек: {{ routePoints.length }}</div>
                  <div>Расстояние: ~{{ estimatedDistance }} км</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <footer class="p-6 border-t border-k-border bg-k-bg-secondary">
          <div class="flex justify-between items-center">
            <div class="text-sm text-k-text-secondary">
              <span v-if="hasGeometry">
                <Icon :icon="['fas', 'check-circle']" class="text-green-500 mr-1" />
                Геометрия настроена
              </span>
              <span v-else>
                <Icon :icon="['fas', 'exclamation-triangle']" class="text-orange-500 mr-1" />
                Геометрия не настроена
              </span>
            </div>

            <div class="flex gap-3">
              <BtnComponent @click="close" white>
                Закрыть
              </BtnComponent>

              <BtnComponent
                  v-if="!drawingMode && !hasGeometry"
                  @click="startDrawing"
                  blue
              >
                <Icon :icon="['fas', 'pencil-alt']" class="mr-2" />
                Нарисовать маршрут
              </BtnComponent>

              <BtnComponent
                  v-if="drawingMode"
                  @click="saveGeometry"
                  :disabled="!canSave"
                  :loading="saving"
                  success
              >
                <Icon :icon="['fas', 'save']" class="mr-2" />
                Сохранить
              </BtnComponent>

              <BtnComponent
                  v-if="hasGeometry && !drawingMode"
                  @click="editGeometry"
                  blue
              >
                <Icon :icon="['fas', 'edit']" class="mr-2" />
                Редактировать
              </BtnComponent>
            </div>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useMessageToaster } from '@/composables';
import routeAPI from '@/api/routeAPI';

import BtnComponent from '../Ui/Form/BtnComponent.vue';
import GeoMap from '../Map/GeoMap.vue';

export default {
  name: 'RouteGeometryModal',

  components: {
    BtnComponent,
    GeoMap
  },

  props: {
    route: {
      type: Object,
      required: true
    }
  },

  emits: ['close', 'geometry-updated'],

  setup(props, { emit }) {
    const { toastSuccess, toastError } = useMessageToaster();

    const saving = ref(false);
    const routePoints = ref([]);
    const estimatedDistance = ref(0);
    const geometryData = ref(null);
    const mapVisible = ref(true);

    const hasGeometry = computed(() => {
      return props.route?.hasGeometry ||
          props.route?.geometry ||
          geometryData.value ||
          routePoints.value.length > 0;
    });

    const canSave = computed(() => {
      return routePoints.value.length >= 2;
    });

    return {
      saving,
      routePoints,
      estimatedDistance,
      geometryData,
      mapVisible,
      hasGeometry,
      canSave,
      toastSuccess,
      toastError,
      emit
    };
  },

  methods: {
    close() {
      this.$emit('close');
    },

    onGeometryCreated(points) {
      if (points && points.length >= 2) {
        this.routePoints = points;
        this.calculateDistance();
        this.toastSuccess('Геометрия маршрута создана. Теперь можно сохранить.');
      }
    },

    async loadExistingGeometry() {
      if (!this.route?.routeNumber) return;

      try {
        const geometry = await routeAPI.getRouteGeometry(this.route.routeNumber);
        if (geometry) {
          this.geometryData = geometry;
          this.currentPoints = geometry.coordinates?.length || 0;
          this.calculateDistance();
        }
      } catch (error) {
        // Geometry not found - that's ok
        console.log('No existing geometry found');
      }
    },

    startDrawing() {
      this.drawingMode = true;
      this.isDrawing = true;
      this.toastSuccess('Режим рисования активирован. Кликайте по карте для добавления точек.');
    },

    editGeometry() {
      this.drawingMode = true;
      this.isDrawing = false;
      this.toastSuccess('Режим редактирования геометрии активирован.');
    },

    toggleDrawing() {
      this.isDrawing = !this.isDrawing;
      this.toastSuccess(this.isDrawing ? 'Рисование возобновлено' : 'Рисование приостановлено');
    },

    undoLastPoint() {
      if (this.currentPoints > 0) {
        this.currentPoints--;
        this.calculateDistance();
        this.toastSuccess('Последняя точка удалена');
      }
    },

    clearGeometry() {
      this.currentPoints = 0;
      this.estimatedDistance = 0;
      this.geometryData = null;
      this.toastSuccess('Геометрия очищена');
    },

    calculateDistance() {
      // Mock distance calculation
      this.estimatedDistance = (this.currentPoints * 0.5).toFixed(1);
    },

    async saveGeometry() {
      if (!this.canSave) {
        this.toastError('Для сохранения нужно минимум 2 точки');
        return;
      }

      this.saving = true;

      try {
        // Mock geometry data for now
        const mockGeometry = {
          type: 'LineString',
          coordinates: Array.from({ length: this.currentPoints }, (_, i) => [
            58.3261 + (i * 0.001), // Longitude
            37.9601 + (i * 0.001)  // Latitude
          ])
        };

        await routeAPI.updateRouteGeometry(this.route.routeNumber, {
          geometry: mockGeometry
        });

        this.geometryData = mockGeometry;
        this.drawingMode = false;
        this.isDrawing = false;

        this.toastSuccess('Геометрия маршрута сохранена');
        this.$emit('geometry-updated');
      } catch (error) {
        this.toastError('Ошибка сохранения геометрии');
        console.error('Save geometry error:', error);
      } finally {
        this.saving = false;
      }
    }
  }
};
</script>

<style scoped>
.route-geometry-modal {
  backdrop-filter: blur(2px);
}

/* Map container styling */
.bg-gray-100 {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
}

/* Control panels */
.bg-white\/95 {
  background-color: rgba(255, 255, 255, 0.95);
}

/* Smooth transitions */
.route-geometry-modal * {
  transition: all 0.2s ease;
}

/* Button hover effects */
.bg-white:hover {
  background-color: #f8f9fa;
}

/* Loading states */
.saving {
  pointer-events: none;
  opacity: 0.7;
}

/* Responsive design */
@media (max-width: 768px) {
  .max-w-4xl {
    max-width: 95vw;
  }

  .h-\[60vh\] {
    height: 50vh;
  }

  .absolute.top-4.left-4,
  .absolute.top-4.right-4 {
    position: relative;
    top: auto;
    left: auto;
    right: auto;
    margin: 1rem;
  }
}
</style>
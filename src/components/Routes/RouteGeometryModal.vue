<template>
  <div class="route-geometry-modal fixed inset-0 z-50 overflow-auto bg-black/70">
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="bg-k-bg-primary rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] flex flex-col">
        <!-- Header -->
        <header class="p-6 border-b border-k-border">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-semibold text-k-text-primary">
                Геометрия маршрута{{ route?.route_number ? `: ${route.route_number}` : '' }}
              </h2>
              <p class="text-sm text-k-text-secondary mt-1">
                {{ route?.route_name || 'Новый маршрут' }}
              </p>
            </div>
            <BtnComponent @click="close" white small>
              <Icon :icon="['fas', 'times']" />
            </BtnComponent>
          </div>
        </header>

        <!-- Direction Tabs -->
        <div class="direction-tabs px-6 pt-4">
          <div class="flex border-b border-k-border">
            <button
                type="button"
                @click="activeDirection = 'forward'"
                :class="[
                  'px-4 py-2 font-medium text-sm transition-colors relative',
                  activeDirection === 'forward'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-k-text-secondary hover:text-k-text-primary'
                ]"
            >
              <Icon :icon="['fas', 'arrow-right']" class="mr-2" />
              Прямое направление
              <span v-if="forwardGeometry.length > 0" class="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                {{ forwardGeometry.length }} точек
              </span>
            </button>
            <button
                type="button"
                @click="activeDirection = 'backward'"
                :class="[
                  'px-4 py-2 font-medium text-sm transition-colors relative',
                  activeDirection === 'backward'
                    ? 'border-b-2 border-orange-500 text-orange-600'
                    : 'text-k-text-secondary hover:text-k-text-primary'
                ]"
            >
              <Icon :icon="['fas', 'arrow-left']" class="mr-2" />
              Обратное направление
              <span v-if="backwardGeometry.length > 0" class="ml-2 bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                {{ backwardGeometry.length }} точек
              </span>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-hidden flex">
          <!-- Map Panel -->
          <div class="flex-1 relative">
            <div class="h-[70vh] bg-gray-100 relative">
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
              <div v-if="mapVisible && !hasCurrentGeometry" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-lg text-center max-w-md">
                  <Icon :icon="['fas', 'map']" class="text-4xl mb-3" :class="directionColor" />
                  <h3 class="text-lg font-medium text-gray-700 mb-2">
                    Нарисуйте {{ directionLabel.toLowerCase() }}
                  </h3>
                  <p class="text-sm text-gray-600 mb-3">
                    Используйте инструмент "Линия" на панели слева
                  </p>
                  <div class="text-xs text-gray-500 space-y-1">
                    <p>• Выберите инструмент рисования линии</p>
                    <p>• Кликайте по карте для добавления точек</p>
                    <p>• Завершите двойным кликом</p>
                  </div>
                </div>
              </div>

              <!-- Direction Indicator -->
              <div class="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <div class="flex items-center gap-2">
                  <Icon
                      :icon="activeDirection === 'forward' ? ['fas', 'arrow-right'] : ['fas', 'arrow-left']"
                      :class="directionColor"
                      class="text-lg"
                  />
                  <span class="font-medium text-gray-700">{{ directionLabel }}</span>
                </div>
              </div>

              <!-- Route Info Panel -->
              <div v-if="hasCurrentGeometry" class="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                <div class="text-sm space-y-2">
                  <div class="font-medium text-gray-700">{{ directionLabel }}</div>
                  <div class="text-xs text-gray-600">
                    <div>Точек: {{ currentGeometry.length }}</div>
                    <div>Расстояние: ~{{ currentDistance }} км</div>
                    <div :class="directionColor + ' font-medium'">✓ Готово к сохранению</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Control Panel -->
          <div class="w-80 bg-k-bg-secondary border-l border-k-border p-4">
            <h3 class="font-medium text-k-text-primary mb-4">
              Управление геометрией
            </h3>

            <!-- Current Direction Controls -->
            <div class="mb-6">
              <h4 class="text-sm font-medium mb-3" :class="directionColor">
                {{ directionLabel }}
              </h4>

              <div class="space-y-2">
                <BtnComponent
                    @click="clearCurrentGeometry"
                    v-if="hasCurrentGeometry"
                    small
                    danger
                    block
                >
                  <Icon :icon="['fas', 'trash']" class="mr-2" />
                  Очистить {{ directionLabel.toLowerCase() }}
                </BtnComponent>

                <div v-if="hasCurrentGeometry" class="text-xs text-k-text-secondary p-2 bg-k-bg-primary rounded">
                  <div class="flex justify-between">
                    <span>Точек:</span>
                    <span>{{ currentGeometry.length }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Расстояние:</span>
                    <span>{{ currentDistance }} км</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Smart Actions -->
            <div class="mb-6">
              <h4 class="text-sm font-medium text-k-text-secondary mb-3">Умные действия</h4>

              <div class="space-y-2">
                <BtnComponent
                    @click="copyToOppositeDirection"
                    :disabled="!hasCurrentGeometry"
                    small
                    blue
                    block
                >
                  <Icon :icon="['fas', 'copy']" class="mr-2" />
                  Копировать в {{ oppositeDirectionLabel.toLowerCase() }}
                </BtnComponent>

                <BtnComponent
                    @click="reverseAndCopy"
                    :disabled="!hasCurrentGeometry"
                    small
                    white
                    block
                >
                  <Icon :icon="['fas', 'exchange-alt']" class="mr-2" />
                  Обратить и копировать
                </BtnComponent>

                <BtnComponent
                    @click="mirrorFromOpposite"
                    :disabled="!hasOppositeGeometry"
                    small
                    white
                    block
                >
                  <Icon :icon="['fas', 'clone']" class="mr-2" />
                  Скопировать из {{ oppositeDirectionLabel.toLowerCase() }}
                </BtnComponent>
              </div>
            </div>

            <!-- Overall Statistics -->
            <div class="mb-6">
              <h4 class="text-sm font-medium text-k-text-secondary mb-3">Общая статистика</h4>

              <div class="bg-k-bg-primary p-3 rounded-lg space-y-2 text-xs">
                <div class="flex justify-between">
                  <span>Прямое направление:</span>
                  <span :class="forwardGeometry.length >= 2 ? 'text-green-600' : 'text-orange-600'">
                    {{ forwardGeometry.length > 0 ? `${forwardGeometry.length} точек` : 'Не настроено' }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span>Обратное направление:</span>
                  <span :class="backwardGeometry.length >= 2 ? 'text-green-600' : 'text-orange-600'">
                    {{ backwardGeometry.length > 0 ? `${backwardGeometry.length} точек` : 'Не настроено' }}
                  </span>
                </div>
                <div class="border-t border-k-border pt-2 mt-2">
                  <div class="flex justify-between">
                    <span>Общий статус:</span>
                    <span :class="isAllGeometryValid ? 'text-green-600' : 'text-orange-600'">
                      {{ isAllGeometryValid ? 'Готово' : 'Требует настройки' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Global Actions -->
            <div class="space-y-2">
              <BtnComponent
                  @click="clearAllGeometry"
                  :disabled="!hasAnyGeometry"
                  small
                  danger
                  block
              >
                <Icon :icon="['fas', 'trash-alt']" class="mr-2" />
                Очистить всё
              </BtnComponent>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <footer class="p-6 border-t border-k-border bg-k-bg-secondary">
          <div class="flex justify-between items-center">
            <div class="text-sm text-k-text-secondary">
              <span v-if="isAllGeometryValid">
                <Icon :icon="['fas', 'check-circle']" class="text-green-500 mr-1" />
                Геометрия обоих направлений настроена
              </span>
              <span v-else>
                <Icon :icon="['fas', 'exclamation-triangle']" class="text-orange-500 mr-1" />
                {{ validationMessage }}
              </span>
            </div>

            <div class="flex gap-3">
              <BtnComponent @click="close" white>
                Закрыть
              </BtnComponent>

              <BtnComponent
                  @click="saveAllGeometry"
                  :disabled="!isAllGeometryValid"
                  :loading="saving"
                  success
              >
                <Icon :icon="['fas', 'save']" class="mr-2" />
                {{ isEditMode ? 'Обновить геометрию' : 'Сохранить геометрию' }}
              </BtnComponent>
            </div>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
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
    },
    existingForwardGeometry: {
      type: Array,
      default: () => []
    },
    existingBackwardGeometry: {
      type: Array,
      default: () => []
    }
  },

  emits: ['close', 'geometry-updated'],

  setup(props, { emit }) {
    const { toastSuccess, toastError } = useMessageToaster();

    const saving = ref(false);
    const mapVisible = ref(true);
    const activeDirection = ref('forward');


    const forwardGeometry = ref([...props.existingForwardGeometry]);
    const backwardGeometry = ref([...props.existingBackwardGeometry]);


    const forwardDistance = ref(0);
    const backwardDistance = ref(0);


    const isEditMode = computed(() => {
      return !!props.route.route_number;
    });


    const directionLabel = computed(() => {
      return activeDirection.value === 'forward' ? 'Прямое направление' : 'Обратное направление';
    });

    const oppositeDirectionLabel = computed(() => {
      return activeDirection.value === 'forward' ? 'Обратное направление' : 'Прямое направление';
    });

    const directionColor = computed(() => {
      return activeDirection.value === 'forward' ? 'text-blue-500' : 'text-orange-500';
    });

    const currentGeometry = computed(() => {
      return activeDirection.value === 'forward' ? forwardGeometry.value : backwardGeometry.value;
    });

    const currentDistance = computed(() => {
      return activeDirection.value === 'forward' ? forwardDistance.value : backwardDistance.value;
    });

    const hasCurrentGeometry = computed(() => {
      return currentGeometry.value.length >= 2;
    });

    const hasOppositeGeometry = computed(() => {
      const opposite = activeDirection.value === 'forward' ? backwardGeometry.value : forwardGeometry.value;
      return opposite.length >= 2;
    });

    const hasAnyGeometry = computed(() => {
      return forwardGeometry.value.length > 0 || backwardGeometry.value.length > 0;
    });

    const isAllGeometryValid = computed(() => {
      return forwardGeometry.value.length >= 2 && backwardGeometry.value.length >= 2;
    });

    const validationMessage = computed(() => {
      if (forwardGeometry.value.length < 2 && backwardGeometry.value.length < 2) {
        return 'Нужно нарисовать оба направления';
      } else if (forwardGeometry.value.length < 2) {
        return 'Нужно нарисовать прямое направление';
      } else if (backwardGeometry.value.length < 2) {
        return 'Нужно нарисовать обратное направление';
      }
      return '';
    });


    const onGeometryCreated = (points) => {
      console.log('📍 Получены точки от GeoMap для', activeDirection.value, ':', points);

      if (points && points.length >= 2) {

        const coordinates = points.map(point => [point.lat, point.lng]);

        if (activeDirection.value === 'forward') {
          forwardGeometry.value = coordinates;
          calculateDistance('forward');
        } else {
          backwardGeometry.value = coordinates;
          calculateDistance('backward');
        }

        toastSuccess(`${directionLabel.value} создано: ${points.length} точек`);
      } else if (points && points.length === 0) {

        if (activeDirection.value === 'forward') {
          forwardGeometry.value = [];
          forwardDistance.value = 0;
        } else {
          backwardGeometry.value = [];
          backwardDistance.value = 0;
        }
        toastSuccess(`${directionLabel.value} удалено`);
      }
    };

    const calculateDistance = (direction) => {
      const geometry = direction === 'forward' ? forwardGeometry.value : backwardGeometry.value;

      if (geometry.length < 2) {
        if (direction === 'forward') {
          forwardDistance.value = 0;
        } else {
          backwardDistance.value = 0;
        }
        return;
      }

      let totalDistance = 0;
      for (let i = 1; i < geometry.length; i++) {
        const prev = geometry[i - 1];
        const curr = geometry[i];
        totalDistance += calculateDistanceBetweenPoints(prev[0], prev[1], curr[0], curr[1]);
      }

      const distanceKm = (totalDistance / 1000).toFixed(1);
      if (direction === 'forward') {
        forwardDistance.value = distanceKm;
      } else {
        backwardDistance.value = distanceKm;
      }
    };

    const calculateDistanceBetweenPoints = (lat1, lng1, lat2, lng2) => {
      const R = 6371000;
      const dLat = toRadians(lat2 - lat1);
      const dLng = toRadians(lng2 - lng1);

      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const toRadians = (degrees) => {
      return degrees * (Math.PI / 180);
    };


    const clearCurrentGeometry = () => {
      if (activeDirection.value === 'forward') {
        forwardGeometry.value = [];
        forwardDistance.value = 0;
      } else {
        backwardGeometry.value = [];
        backwardDistance.value = 0;
      }

      toastSuccess(`${directionLabel.value} очищено`);
    };

    const clearAllGeometry = () => {
      forwardGeometry.value = [];
      backwardGeometry.value = [];
      forwardDistance.value = 0;
      backwardDistance.value = 0;
      toastSuccess('Вся геометрия очищена');
    };

    const copyToOppositeDirection = () => {
      const sourceGeometry = [...currentGeometry.value];

      if (activeDirection.value === 'forward') {
        backwardGeometry.value = sourceGeometry;
        calculateDistance('backward');
        toastSuccess('Геометрия скопирована в обратное направление');
      } else {
        forwardGeometry.value = sourceGeometry;
        calculateDistance('forward');
        toastSuccess('Геометрия скопирована в прямое направление');
      }
    };

    const reverseAndCopy = () => {
      const sourceGeometry = [...currentGeometry.value].reverse();

      if (activeDirection.value === 'forward') {
        backwardGeometry.value = sourceGeometry;
        calculateDistance('backward');
        toastSuccess('Геометрия обращена и скопирована в обратное направление');
      } else {
        forwardGeometry.value = sourceGeometry;
        calculateDistance('forward');
        toastSuccess('Геометрия обращена и скопирована в прямое направление');
      }
    };

    const mirrorFromOpposite = () => {
      const oppositeGeometry = activeDirection.value === 'forward'
          ? [...backwardGeometry.value]
          : [...forwardGeometry.value];

      if (activeDirection.value === 'forward') {
        forwardGeometry.value = oppositeGeometry;
        calculateDistance('forward');
      } else {
        backwardGeometry.value = oppositeGeometry;
        calculateDistance('backward');
      }

      toastSuccess(`Геометрия скопирована из ${oppositeDirectionLabel.value.toLowerCase()}`);
    };

    const saveAllGeometry = async () => {
      if (!isAllGeometryValid.value) {
        toastError('Необходимо настроить геометрию обоих направлений');
        return;
      }

      saving.value = true;

      try {
        const geometryData = {
          forward_geometry: forwardGeometry.value,
          backward_geometry: backwardGeometry.value
        };

        console.log('💾 Сохраняем геометрию обоих направлений:', geometryData);

        if (isEditMode.value) {

          await routeAPI.updateRouteGeometry(props.route.route_number, geometryData);
          toastSuccess('Геометрия маршрута обновлена');
        } else {

          toastSuccess('Геометрия готова к сохранению');
        }

        emit('geometry-updated', geometryData);

        if (isEditMode.value) {
          emit('close');
        }
      } catch (error) {
        toastError('Ошибка сохранения геометрии');
        console.error('Save geometry error:', error);
      } finally {
        saving.value = false;
      }
    };

    const close = () => {
      emit('close');
    };


    onMounted(() => {
      if (props.existingForwardGeometry.length > 0) {
        calculateDistance('forward');
      }
      if (props.existingBackwardGeometry.length > 0) {
        calculateDistance('backward');
      }
    });


    watch(activeDirection, () => {

      nextTick(() => {

        if (mapVisible.value) {

        }
      });
    });

    return {
      saving,
      mapVisible,
      activeDirection,
      forwardGeometry,
      backwardGeometry,
      forwardDistance,
      backwardDistance,
      isEditMode,
      directionLabel,
      oppositeDirectionLabel,
      directionColor,
      currentGeometry,
      currentDistance,
      hasCurrentGeometry,
      hasOppositeGeometry,
      hasAnyGeometry,
      isAllGeometryValid,
      validationMessage,
      onGeometryCreated,
      clearCurrentGeometry,
      clearAllGeometry,
      copyToOppositeDirection,
      reverseAndCopy,
      mirrorFromOpposite,
      saveAllGeometry,
      close
    };
  }
};
</script>

<style scoped>
.route-geometry-modal {
  backdrop-filter: blur(2px);
}

/* Direction tabs styling */
.direction-tabs button {
  position: relative;
}

.direction-tabs button::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: transparent;
  transition: background-color 0.2s ease;
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
* {
  transition: all 0.2s ease;
}

/* Responsive design */
@media (max-width: 1280px) {
  .max-w-6xl {
    max-width: 95vw;
  }

  .w-80 {
    width: 18rem;
  }
}

@media (max-width: 768px) {
  .flex-1 {
    min-height: 50vh;
  }

  .w-80 {
    width: 100%;
    border-left: none;
    border-top: 1px solid var(--color-border);
  }

  .flex {
    flex-direction: column;
  }
}
</style>
<template>
  <div class="route-stops-modal fixed inset-0 z-50 overflow-auto bg-black/70">
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="bg-k-bg-primary rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <!-- Header -->
        <header class="p-6 border-b border-k-border">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-semibold text-k-text-primary">
                Остановки маршрута: {{ route?.routeNumber }}
              </h2>
              <p class="text-sm text-k-text-secondary mt-1">
                {{ route?.routeName }}
              </p>
            </div>
            <BtnComponent @click="close" white small>
              <Icon :icon="['fas', 'times']" />
            </BtnComponent>
          </div>

          <!-- Direction Tabs -->
          <div class="mt-4 flex gap-2">
            <button
                @click="selectedDirection = 0"
                :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                selectedDirection === 0
                  ? 'bg-k-accent text-white'
                  : 'bg-k-bg-secondary text-k-text-secondary hover:bg-k-bg-tertiary'
              ]"
            >
              <Icon :icon="['fas', 'arrow-right']" class="mr-2" />
              Прямое направление
              <span v-if="forwardStops.length > 0" class="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs">
                {{ forwardStops.length }}
              </span>
            </button>

            <button
                @click="selectedDirection = 1"
                :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                selectedDirection === 1
                  ? 'bg-k-accent text-white'
                  : 'bg-k-bg-secondary text-k-text-secondary hover:bg-k-bg-tertiary'
              ]"
            >
              <Icon :icon="['fas', 'arrow-left']" class="mr-2" />
              Обратное направление
              <span v-if="reverseStops.length > 0" class="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs">
                {{ reverseStops.length }}
              </span>
            </button>
          </div>
        </header>

        <!-- Content -->
        <div class="flex-1 overflow-hidden flex">
          <!-- Stops List -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-6">
              <!-- Loading State -->
              <div v-if="loading" class="text-center py-8">
                <Icon :icon="['fas', 'spinner']" class="animate-spin text-2xl text-k-text-secondary mb-2" />
                <p class="text-k-text-secondary">Загрузка остановок...</p>
              </div>

              <!-- Stops List -->
              <div v-else-if="currentStops.length > 0" class="space-y-3">
                <div
                    v-for="(stop, index) in currentStops"
                    :key="stop.id || index"
                    :class="[
                    'stop-item p-4 rounded-lg border transition-all duration-200',
                    'bg-k-bg-secondary border-k-border hover:border-k-accent hover:shadow-md'
                  ]"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                      <!-- Sequence Number -->
                      <div class="flex-shrink-0 w-8 h-8 bg-k-accent text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {{ stop.sequenceOrder || index + 1 }}
                      </div>

                      <!-- Stop Info -->
                      <div class="flex-1 min-w-0">
                        <h3 class="font-medium text-k-text-primary truncate">
                          {{ stop.stopName }}
                        </h3>
                        <div class="flex items-center gap-4 mt-1">
                          <span v-if="stop.nameTm" class="text-sm text-k-text-secondary truncate">
                            {{ stop.nameTm }}
                          </span>
                          <span v-if="stop.coordinates" class="text-xs text-k-text-tertiary">
                            {{ formatCoordinates(stop.coordinates) }}
                          </span>
                        </div>
                        <div v-if="stop.distanceFromStart" class="text-xs text-k-text-secondary mt-1">
                          Расстояние от начала: {{ formatDistance(stop.distanceFromStart) }}
                        </div>
                      </div>
                    </div>

                    <!-- Stop Actions -->
                    <div class="flex items-center gap-2">
                      <!-- Stop Status -->
                      <span
                          :class="[
                          'px-2 py-1 rounded-full text-xs font-medium',
                          stop.isActive
                            ? 'text-green-700 bg-green-100'
                            : 'text-red-700 bg-red-100'
                        ]"
                      >
                        {{ stop.isActive ? 'Активна' : 'Неактивна' }}
                      </span>

                      <!-- Major Stop Indicator -->
                      <span
                          v-if="stop.isMajorStop"
                          class="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                          title="Крупная остановка"
                      >
                        <Icon :icon="['fas', 'star']" class="mr-1" />
                        Крупная
                      </span>

                      <!-- Actions -->
                      <BtnComponent
                          @click="editStopOrder(stop)"
                          small
                          white
                          title="Изменить порядок"
                      >
                        <Icon :icon="['fas', 'sort']" />
                      </BtnComponent>

                      <BtnComponent
                          @click="removeStopFromRoute(stop)"
                          small
                          danger
                          title="Удалить из маршрута"
                      >
                        <Icon :icon="['fas', 'times']" />
                      </BtnComponent>
                    </div>
                  </div>

                  <!-- Travel Time to Next Stop -->
                  <div v-if="stop.travelTimeToNext" class="mt-3 pt-3 border-t border-k-border">
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-k-text-secondary">
                        <Icon :icon="['fas', 'clock']" class="mr-1" />
                        До следующей остановки:
                      </span>
                      <span class="font-medium text-k-text-primary">
                        {{ stop.travelTimeToNext }} мин
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-else class="text-center py-12">
                <Icon :icon="['fas', 'map-marker-alt']" class="text-4xl text-gray-400 mb-4" />
                <h3 class="text-lg font-medium text-gray-600 mb-2">
                  Нет остановок
                </h3>
                <p class="text-sm text-gray-500 mb-4">
                  В {{ selectedDirection === 0 ? 'прямом' : 'обратном' }} направлении нет настроенных остановок
                </p>
                <BtnComponent @click="addStopToRoute" blue>
                  <Icon :icon="['fas', 'plus']" class="mr-2" />
                  Добавить остановку
                </BtnComponent>
              </div>
            </div>
          </div>

          <!-- Statistics Panel -->
          <div class="w-80 border-l border-k-border bg-k-bg-secondary p-6">
            <h3 class="font-medium text-k-text-primary mb-4">Статистика маршрута</h3>

            <div class="space-y-4">
              <!-- Direction Statistics -->
              <div class="bg-k-bg-primary p-4 rounded-lg">
                <h4 class="text-sm font-medium text-k-text-secondary mb-3">
                  {{ selectedDirection === 0 ? 'Прямое' : 'Обратное' }} направление
                </h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span>Остановок:</span>
                    <span class="font-medium">{{ currentStops.length }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Активных:</span>
                    <span class="font-medium text-green-600">
                      {{ currentStops.filter(s => s.isActive).length }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span>Крупных:</span>
                    <span class="font-medium text-purple-600">
                      {{ currentStops.filter(s => s.isMajorStop).length }}
                    </span>
                  </div>
                  <div v-if="routeStats.totalDistance" class="flex justify-between">
                    <span>Общая длина:</span>
                    <span class="font-medium">{{ formatDistance(routeStats.totalDistance) }}</span>
                  </div>
                  <div v-if="routeStats.estimatedTime" class="flex justify-between">
                    <span>Время в пути:</span>
                    <span class="font-medium">{{ routeStats.estimatedTime }} мин</span>
                  </div>
                </div>
              </div>

              <!-- General Statistics -->
              <div class="bg-k-bg-primary p-4 rounded-lg">
                <h4 class="text-sm font-medium text-k-text-secondary mb-3">Общая статистика</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span>Всего остановок:</span>
                    <span class="font-medium">{{ totalStops }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Прямое направление:</span>
                    <span class="font-medium">{{ forwardStops.length }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Обратное направление:</span>
                    <span class="font-medium">{{ reverseStops.length }}</span>
                  </div>
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="space-y-2">
                <BtnComponent @click="addStopToRoute" block blue small>
                  <Icon :icon="['fas', 'plus']" class="mr-2" />
                  Добавить остановку
                </BtnComponent>

                <BtnComponent @click="reorderStops" block white small>
                  <Icon :icon="['fas', 'sort']" class="mr-2" />
                  Изменить порядок
                </BtnComponent>

                <BtnComponent @click="syncWithOtherDirection" block purple small>
                  <Icon :icon="['fas', 'sync']" class="mr-2" />
                  Синхронизировать
                </BtnComponent>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <footer class="p-6 border-t border-k-border bg-k-bg-secondary">
          <div class="flex justify-between items-center">
            <div class="text-sm text-k-text-secondary">
              Всего остановок: {{ totalStops }} |
              Активных: {{ activeStopsCount }}
            </div>

            <div class="flex gap-3">
              <BtnComponent @click="exportStops" white>
                <Icon :icon="['fas', 'download']" class="mr-2" />
                Экспорт
              </BtnComponent>

              <BtnComponent @click="close" blue>
                Готово
              </BtnComponent>
            </div>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useMessageToaster } from '@/composables';
import routeAPI from '@/api/routeAPI';

import BtnComponent from '../Ui/Form/BtnComponent.vue';

export default {
  name: 'RouteStopsModal',

  components: {
    BtnComponent
  },

  props: {
    route: {
      type: Object,
      required: true
    }
  },

  emits: ['close', 'stops-updated'],

  setup(props, { emit }) {
    const { toastSuccess, toastError } = useMessageToaster();

    const loading = ref(false);
    const selectedDirection = ref(0);
    const forwardStops = ref([]);
    const reverseStops = ref([]);

    // Mock data for demonstration
    const mockStops = [
      {
        id: '1',
        stopName: 'Ак кайым',
        nameTm: 'Ak kaýym',
        sequenceOrder: 1,
        coordinates: [58.3261, 37.9601],
        isActive: true,
        isMajorStop: true,
        distanceFromStart: 0,
        travelTimeToNext: 3
      },
      {
        id: '2',
        stopName: 'Центр города',
        nameTm: 'Şäher merkezi',
        sequenceOrder: 2,
        coordinates: [58.3300, 37.9650],
        isActive: true,
        isMajorStop: false,
        distanceFromStart: 2500,
        travelTimeToNext: 5
      },
      {
        id: '3',
        stopName: 'Чогайлы',
        nameTm: 'Çogaylý',
        sequenceOrder: 3,
        coordinates: [58.3350, 37.9700],
        isActive: true,
        isMajorStop: true,
        distanceFromStart: 5200
      }
    ];

    const currentStops = computed(() => {
      return selectedDirection.value === 0 ? forwardStops.value : reverseStops.value;
    });

    const totalStops = computed(() => {
      return forwardStops.value.length + reverseStops.value.length;
    });

    const activeStopsCount = computed(() => {
      return [...forwardStops.value, ...reverseStops.value].filter(stop => stop.isActive).length;
    });

    const routeStats = computed(() => {
      const stops = currentStops.value;
      if (stops.length === 0) return {};

      const totalDistance = stops[stops.length - 1]?.distanceFromStart || 0;
      const estimatedTime = stops.reduce((sum, stop) => sum + (stop.travelTimeToNext || 0), 0);

      return {
        totalDistance,
        estimatedTime
      };
    });

    onMounted(() => {
      loadRouteStops();
    });

    return {
      loading,
      selectedDirection,
      forwardStops,
      reverseStops,
      currentStops,
      totalStops,
      activeStopsCount,
      routeStats,
      toastSuccess,
      toastError,
      emit,
      mockStops
    };
  },

  methods: {
    close() {
      this.$emit('close');
    },

    async loadRouteStops() {
      if (!this.route?.routeNumber) return;

      this.loading = true;

      try {
        // Load both directions
        const [forward, reverse] = await Promise.all([
          routeAPI.getRouteStops(this.route.routeNumber, 0),
          routeAPI.getRouteStops(this.route.routeNumber, 1)
        ]);

        this.forwardStops = forward.length > 0 ? forward : this.mockStops;
        this.reverseStops = reverse.length > 0 ? reverse : [];

      } catch (error) {
        console.error('Failed to load route stops:', error);
        // Use mock data for demonstration
        this.forwardStops = this.mockStops;
        this.reverseStops = [];
      } finally {
        this.loading = false;
      }
    },

    formatCoordinates(coords) {
      if (!coords || coords.length !== 2) return '';
      return `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`;
    },

    formatDistance(distance) {
      if (!distance) return '0м';

      if (distance < 1000) {
        return `${Math.round(distance)}м`;
      }

      return `${(distance / 1000).toFixed(1)}км`;
    },

    async editStopOrder(stop) {
      // TODO: Implement stop order editing
      this.toastSuccess('Редактирование порядка остановок будет реализовано');
    },

    async removeStopFromRoute(stop) {
      try {
        await routeAPI.removeStopFromRoute(
            this.route.routeNumber,
            stop.id,
            this.selectedDirection
        );

        // Remove from local array
        const stops = this.selectedDirection === 0 ? this.forwardStops : this.reverseStops;
        const index = stops.findIndex(s => s.id === stop.id);
        if (index !== -1) {
          stops.splice(index, 1);
        }

        this.toastSuccess(`Остановка "${stop.stopName}" удалена из маршрута`);
        this.$emit('stops-updated');
      } catch (error) {
        this.toastError('Ошибка удаления остановки из маршрута');
        console.error('Remove stop error:', error);
      }
    },

    addStopToRoute() {
      // TODO: Implement add stop modal
      this.toastSuccess('Добавление остановок будет реализовано');
    },

    reorderStops() {
      // TODO: Implement drag & drop reordering
      this.toastSuccess('Изменение порядка остановок будет реализовано');
    },

    syncWithOtherDirection() {
      const sourceStops = this.selectedDirection === 0 ? this.forwardStops : this.reverseStops;
      const targetStops = this.selectedDirection === 0 ? this.reverseStops : this.forwardStops;

      if (sourceStops.length === 0) {
        this.toastError('Нет остановок для синхронизации');
        return;
      }

      // Reverse order for opposite direction
      const syncedStops = [...sourceStops].reverse().map((stop, index) => ({
        ...stop,
        id: `${stop.id}_reverse`,
        sequenceOrder: index + 1
      }));

      if (this.selectedDirection === 0) {
        this.reverseStops = syncedStops;
      } else {
        this.forwardStops = syncedStops;
      }

      this.toastSuccess('Остановки синхронизированы с обратным направлением');
    },

    async exportStops() {
      try {
        const exportData = {
          routeNumber: this.route.routeNumber,
          routeName: this.route.routeName,
          directions: {
            forward: this.forwardStops,
            reverse: this.reverseStops
          },
          statistics: {
            totalStops: this.totalStops,
            activeStops: this.activeStopsCount,
            exportedAt: new Date().toISOString()
          }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json'
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `route_${this.route.routeNumber}_stops.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.toastSuccess('Данные об остановках экспортированы');
      } catch (error) {
        this.toastError('Ошибка экспорта данных');
        console.error('Export error:', error);
      }
    }
  }
};
</script>

<style scoped>
.route-stops-modal {
  backdrop-filter: blur(2px);
}

/* Direction tabs styling */
button {
  transition: all 0.2s ease;
}

button:hover {
  transform: translateY(-1px);
}

/* Stop item styling */
.stop-item {
  transition: all 0.2s ease;
}

.stop-item:hover {
  transform: translateY(-1px);
}

/* Sequence number styling */
.w-8.h-8 {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Loading animation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Statistics panel styling */
.w-80 {
  min-width: 20rem;
}

/* Responsive design */
@media (max-width: 1024px) {
  .w-80 {
    width: 16rem;
    min-width: 16rem;
  }
}

@media (max-width: 768px) {
  .max-w-5xl {
    max-width: 95vw;
  }

  .flex {
    flex-direction: column;
  }

  .w-80 {
    width: 100%;
    border-left: none;
    border-top: 1px solid var(--color-border);
  }

  .max-h-\[90vh\] {
    max-height: 95vh;
  }
}

/* Scrollbar styling */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-secondary);
}
</style>
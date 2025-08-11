<template>
  <div class="route-stops-selector">
    <div class="direction-tabs mb-4">
      <div class="flex border-b border-k-border">
        <button
            type="button"
            @click="activeDirection = 'forward'"
            :class="[
              'px-4 py-2 font-medium text-sm transition-colors',
              activeDirection === 'forward'
                ? 'border-b-2 border-k-accent text-k-accent'
                : 'text-k-text-secondary hover:text-k-text-primary'
            ]"
        >
          <Icon :icon="['fas', 'arrow-right']" class="mr-2" />
          Прямое направление ({{ forwardStops.length }})
        </button>
        <button
            type="button"
            @click="activeDirection = 'backward'"
            :class="[
              'px-4 py-2 font-medium text-sm transition-colors',
              activeDirection === 'backward'
                ? 'border-b-2 border-k-accent text-k-accent'
                : 'text-k-text-secondary hover:text-k-text-primary'
            ]"
        >
          <Icon :icon="['fas', 'arrow-left']" class="mr-2" />
          Обратное направление ({{ backwardStops.length }})
        </button>
      </div>
    </div>

    <div class="search-section mb-4">
      <div class="relative">
        <TextInput
            v-model="searchQuery"
            placeholder="Поиск остановок..."
            class="pr-10"
        />
        <Icon
            :icon="['fas', 'search']"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-k-text-secondary"
        />
      </div>
    </div>

    <div class="stops-selection-area grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="available-stops-panel">
        <div class="panel-header">
          <h3 class="font-medium text-k-text-primary mb-2">
            Доступные остановки
          </h3>
          <p class="text-sm text-k-text-secondary mb-4">
            Выберите остановки для {{ directionLabel }}
          </p>
        </div>

        <div class="available-stops-list max-h-96 overflow-y-auto border border-k-border rounded-lg">
          <div
              v-for="stop in filteredAvailableStops"
              :key="stop.id"
              @click="addStopToRoute(stop)"
              class="available-stop-item p-3 border-b border-k-border hover:bg-k-bg-secondary cursor-pointer transition-colors"
              :class="{ 'bg-yellow-50 border-l-4 border-l-yellow-400': isStopUsedInOppositeDirection(stop.id) }"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h4 class="font-medium text-k-text-primary">{{ stop.stop_name }}</h4>
                  <Icon
                      v-if="isStopUsedInOppositeDirection(stop.id)"
                      :icon="['fas', 'exchange-alt']"
                      class="text-yellow-500 text-sm"
                      :title="`Используется в ${activeDirection === 'forward' ? 'обратном' : 'прямом'} направлении`"
                  />
                </div>
                <p class="text-sm text-k-text-secondary">{{ stop.name_tm }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    ID: {{ stop.id }}
                  </span>
                  <span v-if="stop.is_major_stop" class="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                    Крупная
                  </span>
                  <span v-if="isStopUsedInOppositeDirection(stop.id)" class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {{ activeDirection === 'forward' ? 'В обратном' : 'В прямом' }}
                  </span>
                </div>
              </div>
              <button
                  type="button"
                  class="add-stop-btn w-8 h-8 bg-k-accent text-white rounded-full flex items-center justify-center hover:bg-opacity-80 transition-all"
              >
                <Icon :icon="['fas', 'plus']" class="text-sm" />
              </button>
            </div>
          </div>

          <div v-if="filteredAvailableStops.length === 0" class="p-6 text-center text-k-text-secondary">
            <Icon :icon="['fas', 'search']" class="text-2xl mb-2" />
            <p>Остановки не найдены</p>
          </div>
        </div>

        <div class="bulk-actions mt-3 flex gap-2">
          <BtnComponent
              @click="addAllFiltereredStops"
              :disabled="filteredAvailableStops.length === 0"
              small
              blue
          >
            <Icon :icon="['fas', 'plus-circle']" class="mr-1" />
            Добавить все
          </BtnComponent>
        </div>
      </div>

      <div class="selected-stops-panel">
        <div class="panel-header">
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-medium text-k-text-primary">
              {{ directionLabel }} ({{ currentStops.length }})
            </h3>
            <div class="direction-indicator">
              <Icon
                  :icon="activeDirection === 'forward' ? ['fas', 'arrow-right'] : ['fas', 'arrow-left']"
                  :class="activeDirection === 'forward' ? 'text-blue-500' : 'text-orange-500'"
              />
            </div>
          </div>
          <p class="text-sm text-k-text-secondary mb-4">
            Перетащите для изменения порядка
          </p>
        </div>

        <div class="selected-stops-list min-h-96 max-h-96 overflow-y-auto border-2 border-dashed border-k-border rounded-lg p-2"
             :class="{ 'border-k-accent bg-k-accent/5': isDragging }"
             @dragover="onDragOver"
             @drop="onDrop">

          <div
              v-for="(stop, index) in currentStops"
              :key="`${stop.id}-${index}`"
              :draggable="true"
              @dragstart="onDragStart($event, index)"
              @dragend="onDragEnd"
              @dragenter="onDragEnter($event, index)"
              class="selected-stop-item bg-k-bg-primary border border-k-border rounded-lg p-3 mb-2 hover:shadow-md transition-all cursor-move"
              :class="{ 'opacity-50': isDragging && draggedIndex === index }"
          >
            <div class="flex items-center gap-3">
              <!-- Drag Handle -->
              <div class="drag-handle text-k-text-secondary hover:text-k-text-primary cursor-grab active:cursor-grabbing">
                <Icon :icon="['fas', 'grip-vertical']" />
              </div>

              <!-- Order Number -->
              <div class="order-number w-8 h-8 bg-k-accent text-white rounded-full flex items-center justify-center text-sm font-bold">
                {{ index + 1 }}
              </div>

              <!-- Stop Info -->
              <div class="flex-1">
                <h4 class="font-medium text-k-text-primary">{{ stop.stop_name }}</h4>
                <p class="text-sm text-k-text-secondary">{{ stop.name_tm }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {{ stop.id }}
                  </span>
                  <span v-if="stop.is_major-stop" class="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                    Крупная остановка
                  </span>
                </div>
              </div>

              <!-- Remove Button -->
              <button
                  type="button"
                  @click="removeStopFromRoute(index)"
                  class="remove-stop-btn w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all"
              >
                <Icon :icon="['fas', 'times']" class="text-sm" />
              </button>
            </div>
          </div>

          <div v-if="currentStops.length === 0" class="empty-state text-center py-12 text-k-text-secondary">
            <Icon :icon="['fas', 'map-marker-alt']" class="text-4xl mb-3" />
            <p class="text-lg font-medium mb-2">Остановки не выбраны</p>
            <p class="text-sm">Выберите остановки из списка слева</p>
          </div>
        </div>

        <div class="selected-actions mt-3 flex gap-2">
          <BtnComponent
              @click="clearCurrentDirection"
              :disabled="currentStops.length === 0"
              small
              danger
          >
            <Icon :icon="['fas', 'trash']" class="mr-1" />
            Очистить все
          </BtnComponent>

          <BtnComponent
              @click="reverseCurrentDirection"
              :disabled="currentStops.length < 2"
              small
              white
          >
            <Icon :icon="['fas', 'exchange-alt']" class="mr-1" />
            Обратить порядок
          </BtnComponent>

          <BtnComponent
              @click="copyToOppositeDirection"
              :disabled="currentStops.length === 0"
              small
              blue
          >
            <Icon :icon="['fas', 'copy']" class="mr-1" />
            Копировать в {{ activeDirection === 'forward' ? 'обратное' : 'прямое' }}
          </BtnComponent>
        </div>
      </div>
    </div>

    <!-- Summary/Validation -->
    <div class="route-summary mt-6 p-4 bg-k-bg-secondary rounded-lg">
      <h4 class="font-medium text-k-text-primary mb-2">Сводка маршрута</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <div class="flex justify-between">
            <span>Прямое направление:</span>
            <span :class="forwardStops.length >= 2 ? 'text-green-600' : 'text-orange-600'">
              {{ forwardStops.length }} остановок
            </span>
          </div>
        </div>
        <div>
          <div class="flex justify-between">
            <span>Обратное направление:</span>
            <span :class="backwardStops.length >= 2 ? 'text-green-600' : 'text-orange-600'">
              {{ backwardStops.length }} остановок
            </span>
          </div>
        </div>
        <div class="md:col-span-2">
          <div class="flex justify-between border-t border-k-border pt-2">
            <span class="flex items-center gap-2">
              <Icon :icon="['fas', 'exchange-alt']" class="text-yellow-500" />
              Общие остановки:
            </span>
            <span class="text-yellow-600 font-medium">
              {{ sharedStopsCount }}
            </span>
          </div>
          <div v-if="sharedStopsCount > 0" class="mt-2 text-xs text-k-text-secondary">
            {{ sharedStops.map(s => s.stop_name).join(', ') }}
          </div>
        </div>
      </div>

      <div v-if="validationErrors.length > 0" class="validation-errors mt-3">
        <div v-for="error in validationErrors" :key="error" class="text-red-600 text-sm flex items-center gap-2">
          <Icon :icon="['fas', 'exclamation-triangle']" />
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { useMessageToaster } from '@/composables';

import TextInput from '../Ui/Form/TextInput.vue';
import BtnComponent from '../Ui/Form/BtnComponent.vue';

export default {
  name: 'RouteStopsSelector',

  components: {
    TextInput,
    BtnComponent
  },

  props: {
    availableStops: {
      type: Array,
      default: () => []
    },
    forwardStops: {
      type: Array,
      default: () => []
    },
    backwardStops: {
      type: Array,
      default: () => []
    }
  },

  emits: ['update:forwardStops', 'update:backwardStops', 'validation-changed'],

  setup(props, { emit }) {
    const { toastSuccess } = useMessageToaster();

    const activeDirection = ref('forward');
    const searchQuery = ref('');
    const isDragging = ref(false);
    const draggedIndex = ref(null);
    const dragOverIndex = ref(null);


    const forwardStops = ref([...props.forwardStops]);
    const backwardStops = ref([...props.backwardStops]);

    watch(() => props.forwardStops, (newStops) => {
      forwardStops.value = [...(newStops || [])];
    }, { immediate: true, deep: true });

    watch(() => props.backwardStops, (newStops) => {
      backwardStops.value = [...(newStops || [])];
    }, { immediate: true, deep: true });


    console.log('selector forward', forwardStops)


    const directionLabel = computed(() => {
      return activeDirection.value === 'forward' ? 'Прямое направление' : 'Обратное направление';
    });

    const currentStops = computed({
      get() {
        return activeDirection.value === 'forward' ? forwardStops.value : backwardStops.value;
      },
      set(value) {
        if (activeDirection.value === 'forward') {
          forwardStops.value = value;
          emit('update:forwardStops', value);
        } else {
          backwardStops.value = value;
          emit('update:backwardStops', value);
        }
      }
    });

    const selectedStopIds = computed(() => {


      const currentDirectionStops = activeDirection.value === 'forward'
          ? forwardStops.value.map(s => s.id)
          : backwardStops.value.map(s => s.id);

      return new Set(currentDirectionStops);
    });

    const filteredAvailableStops = computed(() => {
      let filtered = props.availableStops.filter(stop =>
          !selectedStopIds.value.has(stop.id)
      );

      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(stop =>
            stop.stop_name.toLowerCase().includes(query) ||
            stop.name_tm?.toLowerCase().includes(query) ||
            stop.id.toLowerCase().includes(query)
        );
      }

      return filtered;
    });


    const isStopUsedInOppositeDirection = (stopId) => {
      const oppositeStops = activeDirection.value === 'forward'
          ? backwardStops.value
          : forwardStops.value;
      return oppositeStops.some(stop => stop.id === stopId);
    };

    const validationErrors = computed(() => {
      const errors = [];

      if (forwardStops.value.length < 2) {
        errors.push('Прямое направление должно содержать минимум 2 остановки');
      }

      if (backwardStops.value.length < 2) {
        errors.push('Обратное направление должно содержать минимум 2 остановки');
      }

      return errors;
    });

    const isValid = computed(() => validationErrors.value.length === 0);


    const sharedStops = computed(() => {
      const forwardStopIds = new Set(forwardStops.value.map(s => s.id));
      const backwardStopIds = new Set(backwardStops.value.map(s => s.id));

      return forwardStops.value.filter(stop => backwardStopIds.has(stop.id));
    });

    const sharedStopsCount = computed(() => sharedStops.value.length);


    const onDragStart = (event, index) => {
      isDragging.value = true;
      draggedIndex.value = index;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', index);
    };

    const onDragEnd = () => {
      isDragging.value = false;
      draggedIndex.value = null;
      dragOverIndex.value = null;
    };

    const onDragOver = (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    };

    const onDragEnter = (event, index) => {
      event.preventDefault();
      dragOverIndex.value = index;
    };

    const onDrop = (event) => {
      event.preventDefault();

      const fromIndex = draggedIndex.value;
      const toIndex = dragOverIndex.value;

      if (fromIndex !== null && toIndex !== null && fromIndex !== toIndex) {
        const newStops = [...currentStops.value];
        const draggedStop = newStops.splice(fromIndex, 1)[0];
        newStops.splice(toIndex, 0, draggedStop);

        currentStops.value = newStops;
        toastSuccess('Порядок остановок изменен');
      }

      onDragEnd();
    };


    const addStopToRoute = (stop) => {

      const currentDirectionStops = activeDirection.value === 'forward' ? forwardStops.value : backwardStops.value;


      if (currentDirectionStops.some(s => s.id === stop.id)) {
        toastError(`Остановка "${stop.stop_name}" уже добавлена в ${directionLabel.value.toLowerCase()}`);
        return;
      }

      if (activeDirection.value === 'forward') {
        forwardStops.value.push(stop);
        emit('update:forwardStops', forwardStops.value);
      } else {
        backwardStops.value.push(stop);
        emit('update:backwardStops', backwardStops.value);
      }

      toastSuccess(`Остановка "${stop.stop_name}" добавлена в ${directionLabel.value.toLowerCase()}`);
    };

    const removeStopFromRoute = (index) => {
      if (activeDirection.value === 'forward') {
        const removed = forwardStops.value.splice(index, 1)[0];
        emit('update:forwardStops', forwardStops.value);
        toastSuccess(`Остановка "${removed.stopName}" удалена`);
      } else {
        const removed = backwardStops.value.splice(index, 1)[0];
        emit('update:backwardStops', backwardStops.value);
        toastSuccess(`Остановка "${removed.stopName}" удалена`);
      }
    };

    const addAllFiltereredStops = () => {
      const currentDirectionStops = activeDirection.value === 'forward' ? forwardStops.value : backwardStops.value;
      const currentDirectionStopIds = new Set(currentDirectionStops.map(s => s.id));


      const stopsToAdd = filteredAvailableStops.value.filter(stop =>
          !currentDirectionStopIds.has(stop.id)
      ).slice(0, 20);

      if (stopsToAdd.length === 0) {
        toastError('Нет доступных остановок для добавления');
        return;
      }

      if (activeDirection.value === 'forward') {
        forwardStops.value.push(...stopsToAdd);
        emit('update:forwardStops', forwardStops.value);
      } else {
        backwardStops.value.push(...stopsToAdd);
        emit('update:backwardStops', backwardStops.value);
      }

      toastSuccess(`Добавлено ${stopsToAdd.length} остановок в ${directionLabel.value.toLowerCase()}`);
    };

    const clearCurrentDirection = () => {
      if (activeDirection.value === 'forward') {
        forwardStops.value = [];
        emit('update:forwardStops', forwardStops.value);
      } else {
        backwardStops.value = [];
        emit('update:backwardStops', backwardStops.value);
      }

      toastSuccess(`${directionLabel.value} очищено`);
    };

    const reverseCurrentDirection = () => {
      if (activeDirection.value === 'forward') {
        forwardStops.value.reverse();
        emit('update:forwardStops', forwardStops.value);
      } else {
        backwardStops.value.reverse();
        emit('update:backwardStops', backwardStops.value);
      }

      toastSuccess(`Порядок остановок в ${directionLabel.value.toLowerCase()} обращен`);
    };

    const copyToOppositeDirection = () => {
      const sourceStops = [...currentStops.value];
      const reversedStops = [...sourceStops].reverse();

      if (activeDirection.value === 'forward') {
        backwardStops.value = reversedStops;
        emit('update:backwardStops', backwardStops.value);
        toastSuccess('Остановки скопированы в обратное направление');
      } else {
        forwardStops.value = reversedStops;
        emit('update:forwardStops', forwardStops.value);
        toastSuccess('Остановки скопированы в прямое направление');
      }
    };


    watch(isValid, (newValue) => {
      emit('validation-changed', newValue);
    }, { immediate: true });

    return {
      activeDirection,
      searchQuery,
      isDragging,
      draggedIndex,
      forwardStops,
      backwardStops,
      directionLabel,
      currentStops,
      filteredAvailableStops,
      validationErrors,
      isValid,
      onDragStart,
      onDragEnd,
      onDragOver,
      onDragEnter,
      onDrop,
      addStopToRoute,
      removeStopFromRoute,
      isStopUsedInOppositeDirection,
      addAllFiltereredStops,
      sharedStops,
      sharedStopsCount,
      clearCurrentDirection,
      reverseCurrentDirection,
      copyToOppositeDirection
    };
  }
};
</script>

<style scoped>

.selected-stop-item {
  transition: all 0.2s ease;
}

.selected-stop-item:hover {
  transform: translateY(-1px);
}

.available-stop-item:hover {
  transform: translateX(4px);
}

.add-stop-btn:hover,
.remove-stop-btn:hover {
  transform: scale(1.1);
}

/* Responsive */
@media (max-width: 1024px) {
  .stops-selection-area {
    grid-template-columns: 1fr;
  }

  .selected-stops-list,
  .available-stops-list {
    max-height: 300px;
  }
}
</style>
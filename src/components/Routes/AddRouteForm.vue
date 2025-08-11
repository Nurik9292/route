<template>
  <form @submit.prevent="submit" class="route-form bg-k-bg-primary">
    <!-- Modal Header -->
    <header class="p-6 border-b border-k-border">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold text-k-text-primary">
          Добавить маршрут
        </h2>
        <BtnComponent @click="close" white small>
          <Icon :icon="['fa', 'times']" />
        </BtnComponent>
      </div>
    </header>

    <div class="modal-body space-y-6 p-6 max-h-[70vh] overflow-y-auto">
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-k-text-primary border-b border-k-border pb-2">
          Основная информация
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormRow label="Номер маршрута" required>
            <TextInput
                v-model="newRoute.routeNumber"
                placeholder="Например: 29"
                :error="errors.routeNumber"
                @blur="validateRouteNumber"
                required
            />
            <template #hint>
              <span v-if="routeNumberChecking" class="text-xs text-k-text-secondary">
                <Icon :icon="['fas', 'spinner']" class="animate-spin mr-1" />
                Проверка доступности...
              </span>
              <span v-else-if="routeNumberAvailable === false" class="text-xs text-red-500">
                Номер уже занят
              </span>
              <span v-else-if="routeNumberAvailable === true" class="text-xs text-green-600">
                Номер доступен
              </span>
            </template>
          </FormRow>

          <FormRow label="Тип маршрута">
            <SelectBox
                v-model="newRoute.cityId"
                :options="cityFilterOptions"
                placeholder="Выберите тип"
            />
          </FormRow>
        </div>

        <FormRow label="Название маршрута" required>
          <TextInput
              v-model="newRoute.routeName"
              placeholder="Например: Ак кайым - Чогайлы"
              :error="errors.routeName"
              required
          />
        </FormRow>

        <!-- Мультиязычные названия -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormRow label="Название (туркм.)">
            <TextInput
                v-model="newRoute.nameTm"
                placeholder="Туркменское название"
            />
          </FormRow>

          <FormRow label="Название (англ.)">
            <TextInput
                v-model="newRoute.nameEn"
                placeholder="English name"
            />
          </FormRow>
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-lg font-medium text-k-text-primary border-b border-k-border pb-2">
          Параметры движения
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormRow label="Цвет на карте">
            <div class="flex items-center gap-3">
              <input
                  type="color"
                  v-model="newRoute.color"
                  class="w-12 h-10 border border-k-border rounded cursor-pointer"
              />
              <TextInput
                  v-model="newRoute.color"
                  placeholder="#3B82F6"
                  class="flex-1"
              />
            </div>
          </FormRow>

          <FormRow label="Интервал (мин)" required>
            <TextInput
                v-model="newRoute.frequency"
                type="number"
                placeholder="Интервал 15"
                min="1"
                max="120"
                :error="errors.frequency"
                required
            />
          </FormRow>


        </div>
      </div>


      <div class="space-y-4">
        <h3 class="text-lg font-medium text-k-text-primary border-b border-k-border pb-2">
          Геометрия маршрута
        </h3>

        <div class="bg-k-bg-secondary p-4 rounded-lg">
          <div class="flex justify-between items-start mb-4">
            <div>
              <p class="text-sm text-k-text-primary font-medium mb-1">
                Нарисовать маршруты на карте
              </p>
              <p class="text-xs text-k-text-secondary">
                Укажите пути движения автобусов для прямого и обратного направлений
              </p>
            </div>
            <BtnComponent
                @click="showRouteDrawing"
                :disabled="!newRoute.routeNumber || routeNumberAvailable === false"
                blue
                small
            >
              <Icon :icon="['fas', 'map']" class="mr-2" />
              {{ hasGeometry ? 'Редактировать' : 'Нарисовать' }}
            </BtnComponent>
          </div>

          <!-- Статус геометрии -->
          <div v-if="hasGeometry" class="space-y-3">
            <!-- Прямое направление -->
            <div class="bg-k-bg-primary p-3 rounded border">
              <div class="flex justify-between items-center">
                <div class="text-sm">
                  <p class="text-k-text-primary font-medium flex items-center">
                    <Icon :icon="['fas', 'arrow-right']" class="text-blue-500 mr-2" />
                    Прямое направление
                    <Icon v-if="routeForwardGeometry.length >= 2" :icon="['fas', 'check-circle']" class="text-green-500 ml-2" />
                  </p>
                  <p class="text-k-text-secondary">
                    {{ routeForwardGeometry.length >= 2 ?
                      `Точек: ${routeForwardGeometry.length} | Длина: ~${calculateGeometryDistance(routeForwardGeometry)} км` :
                      'Не настроено'
                    }}
                  </p>
                </div>
              </div>
            </div>

            <div class="bg-k-bg-primary p-3 rounded border">
              <div class="flex justify-between items-center">
                <div class="text-sm">
                  <p class="text-k-text-primary font-medium flex items-center">
                    <Icon :icon="['fas', 'arrow-left']" class="text-orange-500 mr-2" />
                    Обратное направление
                    <Icon v-if="routeBackwardGeometry.length >= 2" :icon="['fas', 'check-circle']" class="text-green-500 ml-2" />
                  </p>
                  <p class="text-k-text-secondary">
                    {{ routeBackwardGeometry.length >= 2 ?
                      `Точек: ${routeBackwardGeometry.length} | Длина: ~${calculateGeometryDistance(routeBackwardGeometry)} км` :
                      'Не настроено'
                    }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Общая статистика -->
            <div class="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div class="flex justify-between items-center">
                <div class="text-sm">
                  <p class="text-blue-800 font-medium">
                    <Icon :icon="['fas', 'info-circle']" class="mr-1" />
                    Общая статистика
                  </p>
                  <p class="text-blue-700 text-xs">
                    Общая длина: {{ formatRouteDistance() }}
                  </p>
                </div>
                <div class="flex gap-2">
                  <BtnComponent @click="showRouteDrawing" small white>
                    <Icon :icon="['fas', 'edit']" class="mr-1" />
                    Изменить
                  </BtnComponent>
                  <BtnComponent @click="clearRouteGeometry" small danger>
                    <Icon :icon="['fas', 'trash']" class="mr-1" />
                    Удалить
                  </BtnComponent>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else class="text-center py-8 border-2 border-dashed border-k-border rounded-lg">
            <Icon :icon="['fas', 'location-dot']" class="text-3xl text-k-text-secondary mb-2" />
            <p class="text-k-text-secondary text-sm">
              Маршруты не нарисованы
            </p>
            <p class="text-xs text-k-text-secondary mt-1">
              Нажмите "Нарисовать" для создания геометрии прямого и обратного направлений
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <h3 class="text-lg font-medium text-k-text-primary border-b border-k-border pb-2">
          Остановки маршрута
        </h3>

        <RouteStopsSelector
            :available-stops="availableStops"
            v-model:forward-stops="newRoute.forwardStops"
            v-model:backward-stops="newRoute.backwardStops"
            @validation-changed="onStopsValidationChanged"
        />
      </div>

      <!-- Статус -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-k-text-primary border-b border-k-border pb-2">
          Статус и настройки
        </h3>

        <div class="flex items-center gap-6">
          <CheckBox
              v-model="newRoute.isActive"
              label="Активный маршрут"
          />

          <div class="text-xs text-k-text-secondary">
            <Icon :icon="['fas', 'info-circle']" class="mr-1" />
            Активные маршруты отображаются пользователям
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Footer -->
    <footer class="p-6 border-t border-k-border bg-k-bg-secondary flex justify-between items-center">
      <div class="text-sm text-k-text-secondary">
        <span v-if="hasChanges">
          <Icon :icon="['fas', 'info-circle']" class="text-orange-400 text-xs mr-1" />
          Есть несохраненные изменения
        </span>
      </div>

      <div class="flex gap-3">
        <BtnComponent
            white
            @click.prevent="maybeClose"
            :disabled="isSubmitting"
        >
          Отмена
        </BtnComponent>
        <BtnComponent
            type="submit"
            success
            :disabled="!isFormValid || isSubmitting"
            :loading="isSubmitting"
        >
          <Icon :icon="['fas', 'plus']" class="mr-2" />
          Создать маршрут
        </BtnComponent>
      </div>
    </footer>

    <RouteGeometryModal
        v-if="showDrawingModal"
        :route="newRoute"
        :existing-forward-geometry="routeForwardGeometry"
        :existing-backward-geometry="routeBackwardGeometry"
        @close="showDrawingModal = false"
        @geometry-updated="onGeometryUpdated"
    />
  </form>
</template>

<script>
import { reactive, computed, ref, watch } from 'vue';
import {mapActions, mapGetters} from 'vuex';
import { useModal, useMessageToaster, useOverlay, useErrorHandler, useDialogBox } from '@/composables';
import { debounce } from 'lodash';
import routeAPI from '@/api/routeAPI';

import FormRow from '../Ui/Form/FormRow.vue';
import TextInput from '../Ui/Form/TextInput.vue';
import SelectBox from '../Ui/Form/SelectBox.vue';
import CheckBox from '../Ui/Form/CheckBox.vue';
import BtnComponent from '../Ui/Form/BtnComponent.vue';
import RouteGeometryModal from './RouteGeometryModal.vue';
import RouteStopsSelector from "./RouteStopsSelector.vue";
import {eventBus} from "@/utils/index.js";

export default {
  name: 'AddRouteForm',

  components: {
    FormRow,
    TextInput,
    SelectBox,
    CheckBox,
    BtnComponent,
    RouteGeometryModal,
    RouteStopsSelector
  },

  setup() {
    const { toastSuccess, toastError } = useMessageToaster();
    const { showOverlay, hideOverlay } = useOverlay();
    const { showConfirmDialog } = useDialogBox();
    const errorHandler = useErrorHandler('dialog');

    const newRoute = reactive({
      routeNumber: '',
      routeName: '',
      nameTm: '',
      nameEn: '',
      color: '#3B82F6',
      frequency: '',
      isActive: true,
      cityId: '',
      forwardStops: [],
      backwardStops: []
    });

    const errors = ref({});
    const isSubmitting = ref(false);
    const showDrawingModal = ref(false);
    const routeForwardGeometry = ref([]);
    const routeBackwardGeometry = ref([]);
    const routeNumberChecking = ref(false);
    const routeNumberAvailable = ref(null);
    const stopsValid = ref(false);

    return {
      newRoute,
      errors,
      isSubmitting,
      showDrawingModal,
      routeForwardGeometry,
      routeBackwardGeometry,
      routeNumberChecking,
      routeNumberAvailable,
      toastSuccess,
      showOverlay,
      hideOverlay,
      showConfirmDialog,
      errorHandler,
      stopsValid,
      toastError
    };
  },

  computed: {
    ...mapGetters('cities', ['getCities']),

    ...mapGetters('stops', ['getStops']),

    availableStops() {
      return this.getStops || []
    },


    cities() {
      return this.getCities || [];
    },


    hasChanges () {
      return this.newRoute.routeNumber ||
          this.newRoute.routeName ||
          this.routeForwardGeometry.length > 0 ||
          this.routeBackwardGeometry.length > 0 ||
          this.newRoute.nameTm ||
          this.newRoute.nameEn ||
          this.newRoute.forwardStops.length > 0 ||
          this.newRoute.backwardStops.length > 0;
    },


    isFormValid ()  {
      return this.newRoute.routeNumber?.trim() &&
          this.newRoute.routeName?.trim() &&
          this.newRoute.frequency > 0 &&
          this.stopsValid &&
          this.routeNumberAvailable !== false &&
          !Object.keys(this.errors).length;
    },

    hasGeometry()  {
      return this.routeForwardGeometry.length >= 2 || this.routeBackwardGeometry.length >= 2;
    },

    hasCompleteGeometry () {
      return this.routeForwardGeometry.length >= 2 && this.routeBackwardGeometry.length >= 2;
    },

    cityFilterOptions() {
      const options = [
        { value: null, label: 'Все города' }
      ];

      this.cities.forEach(city => {
        options.push({
          value: city.id,
          label: city.name
        });
      });

      return options;
    },
  },

  mounted() {
    this.fetchAll({
      page: 1,
      size: 1500,
      sort: 'route_number',
      order: 'asc',
      active: true,
    })
  },

  watch: {
    'newRoute.routeNumber'(newVal) {
      this.routeNumberAvailable = null;
      delete this.errors.routeNumber;

      if (newVal && newVal.trim()) {
        this.debouncedValidateRouteNumber(newVal.trim());
      }
    }
  },

  methods: {
    ...mapActions('routes', ['store']),
    ...mapActions('stops', ['fetchAll']),


    onStopsValidationChanged (isValid){
      this.stopsValid = isValid;
    },

    debouncedValidateRouteNumber: debounce(async function (routeNumber) {
      if (!routeNumber || !routeNumber.trim()) {
        this.routeNumberAvailable = null;
        return;
      }

      this.routeNumberChecking = true;
      try {
        const available = await routeAPI.checkRouteNumberAvailability(routeNumber);
        this.routeNumberAvailable = available;

        if (!available) {
          this.errors.routeNumber = 'Номер маршрута уже используется';
        } else {
          delete this.errors.routeNumber;
        }
      } catch (error) {
        console.error('Route number validation error:', error);
        this.routeNumberAvailable = null;
      } finally {
        this.routeNumberChecking = false;
      }
    }, 500),


    validateRouteNumber() {
      if (this.newRoute.routeNumber?.trim()) {
        this.debouncedValidateRouteNumber(this.newRoute.routeNumber.trim());
      }
    },

    showRouteDrawing() {
      console.log('tet test teste te')
      this.showDrawingModal = true;
    },

    editRouteGeometry() {
      this.showDrawingModal = true;
    },

    clearRouteGeometry() {
      this.routeForwardGeometry = [];
      this.routeBackwardGeometry = [];
      this.toastSuccess('Геометрия маршрута удалена');
    },

    onGeometryUpdated(geometryData) {
      if (geometryData.forward_geometry) {
        this.routeForwardGeometry = geometryData.forward_geometry;
      }
      if (geometryData.backward_geometry) {
        this.routeBackwardGeometry = geometryData.backward_geometry;
      }

      this.showDrawingModal = false;

      const totalPoints = (geometryData.forward_geometry?.length || 0) + (geometryData.backward_geometry?.length || 0);
      this. toastSuccess(`Геометрия маршрута обновлена: ${totalPoints} точек`);
    },

    formatRouteDistance () {
      const forwardDistance = this.calculateGeometryDistance(this.routeForwardGeometry);
      const backwardDistance = this.calculateGeometryDistance(this.routeBackwardGeometry);

      if (forwardDistance > 0 && backwardDistance > 0) {
        return `${forwardDistance} км / ${backwardDistance} км`;
      } else if (forwardDistance > 0) {
        return `${forwardDistance} км (только прямое)`;
      } else if (backwardDistance > 0) {
        return `${backwardDistance} км (только обратное)`;
      }
      return '0 км';
    },


    calculateGeometryDistance (geometry)  {
      if (!geometry || geometry.length < 2) return 0;

      let totalDistance = 0;
      for (let i = 1; i < geometry.length; i++) {
        const prev = geometry[i - 1];
        const curr = geometry[i];
        totalDistance += this.calculateDistance(prev[0], prev[1], curr[0], curr[1]);
      }

      return totalDistance.toFixed(1);
    },

    calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = this.toRadians(lat2 - lat1);
      const dLon = this.toRadians(lon2 - lon1);

      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },

    toRadians(degrees) {
      return degrees * (Math.PI / 180);
    },

    validateForm() {
      const newErrors = {};

      if (!this.newRoute.routeNumber?.trim()) {
        newErrors.routeNumber = 'Номер маршрута обязателен';
      } else if (this.routeNumberAvailable === false) {
        newErrors.routeNumber = 'Номер маршрута уже используется';
      }

      if (!this.newRoute.routeName?.trim()) {
        newErrors.routeName = 'Название маршрута обязательно';
      }

      if (!this.newRoute.frequency || this.newRoute.frequency < 1) {
        newErrors.frequency = 'Интервал должен быть больше 0';
      } else if (this.newRoute.frequency > 120) {
        newErrors.frequency = 'Интервал не может быть больше 120 минут';
      }

      this.errors = newErrors;
      return Object.keys(newErrors).length === 0;
    },

    async submit() {
      if (!this.validateForm() || this.isSubmitting) return;

      if (this.routeNumberAvailable !== true) {
        this.toastError('Номер маршрута недоступен');
        return;
      }

      if (!this.stopsValid) {
        this.toastError('Необходимо настроить остановки маршрута');
        return;
      }

      if (!this.hasGeometry) {
        const confirmed = await this.showConfirmDialog(
            'Создать маршрут без геометрии?',
            'Геометрия может быть добавлена позже через редактирование'
        );
        if (!confirmed) return;
      }


      this.isSubmitting = true;
      this.showOverlay();

      try {
        const routeData = {
          route_number: this.newRoute.routeNumber.trim(),
          route_name: this.newRoute.routeName.trim(),
          name_tm: this.newRoute.nameTm?.trim() || null,
          name_en: this.newRoute.nameEn?.trim() || null,
          route_color: this.newRoute.color,
          estimated_duration_minutes: parseInt(this.newRoute.frequency),
          is_active: this.newRoute.isActive,
          city_id: this.newRoute.cityId,
          forward_stops: this.newRoute.forwardStops.map(stop => stop.id),
          backward_stops: this.newRoute.backwardStops.map(stop => stop.id),
          forward_geometry: this.routeForwardGeometry,
          backward_geometry: this.routeBackwardGeometry
        };

        console.log('created route bus', routeData);

        await this.store(routeData);

        const geometryInfo = this.hasCompleteGeometry ?
            'с геометрией обоих направлений' :
            this.hasGeometry ? 'с частичной геометрией' : 'без геометрии';

        eventBus.emit('route:created', this.newRoute);

        this.toastSuccess(`Маршрут "${routeData.route_number}" успешно создан ${geometryInfo}`);

        this.close();
      } catch (error) {
        this.errorHandler.handleHttpError(error);
      } finally {
        this.hideOverlay();
        this.isSubmitting = false;
      }
    },

    async maybeClose() {
      if (!this.hasChanges) {
        this.close();
        return;
      }

      const confirmed = await this.showConfirmDialog(
          'Отменить создание маршрута?'
      );

      if (confirmed) {
        this.close();
      }
    },

    close() {
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
.route-form {
  min-width: 600px;
  max-width: 800px;
  width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
}

/* Custom color input styling */
input[type="color"] {
  -webkit-appearance: none;
  border: none;
  cursor: pointer;
}

input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type="color"]::-webkit-color-swatch {
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .route-form {
    min-width: 95vw;
    max-height: 95vh;
  }

  .grid.grid-cols-1.md\:grid-cols-2 {
    grid-template-columns: 1fr;
  }

  .grid.grid-cols-1.md\:grid-cols-3 {
    grid-template-columns: 1fr;
  }
}

/* Animation for validation states */
.text-red-500, .text-green-600 {
  transition: all 0.2s ease;
}

/* Loading spinner animation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
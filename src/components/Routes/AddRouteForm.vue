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


      <!-- Route Drawing Section -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-k-text-primary border-b border-k-border pb-2">
          Геометрия маршрута
        </h3>

        <div class="bg-k-bg-secondary p-4 rounded-lg">
          <div class="flex justify-between items-start mb-4">
            <div>
              <p class="text-sm text-k-text-primary font-medium mb-1">
                Нарисовать маршрут на карте
              </p>
              <p class="text-xs text-k-text-secondary">
                Укажите путь движения автобусов по дорогам
              </p>
            </div>
            <BtnComponent
                @click="showRouteDrawing"
                :disabled="!newRoute.routeNumber || routeNumberAvailable === false"
                blue
                small
            >
              <Icon :icon="['fas', 'map']" class="mr-2" />
              {{ routeGeometry ? 'Редактировать' : 'Нарисовать' }}
            </BtnComponent>
          </div>

          <div v-if="routeGeometry" class="bg-k-bg-primary p-3 rounded border">
            <div class="flex justify-between items-center">
              <div class="text-sm">
                <p class="text-k-text-primary font-medium">
                  <Icon :icon="['fas', 'check-circle']" class="text-green-500 mr-1" />
                  Маршрут нарисован
                </p>
                <p class="text-k-text-secondary">
                  Точек: {{ routeGeometry.coordinates?.length || 0 }} |
                  Длина: ~{{ formatRouteDistance() }} км
                </p>
              </div>
              <div class="flex gap-2">
                <BtnComponent @click="editRouteGeometry" small white>
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

          <div v-else class="text-center py-8 border-2 border-dashed border-k-border rounded-lg">
            <Icon :icon="['fas', 'location-dot']" class="text-3xl text-k-text-secondary mb-2" />
            <p class="text-k-text-secondary text-sm">
              Маршрут не нарисован
            </p>
            <p class="text-xs text-k-text-secondary mt-1">
              Нажмите "Нарисовать" для создания геометрии
            </p>
          </div>
        </div>
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

    <!-- Route Drawing Modal -->
    <RouteGeometryModal
        v-if="showDrawingModal"
        :route="newRoute"
        :existing-geometry="routeGeometry"
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

export default {
  name: 'AddRouteForm',

  components: {
    FormRow,
    TextInput,
    SelectBox,
    CheckBox,
    BtnComponent,
    RouteGeometryModal
  },

  setup() {
    const { toastSuccess } = useMessageToaster();
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
    });

    const errors = ref({});
    const isSubmitting = ref(false);
    const showDrawingModal = ref(false);
    const routeGeometry = ref(null);
    const routeNumberChecking = ref(false);
    const routeNumberAvailable = ref(null);


    const isFormValid = computed(() => {
      return newRoute.routeNumber?.trim() &&
          newRoute.routeName?.trim() &&
          newRoute.frequency > 0 &&
          routeNumberAvailable.value !== false &&
          !Object.keys(errors.value).length;
    });

    const hasChanges = computed(() => {
      return newRoute.routeNumber ||
          newRoute.routeName ||
          newRoute.nameTm ||
          newRoute.nameEn ||
          routeGeometry.value;
    });

    const debouncedValidateRouteNumber = debounce(async (routeNumber) => {
      if (!routeNumber?.trim()) {
        routeNumberAvailable.value = null;
        return;
      }

      routeNumberChecking.value = true;
      try {
        const available = await routeAPI.checkRouteNumberAvailability(routeNumber);
        routeNumberAvailable.value = available;

        if (!available) {
          errors.value.routeNumber = 'Номер маршрута уже используется';
        } else {
          delete errors.value.routeNumber;
        }
      } catch (error) {
        console.error('Route number validation error:', error);
        routeNumberAvailable.value = null;
      } finally {
        routeNumberChecking.value = false;
      }
    }, 500);

    watch(() => newRoute.routeNumber, (newVal) => {
      routeNumberAvailable.value = null;
      delete errors.value.routeNumber;

      if (newVal?.trim()) {
        debouncedValidateRouteNumber(newVal.trim());
      }
    });

    return {
      newRoute,
      errors,
      isSubmitting,
      showDrawingModal,
      routeGeometry,
      routeNumberChecking,
      routeNumberAvailable,
      isFormValid,
      hasChanges,
      toastSuccess,
      showOverlay,
      hideOverlay,
      showConfirmDialog,
      errorHandler,
      debouncedValidateRouteNumber
    };
  },



  computed: {
    ...mapGetters('cities', ['getCities']),


    cities() {
      return this.getCities || [];
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

  methods: {
    ...mapActions('routes', ['store']),

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
      this.routeGeometry = null;
      this.toastSuccess('Геометрия маршрута удалена');
    },

    onGeometryUpdated(geometry) {
      this.routeGeometry = geometry;
      this.showDrawingModal = false;
      this.toastSuccess('Геометрия маршрута обновлена');
    },

    formatRouteDistance() {
      if (!this.routeGeometry?.coordinates?.length) return '0';

      let totalDistance = 0;
      const coords = this.routeGeometry.coordinates;

      for (let i = 1; i < coords.length; i++) {
        const prev = coords[i - 1];
        const curr = coords[i];
        totalDistance += this.calculateDistance(prev[1], prev[0], curr[1], curr[0]);
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

      this.isSubmitting = true;
      this.showOverlay();

      try {
        const routeData = {
          route_number: this.newRoute.routeNumber.trim(),
          route_name: this.newRoute.routeName.trim(),
          name_tm: this.newRoute.nameTm?.trim() || null,
          name_en: this.newRoute.nameEn?.trim() || null,
          color: this.newRoute.color,
          frequency_minutes: parseInt(this.newRoute.frequency),
          is_active: this.newRoute.isActive,
          geometry: this.routeGeometry,
          city_id: this.newRoute.cityId
        };

        const createdRoute = await this.store(routeData);

        if (this.routeGeometry && createdRoute.routeNumber) {
          try {
            await routeAPI.updateRouteGeometry(createdRoute.routeNumber, {
              geometry: this.routeGeometry
            });
          } catch (geometryError) {
            console.warn('Failed to save route geometry:', geometryError);
          }
        }

        this.toastSuccess(`Маршрут "${routeData.route_number}" успешно создан`);
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
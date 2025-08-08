<template>
  <form @submit.prevent="submit" class="stop-form">
    <header class="form-header">
      <h1 class="form-title">Редактировать остановку</h1>
      <p class="form-subtitle">{{ stop.stop_name }}</p>
    </header>

    <main class="form-content">
      <FormRow>
        <template #label>Название остановки <span class="required">*</span></template>
        <TextInput
            v-model="updateData.stopName"
            v-focus
            name="stopName"
            placeholder="Введите название остановки"
            required
            maxlength="100"
            class="dark-input"
        />
      </FormRow>

      <FormRow>
        <template #label>Название (туркменский)</template>
        <TextInput
            v-model="updateData.nameTm"
            name="stopNameTm"
            placeholder="Введите название на туркменском"
            maxlength="100"
            class="dark-input"
        />
      </FormRow>

      <FormRow>
        <template #label>Название (английский)</template>
        <TextInput
            v-model="updateData.nameEn"
            name="stopNameEn"
            placeholder="Enter English name"
            maxlength="100"
            class="dark-input"
        />
      </FormRow>

      <FormRow>
        <template #label>Город</template>
        <SelectBox
            v-model="updateData.cityId"
            name="cityId"
            placeholder="Выберите город"
            :options="cityOptions"
            value-key="id"
            label-key="name"
            class="dark-select"
        />
        <template #help>Выберите город, где находится остановка</template>
      </FormRow>

      <FormRow>
        <template #label>Порядок отображения</template>
        <TextInput
            v-model.number="updateData.displayOrder"
            name="displayOrder"
            type="number"
            placeholder="0"
            min="0"
            max="999"
            class="dark-input"
        />
        <template #help>Чем меньше число, тем выше в списке</template>
      </FormRow>

      <FormRow>
        <template #label>Координаты <span class="required">*</span></template>
        <div class="coordinates-grid">
          <div class="coordinate-field">
            <TextInput
                v-model.number="updateData.latitude"
                name="latitude"
                type="number"
                step="0.000001"
                min="35"
                max="43"
                placeholder="37.9601"
                required
                class="dark-input"
                @input="onCoordinateInputChange"
            />
            <p class="coordinate-label">Широта (Latitude)</p>
          </div>
          <div class="coordinate-field">
            <TextInput
                v-model.number="updateData.longitude"
                name="longitude"
                type="number"
                step="0.000001"
                min="52"
                max="67"
                placeholder="58.3261"
                required
                class="dark-input"
                @input="onCoordinateInputChange"
            />
            <p class="coordinate-label">Долгота (Longitude)</p>
          </div>
        </div>
        <template #help>
          Координаты остановки в формате десятичных градусов.
          <button type="button" @click="toggleMapHelper" class="map-link">
            {{ showMap ? 'Скрыть карту' : 'Изменить на карте' }}
          </button>
        </template>
      </FormRow>

      <!-- УЛУЧШЕННАЯ ИНТЕГРАЦИЯ С MapComponent -->
      <Transition name="map-slide">
        <div v-if="showMap" class="map-container">
          <div class="map-header">
            <h4>Обновить местоположение остановки</h4>
            <p class="map-instruction">Кликните на карте или перетащите маркер для изменения координат</p>
          </div>

          <MapComponent
              ref="mapRef"
              :initial-icon="mapCoordinates"
              @update:icon="onMapCoordinatesUpdate"
              class="map-widget"
          />

          <div class="map-actions">
            <div class="coordinates-display">
              <div class="coordinates-compare">
                <div class="original-coords">
                  <span class="label">Исходно:</span>
                  <span class="value">{{ originalCoordinatesDisplay }}</span>
                </div>
                <div class="current-coords">
                  <span class="label">Текущие:</span>
                  <span class="value">{{ currentCoordinatesDisplay }}</span>
                </div>
              </div>
            </div>
            <div class="action-buttons">
              <BtnComponent white small @click="resetToOriginal">
                Сбросить
              </BtnComponent>
              <BtnComponent secondary small @click="cancelMapSelection">
                Отмена
              </BtnComponent>
              <BtnComponent success small @click="confirmMapSelection" :disabled="!hasValidMapCoordinates">
                Применить
              </BtnComponent>
            </div>
          </div>
        </div>
      </Transition>

      <FormRow>
        <template #label>Настройки остановки</template>
        <div class="settings-section">
          <div class="setting-item">
            <CheckBox
                v-model="updateData.isActive"
                name="isActive"
                id="stopIsActive"
                class="dark-checkbox"
            />
            <label for="stopIsActive" class="setting-label">
              <strong class="setting-title">Активная остановка</strong>
              <span class="setting-description">
                Остановка отображается в списке и доступна для планирования маршрутов
              </span>
            </label>
          </div>

          <div class="setting-item">
            <CheckBox
                v-model="updateData.isMajorStop"
                name="isMajorStop"
                id="stopIsMajorStop"
                class="dark-checkbox"
            />
            <label for="stopIsMajorStop" class="setting-label">
              <strong class="setting-title">Главная остановка</strong>
              <span class="setting-description">
                Крупная остановка с повышенным приоритетом в поиске и большим количеством маршрутов
              </span>
            </label>
          </div>
        </div>
      </FormRow>
    </main>

    <footer class="form-footer">
      <BtnComponent
          type="submit"
          :disabled="!isFormValid || isSubmitting"
          success
          class="submit-button"
      >
        <Icon v-if="isSubmitting" :icon="['fas', 'spinner']" class="animate-spin mr-2" />
        Обновить
      </BtnComponent>
      <BtnComponent
          white
          @click.prevent="maybeClose"
          :disabled="isSubmitting"
          class="cancel-button"
      >
        Отмена
      </BtnComponent>
    </footer>
  </form>
</template>

<script>
import { useDialogBox, useErrorHandler, useMessageToaster, useOverlay, useModal } from '@/composables';
import { isEqual } from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import { reactive, ref, computed, watch } from 'vue';

import FormRow from '../Ui/Form/FormRow.vue';
import TextInput from '../Ui/Form/TextInput.vue';
import SelectBox from '../Ui/Form/SelectBox.vue';
import CheckBox from '../Ui/Form/CheckBox.vue';
import BtnComponent from '../Ui/Form/BtnComponent.vue';
import MapComponent from '../Map/MapComponent.vue';

export default {
  name: 'EditStopForm',

  components: {
    FormRow,
    TextInput,
    SelectBox,
    CheckBox,
    BtnComponent,
    MapComponent
  },

  setup() {
    const { showOverlay, hideOverlay } = useOverlay();
    const { toastSuccess } = useMessageToaster();
    const errorHandler = useErrorHandler('dialog');
    const { showConfirmDialog } = useDialogBox();
    const { getFromContext } = useModal();

    const stop = getFromContext('stop');

    const updateData = reactive({
      id: stop.id,
      stopName: stop.stop_name || '',
      nameTm: stop.name_tm || '',
      nameEn: stop.name_en || '',
      latitude: stop.latitude || null,
      longitude: stop.longitude || null,
      cityId: stop.cityId || stop.city_id || null,
      displayOrder: stop.displayOrder || stop.display_order || 0,
      isActive: stop.isActive !== undefined ? stop.isActive :
          (stop.is_active !== undefined ? stop.is_active : true),
      isMajorStop: stop.isMajorStop !== undefined ? stop.isMajorStop :
          (stop.is_major_stop !== undefined ? stop.is_major_stop : false)
    });

    const originalData = { ...updateData };

    const isSubmitting = ref(false);
    const showMap = ref(false);
    const mapRef = ref(null);
    const originalMapCoordinates = ref(null);

    const originalCoordinates = {
      lat: stop.latitude,
      lng: stop.longitude
    };

    const mapCoordinates = computed(() => ({
      lat: updateData.latitude || 37.9601,
      lng: updateData.longitude || 58.3261
    }));

    const originalCoordinatesDisplay = computed(() => {
      if (originalCoordinates.lat && originalCoordinates.lng) {
        return `${originalCoordinates.lat.toFixed(6)}, ${originalCoordinates.lng.toFixed(6)}`;
      }
      return 'Не установлено';
    });

    const currentCoordinatesDisplay = computed(() => {
      if (updateData.latitude && updateData.longitude) {
        return `${updateData.latitude.toFixed(6)}, ${updateData.longitude.toFixed(6)}`;
      }
      return 'Не выбрано';
    });

    const hasValidMapCoordinates = computed(() => {
      return updateData.latitude && updateData.longitude &&
          updateData.latitude >= 35 && updateData.latitude <= 43 &&
          updateData.longitude >= 52 && updateData.longitude <= 67;
    });

    const isFormValid = computed(() => {
      return (
          updateData.stopName?.trim() &&
          hasValidMapCoordinates.value
      );
    });

    const hasChanges = computed(() => {
      return !isEqual(updateData, originalData);
    });

    watch(() => [updateData.latitude, updateData.longitude], () => {
    });

    return {
      stop,
      updateData,
      originalData,
      originalCoordinates,
      isSubmitting,
      showMap,
      mapRef,
      originalMapCoordinates,
      mapCoordinates,
      originalCoordinatesDisplay,
      currentCoordinatesDisplay,
      hasValidMapCoordinates,
      isFormValid,
      hasChanges,
      showOverlay,
      hideOverlay,
      toastSuccess,
      errorHandler,
      showConfirmDialog
    };
  },

  computed: {
    ...mapGetters('cities', ['getCities']),

    cityOptions() {
      return this.getCities?.filter(city => city.is_active) || [];
    }
  },

  mounted() {
    this.fetchCities();
    document.addEventListener('keydown', this.handleKeydown);
  },

  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown);
  },

  methods: {
    ...mapActions('stops', ['update']),
    ...mapActions('cities', ['fetchAll']),

    async fetchCities() {
      try {
        await this.fetchAll();
      } catch (error) {
        console.warn('Failed to fetch cities:', error);
      }
    },

    handleKeydown(event) {
      if (event.key === 'Escape') {
        if (this.showMap) {
          this.cancelMapSelection();
        } else {
          this.maybeClose();
        }
      }
    },

    toggleMapHelper() {
      if (this.showMap) {
        this.cancelMapSelection();
      } else {
        this.showMapHelper();
      }
    },

    showMapHelper() {
      this.originalMapCoordinates = {
        lat: this.updateData.latitude,
        lng: this.updateData.longitude
      };
      this.showMap = true;

      this.$nextTick(() => {
        const mapContainer = document.querySelector('.map-container');
        if (mapContainer) {
          mapContainer.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      });
    },

    cancelMapSelection() {
      if (this.originalMapCoordinates) {
        this.updateData.latitude = this.originalMapCoordinates.lat;
        this.updateData.longitude = this.originalMapCoordinates.lng;
      }
      this.showMap = false;
      this.originalMapCoordinates = null;
    },

    resetToOriginal() {
      this.updateData.latitude = this.originalCoordinates.lat;
      this.updateData.longitude = this.originalCoordinates.lng;
    },

    confirmMapSelection() {
      this.showMap = false;
      this.originalMapCoordinates = null;

      const hasChanged =
          this.updateData.latitude !== this.originalCoordinates.lat ||
          this.updateData.longitude !== this.originalCoordinates.lng;

      if (hasChanged) {
        this.toastSuccess('Координаты обновлены на карте');
      }
    },

    onMapCoordinatesUpdate(coordinates) {
      this.updateData.latitude = parseFloat(coordinates.lat.toFixed(6));
      this.updateData.longitude = parseFloat(coordinates.lng.toFixed(6));
    },

    onCoordinateInputChange() {
    },

    async submit() {
      if (!this.isFormValid || this.isSubmitting) return;

      this.isSubmitting = true;
      this.showOverlay();

      try {
        const stopData = {
          stop_name: this.updateData.stopName.trim(),
          name_tm: this.updateData.nameTm?.trim() || null,
          name_en: this.updateData.nameEn?.trim() || null,
          latitude: this.updateData.latitude,
          longitude: this.updateData.longitude,
          city_id: this.updateData.cityId || null,
          display_order: this.updateData.displayOrder || 0,
          is_active: Boolean(this.updateData.isActive),
          is_major_stop: Boolean(this.updateData.isMajorStop)
        };

        console.log('🚌 Обновляем остановку:', {
          id: this.updateData.id,
          data: stopData,
          originalIsActive: this.updateData.isActive,
          processedIsActive: Boolean(this.updateData.isActive)
        });

        await this.update({
          stopId: this.updateData.id,
          data: stopData
        });

        this.toastSuccess(`Остановка "${stopData.stop_name}" успешно обновлена`);
        this.close();
      } catch (error) {
        console.error('❌ Ошибка обновления остановки:', error);
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

      if (await this.showConfirmDialog('Отменить изменения? Все несохраненные данные будут потеряны.')) {
        this.close();
      }
    },

    close() {
      this.$emit('close');
    }
  }
};
</script>

<style lang="postcss" scoped>
.map-slide-enter-active,
.map-slide-leave-active {
  transition: all 0.3s ease-in-out;
  max-height: 600px;
  overflow: hidden;
}

.map-slide-enter-from,
.map-slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.stop-form {
  @apply rounded-lg border max-w-2xl mx-auto;
  background-color: var(--color-bg-secondary);
  border-color: var(--color-border);
}

.form-header {
  @apply px-6 py-4;
  border-bottom: 1px solid var(--color-border);
}

.form-title {
  @apply text-xl font-semibold;
  color: var(--color-text-primary);
}

.form-subtitle {
  @apply text-sm mt-1;
  color: var(--color-text-secondary);
}

.form-content {
  @apply px-6 py-6 space-y-6;
}

.required {
  color: var(--color-danger);
}

.coordinates-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.coordinate-field {
  @apply space-y-1;
}

.coordinate-label {
  @apply text-sm;
  color: var(--color-text-secondary);
}

.map-link {
  @apply underline ml-2 transition-colors cursor-pointer;
  color: var(--color-accent);
}

.map-link:hover {
  color: color-mix(in srgb, var(--color-accent) 80%, transparent);
}

/* УЛУЧШЕННЫЕ СТИЛИ ДЛЯ КАРТЫ */
.map-container {
  @apply rounded-lg overflow-hidden border mt-4;
  background-color: var(--color-bg-primary);
  border-color: var(--color-border);
  /* Ограничиваем максимальную высоту карты */
  max-height: 450px;
}

.map-header {
  @apply px-4 py-3;
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.map-header h4 {
  @apply text-lg font-medium mb-1;
  color: var(--color-text-primary);
}

.map-instruction {
  @apply text-sm;
  color: var(--color-text-secondary);
}

.map-widget {
  @apply w-full;
  /* ФИКСИРОВАННАЯ ВЫСОТА ДЛЯ КАРТЫ */
  height: 280px;
  min-height: 280px;
}

.map-actions {
  @apply flex justify-between items-center p-4;
  background-color: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
}

.coordinates-display {
  @apply flex items-center;
}

.coordinates-compare {
  @apply space-y-2;
}

.original-coords,
.current-coords {
  @apply flex gap-2;
}

.label {
  @apply text-xs font-medium;
  color: var(--color-text-secondary);
  min-width: 60px;
}

.value {
  @apply text-sm font-mono;
  color: var(--color-text-primary);
}

.original-coords .value {
  color: var(--color-text-secondary);
}

.current-coords .value {
  color: var(--color-accent);
  font-weight: 500;
}

.action-buttons {
  @apply flex gap-2;
}

/* НАСТРОЙКИ ОСТАНОВКИ */
.settings-section {
  @apply space-y-4;
}

.setting-item {
  @apply flex items-start gap-3 p-3 rounded-md;
  background-color: color-mix(in srgb, var(--color-bg-secondary) 50%, transparent);
}

.setting-label {
  @apply flex flex-col cursor-pointer;
}

.setting-title {
  @apply text-sm font-medium;
  color: var(--color-text-primary);
}

.setting-description {
  @apply text-xs mt-1;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.form-footer {
  @apply px-6 py-4;
  @apply flex flex-col-reverse sm:flex-row sm:justify-end gap-3;
  border-top: 1px solid var(--color-border);
}

.submit-button {
  @apply font-medium px-6 py-2 rounded-lg transition-all duration-200;
  background-color: var(--color-accent);
  border: 1px solid var(--color-accent);
  color: white;
}

.submit-button:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--color-accent) 90%, black 10%);
  border-color: color-mix(in srgb, var(--color-accent) 90%, black 10%);
}

.submit-button:disabled {
  background-color: color-mix(in srgb, var(--color-bg-secondary) 80%, transparent);
  border-color: var(--color-border);
  color: var(--color-text-secondary);
  cursor: not-allowed;
}

.cancel-button {
  @apply px-6 py-2 rounded-lg transition-all duration-200;
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

.cancel-button:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--color-bg-secondary) 80%, transparent);
  border-color: var(--color-text-secondary);
}

/* Dark theme inputs */
:deep(.dark-input) {
  background-color: var(--color-bg-input);
  border-color: var(--color-border);
  color: var(--color-text-input);
}

:deep(.dark-input:focus) {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 20%, transparent);
}

:deep(.dark-select) {
  background-color: var(--color-bg-input);
  border-color: var(--color-border);
  color: var(--color-text-input);
}

:deep(.dark-select select) {
  background-color: var(--color-bg-input);
  color: var(--color-text-input);
}

:deep(.dark-select:focus-within) {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 20%, transparent);
}

:deep(.dark-checkbox) {
  accent-color: var(--color-accent);
}

@media (max-width: 640px) {
  .form-content {
    @apply px-4 py-4;
  }

  .form-footer {
    @apply px-4;
  }

  .map-actions {
    @apply flex-col gap-4;
  }

  .coordinates-display {
    @apply w-full;
  }

  .action-buttons {
    @apply w-full justify-end;
  }

  .coordinates-compare {
    @apply space-y-1;
  }

  .original-coords,
  .current-coords {
    @apply text-sm;
  }

  /* Уменьшаем высоту карты на мобильных */
  .map-widget {
    height: 200px;
    min-height: 200px;
  }

  .map-container {
    max-height: 370px;
  }
}
</style>
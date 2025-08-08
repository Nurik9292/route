<template>
  <form @submit.prevent="submit" class="stop-form">
    <header class="form-header">
      <h1 class="form-title">Добавить остановку</h1>
    </header>

    <main class="form-content">
      <FormRow>
        <template #label>Название остановки <span class="required">*</span></template>
        <TextInput
            v-model="newStop.stopName"
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
            v-model="newStop.nameTm"
            name="stopNameTm"
            placeholder="Введите название на туркменском"
            maxlength="100"
            class="dark-input"
        />
      </FormRow>

      <FormRow>
        <template #label>Название (английский)</template>
        <TextInput
            v-model="newStop.nameEn"
            name="stopNameEn"
            placeholder="Enter English name"
            maxlength="100"
            class="dark-input"
        />
      </FormRow>

      <FormRow>
        <template #label>Город</template>
        <SelectBox
            v-model="newStop.cityId"
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
        <template #label>Координаты <span class="required">*</span></template>
        <div class="coordinates-grid">
          <div class="coordinate-field">
            <TextInput
                v-model.number="newStop.latitude"
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
                v-model.number="newStop.longitude"
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
            {{ showMap ? 'Скрыть карту' : 'Выбрать на карте' }}
          </button>
        </template>
      </FormRow>

      <!-- УЛУЧШЕННАЯ ИНТЕГРАЦИЯ С MapComponent -->
      <Transition name="map-slide">
        <div v-if="showMap" class="map-container">
          <div class="map-header">
            <h4>Выберите местоположение остановки</h4>
            <p class="map-instruction">Кликните на карте для выбора координат</p>
          </div>

          <MapComponent
              ref="mapRef"
              :initial-icon="mapCoordinates"
              @update:icon="onMapCoordinatesUpdate"
              class="map-widget"
          />

          <div class="map-actions">
            <div class="coordinates-display">
              <span class="coordinates-text">
                Выбрано: {{ displayCoordinates }}
              </span>
            </div>
            <div class="action-buttons">
              <BtnComponent white small @click="cancelMapSelection">
                Отмена
              </BtnComponent>
              <BtnComponent success small @click="confirmMapSelection" :disabled="!hasValidMapCoordinates">
                Применить координаты
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
                v-model="newStop.isMajorStop"
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
        Создать остановку
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
import { useDialogBox, useErrorHandler, useMessageToaster, useOverlay } from '@/composables';
import { isEqual } from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import { reactive, ref, computed, watch } from 'vue';

import FormRow from '../Ui/Form/FormRow.vue';
import TextInput from '../Ui/Form/TextInput.vue';
import SelectBox from '../Ui/Form/SelectBox.vue';
import BtnComponent from '../Ui/Form/BtnComponent.vue';
import MapComponent from '../Map/MapComponent.vue';
import CheckBox from "@/components/Ui/Form/CheckBox.vue";

export default {
  name: 'AddStopForm',

  components: {
    CheckBox,
    FormRow,
    TextInput,
    SelectBox,
    BtnComponent,
    MapComponent
  },

  setup() {
    const { showOverlay, hideOverlay } = useOverlay();
    const { toastSuccess } = useMessageToaster();
    const errorHandler = useErrorHandler('dialog');
    const { showConfirmDialog } = useDialogBox();

    const newStop = reactive({
      stopName: '',
      nameTm: '',
      nameEn: '',
      latitude: null,
      longitude: null,
      cityId: null,
      displayOrder: 0,
      isActive: true,
      isMajorStop: false,
    });

    const isSubmitting = ref(false);
    const showMap = ref(false);
    const mapRef = ref(null);
    const originalMapCoordinates = ref(null);

    const mapCoordinates = computed(() => ({
      lat: newStop.latitude || 37.9601,
      lng: newStop.longitude || 58.3261
    }));

    const displayCoordinates = computed(() => {
      if (newStop.latitude && newStop.longitude) {
        return `${newStop.latitude.toFixed(6)}, ${newStop.longitude.toFixed(6)}`;
      }
      return 'Не выбрано';
    });

    const hasValidMapCoordinates = computed(() => {
      return newStop.latitude && newStop.longitude &&
          newStop.latitude >= 35 && newStop.latitude <= 43 &&
          newStop.longitude >= 52 && newStop.longitude <= 67;
    });

    const isFormValid = computed(() => {
      return (
          newStop.stopName?.trim() &&
          hasValidMapCoordinates.value
      );
    });

    const hasChanges = computed(() => {
      const emptyData = {
        stopName: '',
        nameTm: '',
        nameEn: '',
        latitude: null,
        longitude: null,
        cityId: null,
        isMajorStop: false,
        isActive: true,
        displayOrder: 0
      };
      return !isEqual(newStop, emptyData);
    });

    watch(() => [newStop.latitude, newStop.longitude], () => {
    });

    return {
      newStop,
      isSubmitting,
      showMap,
      mapRef,
      originalMapCoordinates,
      mapCoordinates,
      displayCoordinates,
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
    ...mapActions('stops', ['store']),
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
        lat: this.newStop.latitude,
        lng: this.newStop.longitude
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
        this.newStop.latitude = this.originalMapCoordinates.lat;
        this.newStop.longitude = this.originalMapCoordinates.lng;
      }
      this.showMap = false;
      this.originalMapCoordinates = null;
    },

    confirmMapSelection() {
      this.showMap = false;
      this.originalMapCoordinates = null;
      this.toastSuccess('Координаты выбраны на карте');
    },

    onMapCoordinatesUpdate(coordinates) {
      this.newStop.latitude = parseFloat(coordinates.lat.toFixed(6));
      this.newStop.longitude = parseFloat(coordinates.lng.toFixed(6));
    },

    onCoordinateInputChange() {
    },

    async submit() {
      if (!this.isFormValid || this.isSubmitting) return;

      this.isSubmitting = true;
      this.showOverlay();

      try {
        const stopData = {
          stop_name: this.newStop.stopName.trim(),
          name_tm: this.newStop.nameTm?.trim() || null,
          name_en: this.newStop.nameEn?.trim() || null,
          latitude: this.newStop.latitude,
          longitude: this.newStop.longitude,
          city_id: this.newStop.cityId || null,
          is_active: this.newStop.isActive,
          is_major_stop:  Boolean(this.newStop.isMajorStop),
        };
        await this.store(stopData);
        this.toastSuccess(`Остановка "${stopData.stop_name}" успешно создана`);
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

      if (await this.showConfirmDialog('Отменить создание остановки? Все изменения будут потеряны.')) {
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
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 400px;
  overflow: hidden;
}

.map-slide-enter-from,
.map-slide-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-8px);
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
  max-height: 400px;
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

.coordinates-text {
  @apply text-sm font-mono;
  color: var(--color-text-secondary);
}

.action-buttons {
  @apply flex gap-3;
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

@media (max-width: 640px) {
  .form-content {
    @apply px-4 py-4;
  }

  .form-footer {
    @apply px-4;
  }

  .map-actions {
    @apply flex-col gap-3;
  }

  .coordinates-display {
    @apply w-full;
  }

  .action-buttons {
    @apply w-full justify-end;
  }

  /* Уменьшаем высоту карты на мобильных */
  .map-widget {
    height: 200px;
    min-height: 200px;
  }

  .map-container {
    max-height: 320px;
  }
}
</style>
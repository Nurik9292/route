<template>
  <form @submit.prevent="submit" class="stop-form">
    <header class="form-header">
      <h1 class="form-title">Редактировать остановку</h1>
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
            />
            <p class="coordinate-label">Долгота (Longitude)</p>
          </div>
        </div>
        <template #help>
          Координаты остановки в формате десятичных градусов.
          <button type="button" @click="showMapHelper" class="map-link">
            Изменить на карте
          </button>
        </template>
      </FormRow>

      <!-- Карта для выбора координат -->
      <div v-if="showMap" class="map-container">
        <div id="edit-stop-map" class="map-widget"></div>
        <div class="map-actions">
          <BtnComponent white small @click="hideMapHelper">
            Отмена
          </BtnComponent>
          <BtnComponent success small @click="confirmCoordinates">
            Подтвердить координаты
          </BtnComponent>
        </div>
      </div>

      <!-- Статус остановки -->
      <FormRow>
        <template #label>Статус остановки</template>
        <div class="status-section">
          <CheckBox
              v-model="updateData.isActive"
              name="isActive"
              id="stopIsActive"
              class="dark-checkbox"
          />
          <label for="stopIsActive" class="status-label">
            <strong class="status-title">Остановка активна</strong>
            <span class="status-description">
              Остановка отображается в списке и доступна для планирования маршрутов
            </span>
          </label>
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
import { reactive, ref, computed } from 'vue';

import FormRow from '../Ui/Form/FormRow.vue';
import TextInput from '../Ui/Form/TextInput.vue';
import SelectBox from '../Ui/Form/SelectBox.vue';
import CheckBox from '../Ui/Form/CheckBox.vue';
import BtnComponent from '../Ui/Form/BtnComponent.vue';

export default {
  name: 'EditStopForm',

  components: {
    FormRow,
    TextInput,
    SelectBox,
    CheckBox,
    BtnComponent
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
      nameTm: stop.name_tm ||  '',
      nameEn: stop.name_en  || '',
      latitude: stop.latitude || null,
      longitude: stop.longitude || null,
      cityId: stop.cityId || stop.city_id || null,
      displayOrder: stop.displayOrder || stop.display_order || 0,
      isActive: stop.isActive !== undefined ? stop.isActive :
          (stop.is_active !== undefined ? stop.is_active : true)
    });

    const originalData = { ...updateData };

    const isSubmitting = ref(false);
    const showMap = ref(false);
    const mapInstance = ref(null);
    const selectedMarker = ref(null);
    const tempCoordinates = ref(null);

    const isFormValid = computed(() => {
      return (
          updateData.stopName?.trim() &&
          updateData.latitude &&
          updateData.longitude &&
          updateData.latitude >= 35 && updateData.latitude <= 43 &&
          updateData.longitude >= 52 && updateData.longitude <= 67
      );
    });

    const hasChanges = computed(() => {
      return !isEqual(updateData, originalData);
    });

    return {
      stop,
      updateData,
      originalData,
      isSubmitting,
      showMap,
      mapInstance,
      selectedMarker,
      tempCoordinates,
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
    if (this.mapInstance) {
      this.mapInstance.remove();
    }
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
        this.maybeClose();
      }
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
          stop_code: 'test-yes',
          // displayOrder: this.updateData.displayOrder || 0,
          is_active: this.updateData.isActive
        };

        await this.update({
          stopId: this.updateData.id,
          data: stopData
        });

        this.toastSuccess(`Остановка "${stopData.stopName}" успешно обновлена`);
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

      if (await this.showConfirmDialog('Отменить изменения? Все несохраненные данные будут потеряны.')) {
        this.close();
      }
    },

    close() {
      this.$emit('close');
    },

    showMapHelper() {
      this.showMap = true;
      this.$nextTick(() => {
        this.initMap();
      });
    },

    hideMapHelper() {
      this.showMap = false;
      if (this.mapInstance) {
        this.mapInstance.remove();
        this.mapInstance = null;
      }
    },

    initMap() {
      try {
        if (typeof L === 'undefined') {
          console.warn('Leaflet library not loaded');
          return;
        }

        const currentLat = this.updateData.latitude || 37.9601;
        const currentLng = this.updateData.longitude || 58.3261;

        this.mapInstance = L.map('edit-stop-map').setView([currentLat, currentLng], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(this.mapInstance);

        this.selectedMarker = L.marker([currentLat, currentLng])
            .addTo(this.mapInstance);

        this.mapInstance.on('click', (e) => {
          const { lat, lng } = e.latlng;

          if (this.selectedMarker) {
            this.mapInstance.removeLayer(this.selectedMarker);
          }

          this.selectedMarker = L.marker([lat, lng]).addTo(this.mapInstance);

          this.tempCoordinates = {
            lat: parseFloat(lat.toFixed(6)),
            lng: parseFloat(lng.toFixed(6))
          };
        });

      } catch (error) {
        console.error('Failed to initialize map:', error);
        this.hideMapHelper();
      }
    },

    confirmCoordinates() {
      if (this.tempCoordinates) {
        this.updateData.latitude = this.tempCoordinates.lat;
        this.updateData.longitude = this.tempCoordinates.lng;
      }
      this.hideMapHelper();
    }
  }
};
</script>

<style lang="postcss" scoped>
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
  @apply underline ml-2 transition-colors;
  color: var(--color-accent);
}

.map-link:hover {
  color: color-mix(in srgb, var(--color-accent) 80%, transparent);
}

.map-container {
  @apply rounded-lg overflow-hidden border;
  background-color: var(--color-bg-primary);
  border-color: var(--color-border);
}

.map-widget {
  @apply w-full h-64;
}

.map-actions {
  @apply flex justify-end p-3 gap-3;
  border-top: 1px solid var(--color-border);
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

.submit-button:hover {
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

.cancel-button:hover {
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

/* Leaflet map styling */
#stop-map {
  z-index: 1;
}

.leaflet-container {
  background-color: var(--color-bg-primary);
}

@media (max-width: 640px) {
  .form-content {
    @apply px-4 py-4;
  }

  .form-footer {
    @apply px-4;
  }
}
</style>
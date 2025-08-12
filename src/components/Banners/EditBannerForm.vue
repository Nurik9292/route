<style lang="postcss" scoped>
.edit-banner-modal {
  width: 100%;
  max-width: 64rem;
  margin: 0 auto;
  background-color: var(--color-bg-primary);
  border-radius: 8px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  max-height: 90vh;
}

.banner-form {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Header */
.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-bg-secondary);
}

.form-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  color: var(--color-accent);
}

.close-button {
  padding: 8px;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-button:hover {
  color: var(--color-text-primary);
  background-color: var(--color-bg-primary);
}

/* Progress Indicator */
.progress-indicator {
  padding: 24px;
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.progress-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
}

.step {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
}

.step.active {
  color: var(--color-accent);
}

.step.completed {
  color: var(--color-success);
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
}

.step.active .step-number,
.step.completed .step-number {
  background-color: currentColor;
  color: white;
}

.step-label {
  font-size: 14px;
  font-weight: 500;
}

/* Form Content */
.form-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.form-step {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.step-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 32px;
}

.step-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.step-description {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 32rem;
  margin: 0 auto;
}

/* Form Elements */
.required-label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.required-asterisk {
  color: var(--color-danger);
}

.field-error {
  font-size: 14px;
  color: var(--color-danger);
  margin-top: 4px;
}

.field-hint {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
  font-style: italic;
}

/* Status Toggle */
.status-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.toggle-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-bg-secondary);
  border-radius: 24px;
  transition: all 0.3s ease;
}

.toggle-slider:before {
  position: absolute;
  content: '';
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.toggle-input:checked + .toggle-slider {
  background-color: var(--color-success);
}

.toggle-input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.toggle-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

/* Footer */
.form-footer {
  padding: 24px;
  border-top: 1px solid var(--color-border);
  background-color: var(--color-bg-secondary);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.footer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-summary {
  background-color: var(--color-bg-primary);
  padding: 16px;
  border-radius: 8px;
}

.summary-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 12px;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-item {
  font-size: 14px;
  color: var(--color-text-secondary);
}

/* Button Loading State */
.loading {
  opacity: 0.75;
  cursor: not-allowed;
}

/* Error States */
.error {
  border-color: var(--color-danger) !important;
}

/* Utility Classes */
.mr-1 {
  margin-right: 0.25rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

.text-k-success {
  color: var(--color-success);
}

.text-k-danger {
  color: var(--color-danger);
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .edit-banner-modal {
    max-width: 100%;
    margin: 0;
    border-radius: 0;
    height: 100vh;
    max-height: 100vh;
  }

  .progress-steps {
    gap: 16px;
  }

  .step-label {
    display: none;
  }

  .footer-actions {
    flex-direction: column;
    gap: 12px;
  }

  .form-fields {
    max-width: none;
  }
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-step {
  animation: fadeIn 0.3s ease-out;
}

/* Focus states */
.toggle-input:focus + .toggle-slider {
  box-shadow: 0 0 0 2px var(--color-accent), 0 0 0 4px color-mix(in srgb, var(--color-accent) 20%, transparent);
}
</style><template>
  <div class="edit-banner-modal">
    <form @submit.prevent="submit" class="banner-form">
      <header class="form-header">
        <h1 class="form-title">
          <Icon :icon="['fas', 'edit']" class="title-icon" />
          Изменить баннер "{{ bannerData.title || 'Без названия' }}"
        </h1>
        <button
            type="button"
            class="close-button"
            @click="maybeClose"
            title="Закрыть"
        >
          <Icon :icon="['fas', 'times']" />
        </button>
      </header>

      <div class="progress-indicator">
        <div class="progress-steps">
          <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
            <span class="step-number">1</span>
            <span class="step-label">Основное</span>
          </div>
          <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
            <span class="step-number">2</span>
            <span class="step-label">Изображение</span>
          </div>
          <div class="step" :class="{ active: currentStep >= 3 }">
            <span class="step-number">3</span>
            <span class="step-label">Настройки</span>
          </div>
        </div>
      </div>

      <main class="form-content">
        <!-- Step 1: Basic Info -->
        <div v-show="currentStep === 1" class="form-step">
          <div class="step-header">
            <h2 class="step-title">Основная информация</h2>
            <p class="step-description">Измените основные данные баннера</p>
          </div>

          <div class="form-fields">
            <FormRow>
              <template #label>
                <span class="required-label">
                  Заголовок баннера
                  <span class="required-asterisk">*</span>
                </span>
              </template>
              <TextInput
                  v-model="bannerData.title"
                  v-focus
                  name="title"
                  placeholder="Введите заголовок баннера"
                  required
                  maxlength="200"
                  :class="{ 'error': errors.title }"
              />
              <div v-if="errors.title" class="field-error">{{ errors.title }}</div>
              <div class="field-hint">Максимум 200 символов</div>
            </FormRow>

            <FormRow>
              <template #label>
                <span class="required-label">
                  Тип баннера
                  <span class="required-asterisk">*</span>
                </span>
              </template>
              <SelectBox
                  v-model="bannerData.type"
                  name="type"
                  :options="bannerTypeOptions"
                  value-key="value"
                  label-key="label"
                  placeholder="Выберите тип баннера"
                  :class="{ 'error': errors.type }"
              />
              <div v-if="errors.type" class="field-error">{{ errors.type }}</div>
              <div class="field-hint">Определяет где будет показан баннер</div>
            </FormRow>

            <FormRow>
              <template #label>Ссылка (необязательно)</template>
              <TextInput
                  v-model="bannerData.targetUrl"
                  name="targetUrl"
                  placeholder="https://example.com"
                  type="url"
              />
              <div class="field-hint">Ссылка при клике на баннер</div>
            </FormRow>
          </div>
        </div>

        <!-- Step 2: Image Upload -->
        <div v-show="currentStep === 2" class="form-step">
          <div class="step-header">
            <h2 class="step-title">Изображение баннера</h2>
            <p class="step-description">Измените изображение для баннера</p>
          </div>

          <div class="form-fields">
            <FormRow>
              <template #label>
                <span class="required-label">
                  Изображение
                  <span class="required-asterisk">*</span>
                </span>
              </template>
              <ImageInput
                  v-model="bannerData.imageUrl"
                  name="banner"
                  :class="{ 'error': errors.imageUrl }"
                  @file-selected="onImageSelected"
                  @upload-complete="onImageUploaded"
                  @upload-error="onImageError"
              />
              <div v-if="errors.imageUrl" class="field-error">{{ errors.imageUrl }}</div>
              <div class="field-hint">Рекомендуемый размер: 1200x400px, форматы: JPG, PNG, GIF</div>
            </FormRow>
          </div>
        </div>

        <!-- Step 3: Settings -->
        <div v-show="currentStep === 3" class="form-step">
          <div class="step-header">
            <h2 class="step-title">Дополнительные настройки</h2>
            <p class="step-description">Настройте порядок отображения и время показа</p>
          </div>

          <div class="form-fields">
            <FormRow>
              <template #label>Порядок отображения</template>
              <TextInput
                  v-model.number="bannerData.displayOrder"
                  name="displayOrder"
                  type="number"
                  :min="0"
                  :max="999"
                  placeholder="0"
              />
              <div class="field-hint">Чем меньше число, тем выше в списке</div>
            </FormRow>

            <FormRow>
              <template #label>Дата начала показа</template>
              <TextInput
                  v-model="bannerData.startDate"
                  name="startDate"
                  type="datetime-local"
              />
              <div class="field-hint">Оставьте пустым для немедленного показа</div>
            </FormRow>

            <FormRow>
              <template #label>Дата окончания показа</template>
              <TextInput
                  v-model="bannerData.endDate"
                  name="endDate"
                  type="datetime-local"
              />
              <div class="field-hint">Оставьте пустым для постоянного показа</div>
            </FormRow>

            <!-- Status Toggle -->
            <FormRow>
              <template #label>Статус</template>
              <div class="status-toggle">
                <label class="toggle-switch">
                  <input
                      type="checkbox"
                      v-model="bannerData.isActive"
                      class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
                <span class="toggle-label">
                  {{ bannerData.isActive ? 'Активен' : 'Неактивен' }}
                </span>
              </div>
              <div class="field-hint">Неактивные баннеры не показываются пользователям</div>
            </FormRow>
          </div>
        </div>
      </main>

      <footer class="form-footer">
        <div class="footer-actions">
          <BtnComponent
              v-if="currentStep < 3"
              type="button"
              success
              @click="nextStep"
              :disabled="!canProceedToNext"
          >
            Далее
            <Icon :icon="['fas', 'arrow-right']" class="ml-2" />
          </BtnComponent>

          <BtnComponent
              v-else
              type="submit"
              success
              :disabled="uploading || !isFormValid"
              :class="{ 'loading': uploading }"
          >
            <Icon v-if="uploading" :icon="['fas', 'spinner']" class="animate-spin mr-2" />
            <Icon v-else :icon="['fas', 'save']" class="mr-2" />
            {{ uploading ? 'Сохранение...' : 'Обновить баннер' }}
          </BtnComponent>
        </div>

        <!-- Form Summary -->
        <div v-if="currentStep === 3" class="form-summary">
          <h3 class="summary-title">Предварительный просмотр:</h3>
          <div class="summary-content">
            <div class="summary-item">
              <strong>Заголовок:</strong> {{ bannerData.title || 'Не указан' }}
            </div>
            <div class="summary-item">
              <strong>Тип:</strong> {{ getTypeLabelByValue(bannerData.type) }}
            </div>
            <div class="summary-item">
              <strong>Статус:</strong>
              <span :class="bannerData.isActive ? 'text-k-success' : 'text-k-danger'">
                {{ bannerData.isActive ? 'Активен' : 'Неактивен' }}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </form>
  </div>
</template>

<script>
import { useDialogBox, useErrorHandler, useMessageToaster, useModal, useOverlay } from '@/composables';
import { isEqual } from 'lodash';
import { mapActions } from 'vuex';

import FormRow from '@/components/Ui/Form/FormRow.vue';
import TextInput from '@/components/Ui/Form/TextInput.vue';
import SelectBox from '@/components/Ui/Form/SelectBox.vue';
import ImageInput from '@/components/Ui/Form/ImageInput.vue';
import BtnComponent from '@/components/Ui/Form/BtnComponent.vue';

export default {
  name: 'EditBannerForm',

  components: {
    FormRow,
    TextInput,
    SelectBox,
    ImageInput,
    BtnComponent
  },

  setup() {
    const { showOverlay, hideOverlay } = useOverlay();
    const { toastSuccess } = useMessageToaster();
    const errorHandler = useErrorHandler('dialog');
    const { showConfirmDialog } = useDialogBox();
    const { getFromContext } = useModal();

    const banner = getFromContext('banner');

    return {
      showOverlay,
      hideOverlay,
      toastSuccess,
      errorHandler,
      showConfirmDialog,
      banner
    };
  },

  data() {
    return {
      currentStep: 1,
      originalData: null,
      bannerData: {
        id: '',
        title: '',
        type: '',
        imageUrl: '',
        targetUrl: '',
        displayOrder: 0,
        startDate: '',
        endDate: '',
        isActive: false
      },
      errors: {},
      uploading: false,
      bannerTypeOptions: [
        { value: 'main', label: 'Главная страница' },
        { value: 'stops', label: 'Страница остановок' },
        { value: 'routes', label: 'Страница маршрутов' },
        { value: 'places', label: 'Страница мест' }
      ]
    };
  },

  computed: {
    canProceedToNext() {
      switch (this.currentStep) {
        case 1:
          return this.bannerData.title.trim() && this.bannerData.type;
        case 2:
          return this.bannerData.imageUrl;
        default:
          return true;
      }
    },

    isFormValid() {
      return this.bannerData.title.trim() &&
          this.bannerData.type &&
          this.bannerData.imageUrl &&
          Object.keys(this.errors).length === 0;
    },

    hasChanges() {
      return !isEqual(this.bannerData, this.originalData);
    }
  },

  mounted() {
    document.addEventListener('keydown', this.handleKeydown);
    this.initializeForm();
  },

  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown);
  },

  methods: {
    ...mapActions('banners', ['update']),

    initializeForm() {
      console.log('Banner data from context:', this.banner);

      const host = import.meta.env.VITE_API_BASE_URL;
      let imageUrl = '';

      if (this.banner.imageUrl || this.banner.image_url) {
        const rawImageUrl = this.banner.imageUrl || this.banner.image_url;

        if (rawImageUrl.startsWith('http')) {
          imageUrl = rawImageUrl;
        }
        else if (rawImageUrl.includes('banners')) {
          imageUrl = host + `${rawImageUrl}`;
        }
        else {
          imageUrl = host + '/banners/' + rawImageUrl;
        }
      }

      this.bannerData = {
        id: this.banner.id,
        title: this.banner.title || '',
        type: this.banner.type || 'main',
        imageUrl: imageUrl,
        targetUrl: this.banner.targetUrl || this.banner.target_url || '',
        displayOrder: this.banner.displayOrder || this.banner.display_order || 0,
        startDate: this.formatDateForInput(this.banner.startDate || this.banner.start_date),
        endDate: this.formatDateForInput(this.banner.endDate || this.banner.end_date),
        isActive: this.banner.isActive !== undefined ? this.banner.isActive : this.banner.is_active || false
      };

      this.originalData = { ...this.bannerData };

      console.log('Initialized banner data:', this.bannerData);
    },

    formatDateForInput(dateString) {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
      } catch (error) {
        console.warn('Error formatting date:', dateString, error);
        return '';
      }
    },

    handleKeydown(event) {
      if (event.key === 'Escape') {
        this.maybeClose();
      }
    },

    nextStep() {
      if (this.validateCurrentStep()) {
        this.currentStep++;
      }
    },

    previousStep() {
      this.currentStep--;
    },

    validateCurrentStep() {
      this.clearErrors();
      switch (this.currentStep) {
        case 1:
          return this.validateBasicInfo();
        case 2:
          return this.validateImage();
        case 3:
          return this.validateSettings();
        default:
          return true;
      }
    },

    validateBasicInfo() {
      let isValid = true;

      if (!this.bannerData.title.trim()) {
        this.setError('title', 'Заголовок обязателен');
        isValid = false;
      }

      if (!this.bannerData.type) {
        this.setError('type', 'Тип баннера обязателен');
        isValid = false;
      }

      if (this.bannerData.targetUrl && !this.isValidUrl(this.bannerData.targetUrl)) {
        this.setError('targetUrl', 'Введите корректную ссылку');
        isValid = false;
      }

      return isValid;
    },

    validateImage() {
      if (!this.bannerData.imageUrl) {
        this.setError('imageUrl', 'Изображение обязательно');
        return false;
      }
      return true;
    },

    validateSettings() {
      if (this.bannerData.startDate && this.bannerData.endDate) {
        const startDate = new Date(this.bannerData.startDate);
        const endDate = new Date(this.bannerData.endDate);

        if (startDate >= endDate) {
          this.setError('endDate', 'Дата окончания должна быть позже даты начала');
          return false;
        }
      }

      return true;
    },

    isValidUrl(string) {
      try {
        new URL(string);
        return true;
      } catch (_) {
        return false;
      }
    },

    setError(field, message) {
      this.errors = { ...this.errors, [field]: message };
    },

    clearErrors() {
      this.errors = {};
    },

    getTypeLabelByValue(value) {
      const option = this.bannerTypeOptions.find(opt => opt.value === value);
      return option ? option.label : value;
    },

    onImageSelected(file) {
      this.clearErrors();
    },

    onImageUploaded(file) {
    },

    onImageError(error) {
      this.setError('imageUrl', 'Ошибка при загрузке изображения');
    },

    async submit() {
      if (!this.validateCurrentStep() || !this.isFormValid) {
        return;
      }

      this.showOverlay();
      this.uploading = true;

      try {
        const updateData = {
          id: this.bannerData.id,
          title: this.bannerData.title,
          type: this.bannerData.type,
          image_url: this.bannerData.imageUrl,
          target_url: this.bannerData.targetUrl,
          display_order: this.bannerData.displayOrder,
          start_date: this.bannerData.startDate || null,
          end_date: this.bannerData.endDate || null,
          is_active: this.bannerData.isActive
        };

        console.log('Updating banner with data:', updateData);

        await this.update({ bannerId: this.bannerData.id, data: updateData });
        this.toastSuccess(`Баннер "${this.bannerData.title}" успешно обновлен`);
        this.close();
      } catch (error) {
        console.error('Error updating banner:', error);
        this.errorHandler.handleHttpError(error);
      } finally {
        this.uploading = false;
        this.hideOverlay();
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
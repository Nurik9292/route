<template>
  <div class="add-banner-modal">
    <form @submit.prevent="submit" class="banner-form">
      <header class="form-header">
        <h1 class="form-title">
          <Icon :icon="['fas', 'plus-circle']" class="title-icon" />
          Добавить новый баннер
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
            <p class="step-description">Заполните основные данные баннера</p>
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
                  v-model="newBanner.title"
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
                  v-model="newBanner.type"
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
                  v-model="newBanner.targetUrl"
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
            <p class="step-description">Загрузите изображение для баннера</p>
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
                  v-model="newBanner.imageUrl"
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
                  v-model.number="newBanner.displayOrder"
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
                  v-model="newBanner.startDate"
                  name="startDate"
                  type="datetime-local"
              />
              <div class="field-hint">Оставьте пустым для немедленного показа</div>
            </FormRow>

            <FormRow>
              <template #label>Дата окончания показа</template>
              <TextInput
                  v-model="newBanner.endDate"
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
                      v-model="newBanner.isActive"
                      class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
                <span class="toggle-label">
                  {{ newBanner.isActive ? 'Активен' : 'Неактивен' }}
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
              v-if="currentStep === 1"
              type="button"
              white
              @click="maybeClose"
          >
            <Icon :icon="['fas', 'times']" class="mr-2" />
            Отмена
          </BtnComponent>

          <BtnComponent
              v-else
              type="button"
              secondary
              @click="previousStep"
          >
            <Icon :icon="['fas', 'arrow-left']" class="mr-2" />
            Назад
          </BtnComponent>

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
            {{ uploading ? 'Сохранение...' : 'Создать баннер' }}
          </BtnComponent>
        </div>

        <!-- Form Summary -->
        <div v-if="currentStep === 3" class="form-summary">
          <h3 class="summary-title">Предварительный просмотр:</h3>
          <div class="summary-content">
            <div class="summary-item">
              <strong>Заголовок:</strong> {{ newBanner.title || 'Не указан' }}
            </div>
            <div class="summary-item">
              <strong>Тип:</strong> {{ getTypeLabelByValue(newBanner.type) }}
            </div>
            <div class="summary-item">
              <strong>Статус:</strong>
              <span :class="newBanner.isActive ? 'text-k-success' : 'text-k-danger'">
                {{ newBanner.isActive ? 'Активен' : 'Неактивен' }}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </form>
  </div>
</template>

<script>
import { useDialogBox, useErrorHandler, useMessageToaster, useOverlay } from '@/composables';
import { isEqual } from 'lodash';
import { mapActions } from 'vuex';

import FormRow from '../Ui/Form/FormRow.vue';
import TextInput from '../Ui/Form/TextInput.vue';
import SelectBox from '../Ui/Form/SelectBox.vue';
import ImageInput from '../Ui/Form/ImageInput.vue';
import BtnComponent from '../Ui/Form/BtnComponent.vue';

export default {
  name: 'AddBannerForm',

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

    return {
      showOverlay,
      hideOverlay,
      toastSuccess,
      errorHandler,
      showConfirmDialog
    };
  },

  data() {
    return {
      currentStep: 1,
      newBanner: {
        title: '',
        type: 'main',
        imageUrl: '',
        targetUrl: '',
        displayOrder: 0,
        startDate: null,
        endDate: null,
        isActive: true
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
    emptyBannerData() {
      return {
        title: '',
        type: 'main',
        imageUrl: '',
        targetUrl: '',
        displayOrder: 0,
        startDate: null,
        endDate: null,
        isActive: true
      };
    },

    canProceedToNext() {
      switch (this.currentStep) {
        case 1:
          return this.newBanner.title.trim() && this.newBanner.type;
        case 2:
          return this.newBanner.imageUrl;
        default:
          return true;
      }
    },

    isFormValid() {
      return this.newBanner.title.trim() &&
          this.newBanner.type &&
          this.newBanner.imageUrl &&
          Object.keys(this.errors).length === 0;
    }
  },

  mounted() {
    document.addEventListener('keydown', this.handleKeydown);
  },

  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown);
  },

  methods: {
    ...mapActions('banners', ['store', 'uploadImage']),

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

      if (!this.newBanner.title.trim()) {
        this.setError('title', 'Заголовок обязателен');
        isValid = false;
      }

      if (!this.newBanner.type) {
        this.setError('type', 'Тип баннера обязателен');
        isValid = false;
      }

      if (this.newBanner.targetUrl && !this.isValidUrl(this.newBanner.targetUrl)) {
        this.setError('targetUrl', 'Введите корректную ссылку');
        isValid = false;
      }

      return isValid;
    },

    validateImage() {
      if (!this.newBanner.imageUrl) {
        this.setError('imageUrl', 'Изображение обязательно');
        return false;
      }
      return true;
    },

    validateSettings() {
      if (this.newBanner.startDate && this.newBanner.endDate) {
        const startDate = new Date(this.newBanner.startDate);
        const endDate = new Date(this.newBanner.endDate);

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
      console.log(this.isFormValid)
      console.log(this.validateCurrentStep())
      if ( !this.isFormValid) {
        return;
      }

      this.showOverlay();
      this.uploading = true;
      console.log('store', this.newBanner)
      try {
        await this.store(this.newBanner);
        this.toastSuccess(`Баннер "${this.newBanner.title}" успешно создан`);
        this.close();
      } catch (error) {
        this.errorHandler.handleHttpError(error);
      } finally {
        this.uploading = false;
        this.hideOverlay();
      }
    },

    async maybeClose() {
      if (isEqual(this.newBanner, this.emptyBannerData)) {
        this.close();
        return;
      }

      if (await this.showConfirmDialog('Отменить создание баннера? Все введенные данные будут потеряны.')) {
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
.add-banner-modal {
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
  .add-banner-modal {
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
</style>
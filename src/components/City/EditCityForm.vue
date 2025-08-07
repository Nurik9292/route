<template>
  <form @submit.prevent="submit">
    <header>
      <h1>Редактировать город</h1>
    </header>

    <main class="space-y-5">
      <FormRow>
        <template #label>Название <span class="text-red-500">*</span></template>
        <TextInput
            v-model="updateData.name"
            v-focus
            name="name"
            placeholder="Введите название города"
            required
            maxlength="100"
        />
      </FormRow>

      <FormRow>
        <template #label>Название (туркменский)</template>
        <TextInput
            v-model="updateData.nameTm"
            name="nameTm"
            placeholder="Введите название на туркменском"
            maxlength="100"
        />
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
        />
        <template #help>Чем меньше число, тем выше в списке</template>
      </FormRow>

      <!-- ✅ ИСПРАВЛЕНО: Используем CheckBox компонент -->
      <FormRow>
        <template #label>Статус города</template>
        <div class="permissions-section">
          <CheckBox
              v-model="updateData.isActive"
              name="isActive"
              id="cityIsActive"
          />
          <label for="cityIsActive" class="permission-label">
            <strong>Город активен</strong>
            <span class="permission-description">
              Город отображается в списке и доступен для выбора
            </span>
          </label>
        </div>
      </FormRow>
    </main>

    <footer>
      <BtnComponent class="BtnComponent-add" type="submit" :disabled="!isFormValid || isSubmitting">
        <span v-if="isSubmitting" class="spinner mr-2"></span>
        Обновить
      </BtnComponent>
      <BtnComponent class="BtnComponent-cancel" white @click.prevent="maybeClose" :disabled="isSubmitting">
        Отмена
      </BtnComponent>
    </footer>
  </form>
</template>

<script>
import { useDialogBox, useErrorHandler, useMessageToaster, useOverlay, useModal } from '@/composables';
import { isEqual } from 'lodash';
import { mapActions } from 'vuex';
import { reactive } from 'vue';

import FormRow from '../Ui/Form/FormRow.vue';
import TextInput from '../Ui/Form/TextInput.vue';
import CheckBox from '../Ui/Form/CheckBox.vue'; // ✅ ДОБАВЛЕН ИМПОРТ CheckBox
import BtnComponent from '../Ui/Form/BtnComponent.vue';

export default {
  name: 'EditCityForm',

  components: {
    FormRow,
    TextInput,
    CheckBox,      // ✅ ДОБАВЛЕН В КОМПОНЕНТЫ
    BtnComponent
  },

  setup() {
    const { showOverlay, hideOverlay } = useOverlay();
    const { toastSuccess } = useMessageToaster();
    const errorHandler = useErrorHandler('dialog');
    const { showConfirmDialog } = useDialogBox();
    const { getFromContext } = useModal();

    const city = getFromContext('city');

    const updateData = reactive({
      id: city.id,
      name: city.name || '',
      nameTm: city.nameTm || city.name_tm || '', // ✅ Поддержка обеих схем данных
      displayOrder: city.displayOrder || city.display_order || 0,
      isActive: city.isActive !== undefined ? city.isActive :
          (city.is_active !== undefined ? city.is_active : true)
    });

    const originalData = { ...updateData };

    return {
      updateData,
      originalData,
      showOverlay,
      hideOverlay,
      toastSuccess,
      errorHandler,
      showConfirmDialog
    };
  },

  data() {
    return {
      isSubmitting: false
    };
  },

  computed: {
    isFormValid() {
      return this.updateData.name.trim().length >= 2;
    },

    hasChanges() {
      return !isEqual(
          {
            name: this.updateData.name,
            nameTm: this.updateData.nameTm,
            displayOrder: this.updateData.displayOrder,
            isActive: this.updateData.isActive
          },
          {
            name: this.originalData.name,
            nameTm: this.originalData.nameTm,
            displayOrder: this.originalData.displayOrder,
            isActive: this.originalData.isActive
          }
      );
    }
  },

  mounted() {
    document.addEventListener('keydown', this.handleKeydown);
  },

  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown);
  },

  methods: {
    ...mapActions('cities', ['update']),

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
        // ✅ ИСПРАВЛЕНО: Отправляем данные в правильном формате для Backend API
        const cityData = {
          name: this.updateData.name.trim(),
          nameTm: this.updateData.nameTm?.trim() || null,
          displayOrder: this.updateData.displayOrder || 0,
          isActive: this.updateData.isActive
        };

        await this.update({
          cityId: this.updateData.id,
          data: cityData
        });

        this.toastSuccess(`Город "${cityData.name}" успешно обновлен`);
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

      if (await this.showConfirmDialog('Отменить изменения? Все несохраненные изменения будут потеряны.')) {
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
.permissions-section {
  @apply flex items-start gap-3;
}

.permission-label {
  @apply flex flex-col gap-1 cursor-pointer select-none;
}

.permission-label strong {
  @apply text-k-text-primary font-medium;
}

.permission-description {
  @apply text-sm text-k-text-secondary leading-relaxed;
}

.spinner {
  @apply inline-block w-4 h-4 border-2 border-solid border-r-transparent rounded-full animate-spin;
  border-color: currentColor transparent currentColor transparent;
}

.permissions-section:hover .permission-label {
  @apply text-k-text-primary;
}

.permissions-section:hover .permission-description {
  @apply text-k-text-primary;
}

.permissions-section:focus-within .permission-label {
  @apply text-k-accent;
}

@media (max-width: 640px) {
  .permissions-section {
    @apply flex-col gap-2;
  }

  .permission-label {
    @apply gap-0.5;
  }

  .permission-description {
    @apply text-xs;
  }
}
</style>
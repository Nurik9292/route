<template>
  <form @submit.prevent="submit" class="edit-admin-form">
    <header class="form-header">
      <h1>Редактировать администратора</h1>
      <p>Изменение данных администратора "{{ adminData.fullName || adminData.username }}"</p>
    </header>

    <main class="form-content">
      <FormRow>
        <template #label>
          Имя пользователя
          <span class="required">*</span>
        </template>
        <TextInput
            v-model="adminData.username"
            autocomplete="username"
            name="username"
            placeholder="username"
            required
            :error="fieldErrors.username"
            @blur="validateUsername"
            @input="clearFieldError('username')"
        />
        <template #hint>
          От 3 до 20 символов. Только латинские буквы, цифры и подчеркивания.
        </template>
      </FormRow>

      <FormRow>
        <template #label>
          Полное имя
          <span class="required">*</span>
        </template>
        <TextInput
            v-model="adminData.fullName"
            autocomplete="name"
            name="fullName"
            placeholder="Имя Фамилия"
            required
            :error="fieldErrors.fullName"
            @blur="validateFullName"
            @input="clearFieldError('fullName')"
        />
        <template #hint>
          Полное имя администратора для отображения в системе.
        </template>
      </FormRow>

      <!-- Секция смены пароля -->
      <div class="password-section">
        <div class="section-header">
          <h3>Смена пароля</h3>
          <p class="text-sm text-k-text-secondary">Оставьте пустым, если не хотите менять пароль</p>
        </div>

        <FormRow>
          <template #label>
            Новый пароль
          </template>
          <TextInput
              v-model="adminData.password"
              autocomplete="new-password"
              name="password"
              type="password"
              placeholder="Введите новый пароль"
              :error="fieldErrors.password"
              @blur="validatePassword"
              @input="clearFieldError('password')"
          />
          <template #hint>
            Минимум 8 символов. Должен содержать строчные и заглавные буквы, цифры.
          </template>
        </FormRow>

        <FormRow v-if="adminData.password">
          <template #label>
            Подтверждение пароля
            <span class="required">*</span>
          </template>
          <TextInput
              v-model="adminData.confirmPassword"
              autocomplete="new-password"
              name="confirmPassword"
              type="password"
              placeholder="Повторите новый пароль"
              :error="fieldErrors.confirmPassword"
              @blur="validateConfirmPassword"
              @input="clearFieldError('confirmPassword')"
          />
        </FormRow>
      </div>

      <!-- Права доступа -->
      <div class="permissions-section-wrapper">
        <div class="section-header">
          <h3>Права доступа</h3>
        </div>

        <FormRow>
          <div class="permissions-section">
            <CheckBox
                v-model="adminData.isSuperAdmin"
                name="isSuperAdmin"
                id="isSuperAdmin"
            />
            <label for="isSuperAdmin" class="permission-label">
              <strong>Супер-администратор</strong>
              <span class="permission-description">
                Полный доступ к управлению системой, включая управление другими администраторами
              </span>
            </label>
            <TooltipIcon
                title="Супер-администраторы могут управлять пользователями, маршрутами, остановками и всеми настройками системы."
            />
          </div>
        </FormRow>

        <FormRow>
          <div class="permissions-section">
            <CheckBox
                v-model="adminData.isActive"
                name="isActive"
                id="isActive"
            />
            <label for="isActive" class="permission-label">
              <strong>Активный пользователь</strong>
              <span class="permission-description">
                Пользователь может входить в систему
              </span>
            </label>
          </div>
        </FormRow>
      </div>
    </main>

    <footer class="form-footer">
      <div class="button-group">
        <BtnComponent
            type="button"
            secondary
            @click="maybeClose"
            :disabled="loading"
        >
          Отмена
        </BtnComponent>

        <BtnComponent
            type="submit"
            highlight
            :disabled="!isFormValid || loading"
        >
          <Icon v-if="loading" :icon="['fas', 'refresh']" class="animate-spin mr-2" />
          <span v-if="loading">Сохраняем...</span>
          <span v-else>Сохранить изменения</span>
        </BtnComponent>
      </div>
    </footer>

    <div v-if="generalError" class="general-error">
      {{ generalError }}
    </div>
  </form>
</template>

<script>
import { mapActions } from 'vuex';
import { useMessageToaster, useDialogBox } from '@/composables';
import FormRow from '../Ui/Form/FormRow.vue';
import TextInput from '../Ui/Form/TextInput.vue';
import CheckBox from '../Ui/Form/CheckBox.vue';
import BtnComponent from '../Ui/Form/BtnComponent.vue';
import TooltipIcon from '../Ui/TooltipIcon.vue';

export default {
  name: 'AdminEditForm',

  components: {
    FormRow,
    TextInput,
    CheckBox,
    BtnComponent,
    TooltipIcon
  },

  props: {
    admin: {
      type: Object,
      required: true
    }
  },

  emits: ['close', 'success'],

  setup() {
    const { toastSuccess, toastError } = useMessageToaster();
    const { showConfirmDialog } = useDialogBox();

    return {
      toastSuccess,
      toastError,
      showConfirmDialog
    };
  },

  data() {
    return {
      loading: false,
      generalError: null,
      originalData: null,

      adminData: {
        username: '',
        fullName: '',
        password: '',
        confirmPassword: '',
        isSuperAdmin: false,
        isActive: true
      },

      fieldErrors: {
        username: null,
        fullName: null,
        password: null,
        confirmPassword: null
      }
    };
  },

  computed: {
    isFormValid() {
      const basicValid =
          this.adminData.username.trim().length >= 3 &&
          this.adminData.fullName.trim().length >= 2;

      // Если пароль указан, проверяем его валидность
      const passwordValid = !this.adminData.password ||
          (this.adminData.password.length >= 8 &&
              this.adminData.confirmPassword === this.adminData.password);

      const noErrors = Object.values(this.fieldErrors).every(error => !error);

      return basicValid && passwordValid && noErrors;
    },

    hasChanges() {
      if (!this.originalData) return false;

      return (
          this.adminData.username !== this.originalData.username ||
          this.adminData.fullName !== this.originalData.fullName ||
          this.adminData.isSuperAdmin !== this.originalData.isSuperAdmin ||
          this.adminData.isActive !== this.originalData.isActive ||
          this.adminData.password.length > 0
      );
    }
  },

  mounted() {
    this.initializeForm();
  },

  methods: {
    ...mapActions('admin', {
      updateAdmin: 'update'
    }),

    initializeForm() {
      // Сохраняем оригинальные данные для сравнения
      this.originalData = {
        username: this.admin.username || '',
        fullName: this.admin.fullName || this.admin.full_name || this.admin.name || '',
        isSuperAdmin: this.admin.isSuperAdmin || this.admin.is_super_admin || this.admin.admin || false,
        isActive: this.admin.isActive !== false && this.admin.is_active !== false
      };

      // Инициализируем форму
      this.adminData = {
        ...this.originalData,
        password: '',
        confirmPassword: ''
      };
    },

    async submit() {
      if (!this.isFormValid || this.loading) return;

      if (!this.hasChanges) {
        this.toastError('Нет изменений для сохранения');
        return;
      }

      this.validateAllFields();
      if (!this.isFormValid) {
        this.toastError('Пожалуйста, исправьте ошибки в форме');
        return;
      }

      this.loading = true;
      this.generalError = null;

      try {
        const updateData = {
          username: this.adminData.username.trim().toLowerCase(),
          fullName: this.adminData.fullName.trim(),
          isSuperAdmin: this.adminData.isSuperAdmin,
          isActive: this.adminData.isActive
        };

        // Добавляем пароль только если он указан
        if (this.adminData.password.trim()) {
          updateData.password = this.adminData.password;
        }

        await this.updateAdmin({ id: this.admin.id, data: updateData });

        this.toastSuccess(`Администратор "${updateData.fullName}" успешно обновлен`);
        this.$emit('success');

      } catch (error) {
        console.error('Ошибка обновления администратора:', error);

        if (error.response?.status === 409) {
          this.fieldErrors.username = 'Пользователь с таким именем уже существует';
        } else if (error.response?.status === 403) {
          this.generalError = 'Недостаточно прав для выполнения операции';
        } else {
          this.generalError = error.response?.data?.message ||
              error.message ||
              'Ошибка обновления администратора';
        }
      } finally {
        this.loading = false;
      }
    },

    validateUsername() {
      const username = this.adminData.username.trim();

      if (!username) {
        this.fieldErrors.username = 'Имя пользователя обязательно';
      } else if (username.length < 3) {
        this.fieldErrors.username = 'Минимум 3 символа';
      } else if (username.length > 20) {
        this.fieldErrors.username = 'Максимум 20 символов';
      } else if (!/^[a-z0-9_]+$/i.test(username)) {
        this.fieldErrors.username = 'Только латинские буквы, цифры и подчеркивания';
      } else {
        this.fieldErrors.username = null;
      }
    },

    validateFullName() {
      const fullName = this.adminData.fullName.trim();

      if (!fullName) {
        this.fieldErrors.fullName = 'Полное имя обязательно';
      } else if (fullName.length < 2) {
        this.fieldErrors.fullName = 'Минимум 2 символа';
      } else if (fullName.length > 100) {
        this.fieldErrors.fullName = 'Максимум 100 символов';
      } else {
        this.fieldErrors.fullName = null;
      }
    },

    validatePassword() {
      const password = this.adminData.password;

      // Пароль не обязателен при редактировании
      if (!password) {
        this.fieldErrors.password = null;
        this.adminData.confirmPassword = '';
        return;
      }

      if (password.length < 8) {
        this.fieldErrors.password = 'Минимум 8 символов';
      } else if (!/(?=.*[a-z])/.test(password)) {
        this.fieldErrors.password = 'Должен содержать строчные буквы';
      } else if (!/(?=.*[A-Z])/.test(password)) {
        this.fieldErrors.password = 'Должен содержать заглавные буквы';
      } else if (!/(?=.*\d)/.test(password)) {
        this.fieldErrors.password = 'Должен содержать цифры';
      } else {
        this.fieldErrors.password = null;
      }
    },

    validateConfirmPassword() {
      if (this.adminData.password && this.adminData.confirmPassword !== this.adminData.password) {
        this.fieldErrors.confirmPassword = 'Пароли не совпадают';
      } else {
        this.fieldErrors.confirmPassword = null;
      }
    },

    validateAllFields() {
      this.validateUsername();
      this.validateFullName();
      this.validatePassword();
      this.validateConfirmPassword();
    },

    clearFieldError(field) {
      this.fieldErrors[field] = null;
      this.generalError = null;
    },

    async maybeClose() {
      if (this.hasChanges) {
        const confirmed = await this.showConfirmDialog(
            'Закрыть форму?',
            'Все несохраненные изменения будут потеряны.'
        );

        if (!confirmed) return;
      }

      this.close();
    },

    close() {
      // Сброс формы
      this.adminData = {
        username: '',
        fullName: '',
        password: '',
        confirmPassword: '',
        isSuperAdmin: false,
        isActive: true
      };
      this.fieldErrors = {
        username: null,
        fullName: null,
        password: null,
        confirmPassword: null
      };
      this.generalError = null;
      this.loading = false;
      this.originalData = null;

      this.$emit('close');
    }
  }
};
</script>

<style lang="postcss" scoped>
.edit-admin-form {
  @apply max-w-2xl mx-auto;
}

.form-header {
  @apply mb-6 text-center;
}

.form-header h1 {
  @apply text-2xl font-bold text-k-text-primary mb-2;
}

.form-header p {
  @apply text-k-text-secondary;
}

.form-content {
  @apply mb-6 space-y-6;
}

.required {
  @apply text-red-500;
}

.password-section {
  @apply space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg;
}

.permissions-section-wrapper {
  @apply space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-lg;
}

.section-header {
  @apply border-b border-gray-200 pb-2 mb-4;
}

.section-header h3 {
  @apply text-lg font-semibold text-k-text-primary;
}

.permissions-section {
  @apply flex items-start space-x-3 p-3 bg-white rounded border;
}

.permission-label {
  @apply flex flex-col cursor-pointer flex-1;
}

.permission-description {
  @apply text-sm text-k-text-secondary mt-1;
}

.form-footer {
  @apply border-t border-k-bg-secondary pt-4;
}

.button-group {
  @apply flex justify-end space-x-3;
}

.general-error {
  @apply mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm;
}
</style>
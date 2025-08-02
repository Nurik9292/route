<template>
  <form @submit.prevent="submit" class="add-admin-form">
    <header class="form-header w-full flex-1 overflow-hidden flex flex-col">
      <h1>Добавить администратора</h1>
      <p>Создайте новую учетную запись администратора для системы</p>
    </header>

    <main class="form-content">
      <FormRow>
        <template #label>
          Имя пользователя
          <span class="required">*</span>
        </template>
        <TextInput
            v-model="newAdmin.username"
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
            v-model="newAdmin.fullName"
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

      <FormRow>
        <template #label>
          Пароль
          <span class="required">*</span>
        </template>
        <TextInput
            v-model="newAdmin.password"
            autocomplete="new-password"
            name="password"
            type="password"
            placeholder="Введите пароль"
            required
            :error="fieldErrors.password"
            @blur="validatePassword"
            @input="clearFieldError('password')"
        />
        <template #hint>
          Минимум 8 символов. Должен содержать строчные и заглавные буквы, цифры.
        </template>
      </FormRow>

      <FormRow>
        <template #label>
          Подтверждение пароля
          <span class="required">*</span>
        </template>
        <TextInput
            v-model="newAdmin.confirmPassword"
            autocomplete="new-password"
            name="confirmPassword"
            type="password"
            placeholder="Повторите пароль"
            required
            :error="fieldErrors.confirmPassword"
            @blur="validateConfirmPassword"
            @input="clearFieldError('confirmPassword')"
        />
      </FormRow>

      <FormRow>
        <div class="permissions-section">
          <CheckBox
              v-model="newAdmin.isSuperAdmin"
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
              v-model="newAdmin.isActive"
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
          <span v-if="loading">Создаем...</span>
          <span v-else>Создать администратора</span>
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
  name: 'AdminAddForm',

  components: {
    FormRow,
    TextInput,
    CheckBox,
    BtnComponent,
    TooltipIcon
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

      newAdmin: {
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
          this.newAdmin.username.trim().length >= 3 &&
          this.newAdmin.fullName.trim().length >= 2 &&
          this.newAdmin.password.length >= 8 &&
          this.newAdmin.confirmPassword === this.newAdmin.password;

      const noErrors = Object.values(this.fieldErrors).every(error => !error);

      return basicValid && noErrors;
    }
  },

  methods: {
    ...mapActions('admin', {
      createAdmin: 'store'
    }),

    async submit() {
      if (!this.isFormValid || this.loading) return;

      this.validateAllFields();
      if (!this.isFormValid) {
        this.toastError('Пожалуйста, исправьте ошибки в форме');
        return;
      }

      this.loading = true;
      this.generalError = null;

      try {
        const adminData = {
          username: this.newAdmin.username.trim().toLowerCase(),
          fullName: this.newAdmin.fullName.trim(),
          password: this.newAdmin.password,
          isSuperAdmin: this.newAdmin.isSuperAdmin,
          isActive: this.newAdmin.isActive
        };

        await this.createAdmin(adminData);

        this.toastSuccess(`Администратор "${adminData.fullName}" успешно создан`);
        this.$emit('success'); // ✅ УВЕДОМЛЯЕМ ModalWrapper О УСПЕХЕ

      } catch (error) {
        console.error('Ошибка создания администратора:', error);

        if (error.response?.status === 409) {
          this.fieldErrors.username = 'Пользователь с таким именем уже существует';
        } else {
          this.generalError = error.response?.data?.message ||
              error.message ||
              'Ошибка создания администратора';
        }
      } finally {
        this.loading = false;
      }
    },

    validateUsername() {
      const username = this.newAdmin.username.trim();

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
      const fullName = this.newAdmin.fullName.trim();

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
      const password = this.newAdmin.password;

      if (!password) {
        this.fieldErrors.password = 'Пароль обязателен';
      } else if (password.length < 8) {
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
      if (this.newAdmin.confirmPassword !== this.newAdmin.password) {
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
      const hasChanges =
          this.newAdmin.username.trim() ||
          this.newAdmin.fullName.trim() ||
          this.newAdmin.password ||
          this.newAdmin.confirmPassword;

      if (hasChanges) {
        const confirmed = await this.showConfirmDialog(
            'Закрыть форму?',
            'Все введенные данные будут потеряны.'
        );

        if (!confirmed) return;
      }

      this.close();
    },

    close() {
      // Сброс формы
      this.newAdmin = {
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

      this.$emit('close');
    }
  }
};
</script>

<style lang="postcss" scoped>
.add-admin-form {
  @apply max-w-2xl mx-auto;
}

.form-header {
  @apply  mb-6 text-center;
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

.permissions-section {
  @apply flex items-start space-x-3 p-4 rounded-lg border;
  background-color: color-mix(in srgb, var(--color-bg-secondary) 80%, transparent);
  border-color: var(--color-border);
}

.permission-label {
  @apply flex flex-col cursor-pointer flex-1;
}

.permission-description {
  @apply text-sm text-k-text-secondary mt-1;
}

.form-footer {
  @apply border-t pt-4;
  border-color: var(--color-border);
}

.button-group {
  @apply flex justify-end space-x-3;
}

.general-error {
  @apply mt-4 p-3 rounded-lg text-sm;
  background-color: color-mix(in srgb, var(--color-danger) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-danger) 30%, transparent);
  color: var(--color-danger);
}
</style>
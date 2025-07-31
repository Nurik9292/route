<template>
  <form @submit.prevent="submit" @keydown.esc="maybeClose" class="add-user-form">
    <header class="form-header">
      <h1>Добавить нового администратора</h1>
      <p>Создайте учетную запись для нового администратора системы</p>
    </header>

    <main class="form-content space-y-5">
      <FormRow>
        <template #label>
          Имя пользователя
          <span class="required">*</span>
        </template>
        <TextInput
            v-model="newUser.username"
            v-focus
            name="username"
            placeholder="Введите имя пользователя"
            required
            autocomplete="username"
            :error="fieldErrors.username"
            @blur="validateUsername"
            @input="clearFieldError('username')"
        />
        <template #help>Используйте только латинские буквы, цифры и символы _ - .</template>
      </FormRow>

      <FormRow>
        <template #label>
          Полное имя
          <span class="required">*</span>
        </template>
        <TextInput
            v-model="newUser.fullName"
            name="fullName"
            placeholder="Введите полное имя"
            required
            autocomplete="name"
            :error="fieldErrors.fullName"
            @blur="validateFullName"
            @input="clearFieldError('fullName')"
        />
        <template #help>Полное имя отображается в интерфейсе системы</template>
      </FormRow>

      <FormRow>
        <template #label>
          Пароль
          <span class="required">*</span>
        </template>
        <TextInput
            v-model="newUser.password"
            autocomplete="new-password"
            name="password"
            type="password"
            placeholder="Введите пароль"
            required
            :error="fieldErrors.password"
            @blur="validatePassword"
            @input="clearFieldError('password')"
        />
        <template #help>Минимум 8 символов. Должен содержать буквы, цифры и специальные символы.</template>
      </FormRow>

      <FormRow>
        <template #label>
          Подтверждение пароля
          <span class="required">*</span>
        </template>
        <TextInput
            v-model="newUser.confirmPassword"
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
              v-model="newUser.isSuperAdmin"
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
              v-model="newUser.isActive"
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
            :disabled="loading">
          Отмена
        </BtnComponent>

        <BtnComponent
            type="submit"
            highlight
            :disabled="!isFormValid || loading">
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
  name: 'AddUserForm',

  components: {
    FormRow,
    TextInput,
    CheckBox,
    BtnComponent,
    TooltipIcon
  },

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

      newUser: {
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
      return this.newUser.username.trim().length >= 3 &&
          this.newUser.fullName.trim().length >= 2 &&
          this.newUser.password.length >= 8 &&
          this.newUser.confirmPassword === this.newUser.password &&
          Object.values(this.fieldErrors).every(error => !error);
    }
  },

  methods: {
    ...mapActions('admin', {
      createUser: 'store'
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
        const userData = {
          username: this.newUser.username.trim(),
          fullName: this.newUser.fullName.trim(),
          password: this.newUser.password,
          isSuperAdmin: this.newUser.isSuperAdmin,
          isActive: this.newUser.isActive
        };

        const createdUser = await this.createUser(userData);

        this.toastSuccess(`Администратор "\${createdUser.fullName || createdUser.username}" создан успешно`);
                this.close();

            } catch (error) {
                console.error('Ошибка создания пользователя:', error);

                if (error.response?.status === 409) {
                    this.fieldErrors.username = 'Пользователь с таким именем уже существует';
                    this.generalError = 'Пользователь с таким именем уже существует';
                } else if (error.response?.status === 400) {
                    this.generalError = error.response.data?.message || 'Неверные данные';
                } else {
                    this.generalError = 'Произошла ошибка при создании пользователя';
                }

                this.toastError(this.generalError);
            } finally {
                this.loading = false;
            }
        },

        validateUsername() {
            const username = this.newUser.username.trim();

            if (!username) {
                this.fieldErrors.username = 'Обязательное поле';
            } else if (username.length < 3) {
                this.fieldErrors.username = 'Минимум 3 символа';
            } else if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
                this.fieldErrors.username = 'Недопустимые символы';
            } else {
                this.fieldErrors.username = null;
            }
        },

        validateFullName() {
            const fullName = this.newUser.fullName.trim();

            if (!fullName) {
                this.fieldErrors.fullName = 'Обязательное поле';
            } else if (fullName.length < 2) {
                this.fieldErrors.fullName = 'Минимум 2 символа';
            } else {
                this.fieldErrors.fullName = null;
            }
        },

        validatePassword() {
            const password = this.newUser.password;

            if (!password) {
                this.fieldErrors.password = 'Обязательное поле';
            } else if (password.length < 8) {
                this.fieldErrors.password = 'Минимум 8 символов';
            } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
                this.fieldErrors.password = 'Должен содержать строчные, заглавные буквы и цифры';
            } else {
                this.fieldErrors.password = null;
            }
        },

        validateConfirmPassword() {
            if (this.newUser.confirmPassword !== this.newUser.password) {
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
            if (this.generalError) {
                this.generalError = null;
            }
        },

        async maybeClose() {
            const hasChanges = this.newUser.username ||
                              this.newUser.fullName ||
                              this.newUser.password;

            if (hasChanges) {
                const confirmed = await this.showConfirmDialog(
                    'Отменить создание пользователя?',
                    'Все введенные данные будут потеряны.'
                );

                if (!confirmed) return;
            }

            this.close();
        },

        close() {
            this.$emit('close');
        }
    }
}
</script>

<style scoped>
.add-user-form {
  @apply max-w-2xl mx-auto;
}

.form-header {
  @apply mb-6 text-center;
}

.form-header h1 {
  @apply text-2xl font-bold text-gray-900 mb-2;
}

.form-header p {
  @apply text-gray-600;
}

.form-content {
  @apply mb-6;
}

.required {
  @apply text-red-500;
}

.permissions-section {
  @apply flex items-start space-x-3 p-3 bg-gray-50 rounded-lg;
}

.permission-label {
  @apply flex flex-col cursor-pointer;
}

.permission-description {
  @apply text-sm text-gray-600 mt-1;
}

.form-footer {
  @apply border-t pt-4;
}

.button-group {
  @apply flex justify-end space-x-3;
}

.general-error {
  @apply mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800;
}
</style>
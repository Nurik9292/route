<template>
  <form @submit.prevent="submit" @keydown.esc="maybeClose" class="edit-user-form">
    <header class="form-header">
      <h1>Редактировать администратора</h1>
      <p>Изменение данных пользователя: {{ originalUser.fullName || originalUser.username }}</p>
    </header>

    <main class="form-content space-y-5">
      <FormRow>
        <template #label>
          Имя пользователя
          <span class="required">*</span>
        </template>
        <TextInput
            v-model="updateData.username"
            v-focus
            name="username"
            required
            :error="fieldErrors.username"
            @blur="validateUsername"
            @input="clearFieldError('username')"
        />
      </FormRow>

      <FormRow>
        <template #label>
          Полное имя
          <span class="required">*</span>
        </template>
        <TextInput
            v-model="updateData.fullName"
            name="fullName"
            required
            :error="fieldErrors.fullName"
            @blur="validateFullName"
            @input="clearFieldError('fullName')"
        />
      </FormRow>

      <FormRow>
        <template #label>Новый пароль</template>
        <TextInput
            v-model="updateData.password"
            autocomplete="new-password"
            name="password"
            type="password"
            placeholder="Оставьте пустым, чтобы не менять пароль"
            :error="fieldErrors.password"
            @blur="validatePassword"
            @input="clearFieldError('password')"
        />
        <template #help>Минимум 8 символов, если хотите изменить пароль</template>
      </FormRow>

      <FormRow v-if="updateData.password">
        <template #label>
          Подтверждение пароля
          <span class="required">*</span>
        </template>
        <TextInput
            v-model="updateData.confirmPassword"
            autocomplete="new-password"
            name="confirmPassword"
            type="password"
            placeholder="Повторите новый пароль"
            required
            :error="fieldErrors.confirmPassword"
            @blur="validateConfirmPassword"
            @input="clearFieldError('confirmPassword')"
        />
      </FormRow>

      <FormRow v-if="canEditPermissions">
        <div class="permissions-section">
          <CheckBox
              v-model="updateData.isSuperAdmin"
              name="isSuperAdmin"
              id="editIsSuperAdmin"
          />
          <label for="editIsSuperAdmin" class="permission-label">
            <strong>Супер-администратор</strong>
            <span class="permission-description">
                            Полный доступ к управлению системой
                        </span>
          </label>
          <TooltipIcon
              title="Только супер-администраторы могут изменить права доступа других пользователей"
          />
        </div>
      </FormRow>

      <FormRow v-if="canEditPermissions">
        <div class="permissions-section">
          <CheckBox
              v-model="updateData.isActive"
              name="isActive"
              id="editIsActive"
          />
          <label for="editIsActive" class="permission-label">
            <strong>Активный пользователь</strong>
            <span class="permission-description">
                            Пользователь может входить в систему
                        </span>
          </label>
        </div>
      </FormRow>

      <div v-if="!updateData.isActive && originalUser.isActive" class="warning-message">
        ⚠️ Внимание: Деактивация пользователя заблокирует его доступ к системе
      </div>
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
            :disabled="!isFormValid || !hasChanges || loading">
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
import { isEqual } from 'lodash';
import { reactive, watch } from 'vue';
import { useDialogBox, useErrorHandler, useModal, useMessageToaster, useOverlay } from '@/composables';
import { mapActions } from 'vuex';

import BtnComponent from '../Ui/Form/BtnComponent.vue';
import TooltipIcon from '../Ui/TooltipIcon.vue';
import CheckBox from '../Ui/Form/CheckBox.vue';
import TextInput from '../Ui/Form/TextInput.vue';
import FormRow from '../Ui/Form/FormRow.vue';

export default {
    name: 'EditUserForm',

    components: {
        BtnComponent,
        TooltipIcon,
        CheckBox,
        TextInput,
        FormRow
    },

    setup() {
        const { showOverlay, hideOverlay } = useOverlay();
        const { toastSuccess } = useMessageToaster();
        const { showConfirmDialog } = useDialogBox();
        const user = useModal().getFromContext('user');
        const originalData = {
          name: user.name,
          isAdmin: user.isAdmin
        }

        return {
            showConfirmDialog,
            showOverlay,
            hideOverlay,
            toastSuccess,
            originalData,
            user
        }
    },

    data() {
        return {
          updateData: reactive({ ...this.originalData }),
        }
  },

    created() {
        watch(
            () => this.user,
            () => {
              this.originalData = {
                name: this.user.name,
                isAdmin: this.user.isAdmin
              }
              this.updateData = reactive({ ...this.originalData })
            },
            { immediate: true }
        )
    },

    methods: {
        ...mapActions('user', ['update']),

        async submit() {
            this.showOverlay();

            try {  
                await this.update({userId: this.user.id, data: this.updateData});
                this.toastSuccess('Пользователь обновлен');
                this.close();
            } catch (error) {
                useErrorHandler('dialog').handleHttpError(error);
            } finally {
                this.hideOverlay();
            }
        },

        close() {
            this.$emit('close');
        },

        async maybeClose() {
            if (isEqual(this.originalData, this.updateData)) {
                this.close();
                return;
            }

            if (await this.showConfirmDialog('Отменить все изменения?')) {
                this.close();
            }
        }
    }
}
</script>


<script>
import { mapActions, mapGetters } from 'vuex';
import { useMessageToaster, useDialogBox } from '@/composables';
import FormRow from '../Ui/Form/FormRow.vue';
import TextInput from '../Ui/Form/TextInput.vue';
import CheckBox from '../Ui/Form/CheckBox.vue';
import BtnComponent from '../Ui/Form/BtnComponent.vue';
import TooltipIcon from '../Ui/TooltipIcon.vue';

export default {
  name: 'EditUserForm',

  components: {
    FormRow,
    TextInput,
    CheckBox,
    BtnComponent,
    TooltipIcon
  },

  props: {
    user: {
      type: Object,
      required: true
    }
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
      originalUser: { ...this.user },

      updateData: {
        username: this.user.username || '',
        fullName: this.user.fullName || this.user.name || '',
        password: '',
        confirmPassword: '',
        isSuperAdmin: this.user.isSuperAdmin || this.user.is_super_admin || this.user.admin || false,
        isActive: this.user.isActive !== false
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
    ...mapGetters('admin', ['currentUser', 'isSuperAdmin']),

    canEditPermissions() {
      return this.isSuperAdmin && this.user.id !== this.currentUser?.id;
    },

    isFormValid() {
      const hasRequiredFields = this.updateData.username.trim().length >= 3 &&
          this.updateData.fullName.trim().length >= 2;

      const passwordValid = !this.updateData.password ||
          (this.updateData.password.length >= 8 &&
              this.updateData.password === this.updateData.confirmPassword);

      const noErrors = Object.values(this.fieldErrors).every(error => !error);

      return hasRequiredFields && passwordValid && noErrors;
    },

    hasChanges() {
      return this.updateData.username !== this.originalUser.username ||
          this.updateData.fullName !== (this.originalUser.fullName || this.originalUser.name) ||
          this.updateData.password.length > 0 ||
          this.updateData.isSuperAdmin !== (this.originalUser.isSuperAdmin || this.originalUser.is_super_admin || this.originalUser.admin) ||
          this.updateData.isActive !== (this.originalUser.isActive !== false);
    }
  },

  methods: {
    ...mapActions('admin', {
      updateUser: 'update'
    }),

    async submit() {
      if (!this.isFormValid || !this.hasChanges || this.loading) return;

      this.validateAllFields();
      if (!this.isFormValid) {
        this.toastError('Пожалуйста, исправьте ошибки в форме');
        return;
      }

      this.loading = true;
      this.generalError = null;

      try {
        const updatePayload = {
          username: this.updateData.username.trim(),
          fullName: this.updateData.fullName.trim(),
          isSuperAdmin: this.updateData.isSuperAdmin,
          isActive: this.updateData.isActive
        };

        if (this.updateData.password) {
          updatePayload.password = this.updateData.password;
        }

        const updatedUser = await this.updateUser({
          id: this.user.id,
          data: updatePayload
        });

        this.toastSuccess(`Пользователь "\${updatedUser.fullName || updatedUser.username}" обновлен успешно`);
                this.close();

            } catch (error) {
                console.error('Ошибка обновления пользователя:', error);

                if (error.response?.status === 409) {
                    this.fieldErrors.username = 'Пользователь с таким именем уже существует';
                    this.generalError = 'Пользователь с таким именем уже существует';
                } else if (error.response?.status === 400) {
                    this.generalError = error.response.data?.message || 'Неверные данные';
                } else if (error.response?.status === 403) {
                    this.generalError = 'У вас нет прав для изменения этого пользователя';
                } else {
                    this.generalError = 'Произошла ошибка при обновлении пользователя';
                }

                this.toastError(this.generalError);
            } finally {
                this.loading = false;
            }
        },


        validateUsername() {
            const username = this.updateData.username.trim();

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
            const fullName = this.updateData.fullName.trim();

            if (!fullName) {
                this.fieldErrors.fullName = 'Обязательное поле';
            } else if (fullName.length < 2) {
                this.fieldErrors.fullName = 'Минимум 2 символа';
            } else {
                this.fieldErrors.fullName = null;
            }
        },

        validatePassword() {
            const password = this.updateData.password;

            if (password && password.length > 0) {
                if (password.length < 8) {
                    this.fieldErrors.password = 'Минимум 8 символов';
                } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
                    this.fieldErrors.password = 'Должен содержать строчные, заглавные буквы и цифры';
                } else {
                    this.fieldErrors.password = null;
                }
            } else {
                this.fieldErrors.password = null;
            }
        },

        validateConfirmPassword() {
            if (this.updateData.password && this.updateData.confirmPassword !== this.updateData.password) {
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
            if (this.hasChanges) {
                const confirmed = await this.showConfirmDialog(
                    'Отменить изменения?',
                    'Все несохраненные изменения будут потеряны.'
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
.edit-user-form {
  @apply max-w-2xl mx-auto;
}

.warning-message {
  @apply p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm;
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
<template>
  <form data-testid="update-profile-form" @submit.prevent="update">
    <div class="flex flex-col gap-3 md:flex-row md:gap-8 w-full md:w-[640px]">
      <div class="flex-1 space-y-5">

        <FormRow>
          <template #label>Имя пользователя</template>
          <TextInput
              v-model="profile.name"
              data-testid="name"
              name="name"
              placeholder="Введите имя пользователя"
              :class="{ 'input-error': fieldErrors.name }"
              @blur="validateName"
              @input="clearFieldError('name')"
          />
          <template #help>
            Логин для входа в систему (3-20 символов)
          </template>
          <div v-if="fieldErrors.name" class="text-red-600 text-sm mt-1">
            {{ fieldErrors.name }}
          </div>
        </FormRow>

        <FormRow>
          <template #label>Полное имя *</template>
          <TextInput
              v-model="profile.fullName"
              data-testid="fullName"
              name="full_name"
              placeholder="Введите ваше полное имя"
              required
              :class="{ 'input-error': fieldErrors.fullName }"
              @blur="validateFullName"
              @input="clearFieldError('fullName')"
          />
          <template #help>
            Полное имя будет отображаться в интерфейсе
          </template>
          <div v-if="fieldErrors.fullName" class="text-red-600 text-sm mt-1">
            {{ fieldErrors.fullName }}
          </div>
        </FormRow>

        <FormRow>
          <template #label>Новый Пароль (необязательно)</template>
          <PasswordField
              v-model="profile.newPassword"
              autocomplete="new-password"
              data-testid="newPassword"
              minlength="8"
              placeholder="Оставьте пустым, чтобы не менять пароль"
              :class="{ 'input-error': fieldErrors.newPassword }"
              @blur="validateNewPassword"
              @input="clearFieldError('newPassword')"
          />
          <template #help>
            Если хотите изменить пароль: минимум 8 символов, буквы и цифры.
          </template>
          <div v-if="fieldErrors.newPassword" class="text-red-600 text-sm mt-1">
            {{ fieldErrors.newPassword }}
          </div>
        </FormRow>
      </div>

      <div>
        <EditableProfileAvatar :profile="profile" />
      </div>
    </div>

    <footer class="mt-8 flex gap-3">
      <BtnComponent
          class="btn-submit"
          type="submit"
          :disabled="!isFormValid || loading"
          highlight
      >
        <Icon v-if="loading" :icon="['fas', 'refresh']" class="animate-spin mr-2" />
        {{ loading ? 'Сохраняем...' : 'Сохранить профиль' }}
      </BtnComponent>

      <BtnComponent
          type="button"
          secondary
          @click="resetForm"
          :disabled="loading"
      >
        Отменить изменения
      </BtnComponent>
    </footer>

    <div v-if="generalError" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
      <div class="flex items-center">
        <Icon :icon="['fas', 'exclamation-triangle']" class="text-red-500 mr-2" />
        <p class="text-red-700 text-sm">{{ generalError }}</p>
      </div>
    </div>

    <div v-if="successMessage" class="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
      <div class="flex items-center">
        <Icon :icon="['fas', 'check-circle']" class="text-green-500 mr-2" />
        <p class="text-green-700 text-sm">{{ successMessage }}</p>
      </div>
    </div>
  </form>
</template>

<script>
import { mapActions } from 'vuex';
import { useAuthorization, useErrorHandler, useMessageToaster } from '@/composables';
import BtnComponent from '../Ui/Form/BtnComponent.vue';
import PasswordField from '../Ui/Form/PasswordField.vue';
import EditableProfileAvatar from './EditableProfileAvatar.vue';
import TextInput from '../Ui/Form/TextInput.vue';
import FormRow from '../Ui/Form/FormRow.vue';

export default {
  name: 'ProfileForm',

  components: {
    BtnComponent,
    PasswordField,
    EditableProfileAvatar,
    TextInput,
    FormRow,
  },

  setup() {
    const { currentAdmin } = useAuthorization();

    return {
      currentAdmin
    }
  },

  data() {
    return {
      profile: {
        id: null,
        name: '',
        fullName: '',
        avatar: null,
        newPassword: ''
      },

      originalProfile: {},
      loading: false,
      generalError: null,
      successMessage: null,

      fieldErrors: {
        name: null,
        fullName: null,
        newPassword: null
      }
    }
  },

  computed: {

    isFormValid() {
      const hasValidFields = this.validateName() &&
          this.validateFullName() &&
          this.validateNewPassword();
      const hasChanges = this.hasProfileChanges;
      return hasValidFields && hasChanges;
    },

    hasProfileChanges() {
      return (
          this.profile.name !== this.originalProfile.name ||
          this.profile.fullName !== this.originalProfile.fullName ||
          this.profile.avatar !== this.originalProfile.avatar ||
          (this.profile.newPassword && this.profile.newPassword.trim())
      );
    }
  },

  methods: {
    ...mapActions('admin', [
        'fetchAvatar',
        'updateCurrentAdmin',
        'removeCurrentAdminAvatar',
        'updateCurrentAdminAvatar'
    ]),

    async update() {
      if (!this.isFormValid) return;

      this.loading = true;
      this.generalError = null;
      this.successMessage = null;

      console.log('update', this.profile)

      try {
        if (this.profile.avatar !== this.originalProfile.avatar) {
          console.log('🖼️ Avatar changed, updating...');
          const avatarResult = await this.updateAvatar(this.profile.avatar);
          console.log('✅ Avatar API result:', avatarResult);

        }


        const updateData = {
          id: this.profile.id,
          username: this.profile.name,
          full_name: this.profile.fullName,
        };

        if (this.profile.newPassword && this.profile.newPassword.trim()) {
          updateData.newPassword = this.profile.newPassword;
        }

        console.log('📝 Updating profile data:', updateData);
        const response = await this.updateCurrentAdmin(updateData);
        console.log('✅ Profile update response:', response);

        await this.$nextTick(() => {
          console.log('🔄 Updating profile from currentAdmin:', this.currentAdmin);
          this.profile = {
            id: this.currentAdmin.id,
            name: this.currentAdmin.username,
            fullName: this.currentAdmin.fullName,
            avatar: this.currentAdmin.avatar,
            newPassword: ''
          };

          this.originalProfile = {...this.profile};
          console.log('✅ Profile updated locally:', this.profile);
        });

        this.successMessage = 'Профиль успешно обновлен!';
        const { toastSuccess } = useMessageToaster();
        toastSuccess('Профиль обновлен.');

      } catch (error) {
        console.error('Profile update error:', error);
        this.generalError = error.response?.data?.message || error.message || 'Ошибка обновления профиля';
        const { toastError } = useMessageToaster();
        toastError(this.generalError);
      } finally {
        this.loading = false;
      }
    },

    async updateAvatar(avatarData) {
      try {
        console.log('avatar', avatarData)
        if (avatarData === null) {
          await this.removeCurrentAdminAvatar();
        } else {
          await this.updateCurrentAdminAvatar({ avatar: avatarData });
        }
      } catch (error) {
        console.error('Avatar update error:', error);
        throw new Error('Не удалось обновить аватар: ' + (error.response?.data?.message || error.message));
      }
    },


    handleUpdateError(error) {
      if (error.response?.status === 400) {
        const validationErrors = error.response.data.errors || {};


        if (validationErrors.currentPassword) {
          this.fieldErrors.currentPassword = 'Неверный текущий пароль';
        }
        if (validationErrors.name) {
          this.fieldErrors.name = validationErrors.name;
        }
        if (validationErrors.fullName || validationErrors.full_name) {
          this.fieldErrors.fullName = validationErrors.fullName || validationErrors.full_name;
        }
        if (validationErrors.newPassword) {
          this.fieldErrors.newPassword = validationErrors.newPassword;
        }


        if (!Object.keys(validationErrors).length) {
          this.generalError = error.response.data.message || 'Ошибка валидации данных';
        }
      } else if (error.response?.status === 401) {
        this.fieldErrors.currentPassword = 'Неверный текущий пароль';
      } else if (error.response?.status === 403) {
        this.generalError = 'Недостаточно прав для изменения профиля';
      } else {
        this.generalError = error.response?.data?.message ||
            error.message ||
            'Произошла ошибка при обновлении профиля';
      }
    },


    validateName() {
      const name = this.profile.name?.trim();
      if (!name) {
        this.fieldErrors.name = 'Имя пользователя обязательно';
        return false;
      }
      if (name.length < 3) {
        this.fieldErrors.name = 'Минимум 3 символа';
        return false;
      }
      if (name.length > 20) {
        this.fieldErrors.name = 'Максимум 20 символов';
        return false;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(name)) {
        this.fieldErrors.name = 'Только латинские буквы, цифры и подчеркивания';
        return false;
      }
      this.fieldErrors.name = null;
      return true;
    },

    validateFullName() {
      const fullName = this.profile.fullName?.trim();
      if (!fullName) {
        this.fieldErrors.fullName = 'Полное имя обязательно';
        return false;
      }
      if (fullName.length < 2) {
        this.fieldErrors.fullName = 'Минимум 2 символа';
        return false;
      }
      if (fullName.length > 100) {
        this.fieldErrors.fullName = 'Максимум 100 символов';
        return false;
      }
      this.fieldErrors.fullName = null;
      return true;
    },

    validateNewPassword() {
      const password = this.profile.newPassword;
      if (!password || !password.trim()) {
        this.fieldErrors.newPassword = null;
        return true;
      }

      if (password.length < 8) {
        this.fieldErrors.newPassword = 'Минимум 8 символов';
        return false;
      }

      if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
        this.fieldErrors.newPassword = 'Должен содержать буквы и цифры';
        return false;
      }

      this.fieldErrors.newPassword = null;
      return true;
    },

    clearFieldError(field) {
      this.fieldErrors[field] = null;
      this.generalError = null;
    },

    getAuthToken() {

      return localStorage.getItem('api_token') || '';
    },

    resetForm() {

      this.profile = {
        id: this.originalProfile.id,
        name: this.originalProfile.name,
        fullName: this.originalProfile.fullName,
        avatar: this.originalProfile.avatar,
        currentPassword: '',
        newPassword: ''
      };


      this.fieldErrors = {
        currentPassword: null,
        name: null,
        fullName: null,
        newPassword: null
      };

      this.generalError = null;
      this.successMessage = null;
    },

    async initializeProfile() {
      if (!this.currentAdmin) {
        console.warn('No current admin found');
        return;
      }

      console.log('init current', this.currentAdmin);

      this.profile = {
        id: this.currentAdmin.id,
        name: this.currentAdmin.username || this.currentAdmin.name || '',
        fullName: this.currentAdmin.fullName || this.currentAdmin.full_name || '',
        avatar: this.currentAdmin.avatar,
        currentPassword: '',
        newPassword: ''
      };


      this.originalProfile = {
        id: this.profile.id,
        name: this.profile.name,
        fullName: this.profile.fullName,
        avatar: this.profile.avatar
      };
    }
  },

  async mounted() {
    await this.initializeProfile();
  },

  watch: {
    currentAdmin: {
      handler(newAdmin) {
        if (newAdmin) {
          this.initializeProfile();
        }
      },
      immediate: true
    }
  }
}
</script>

<style scoped>
.btn-submit:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.input-error {
  @apply border-red-300 focus:border-red-500 focus:ring-red-200 focus:ring-opacity-50;
}

.input-error:focus {
  @apply outline-none;
}

@media (max-width: 768px) {
  .flex-row {
    @apply flex-col gap-4;
  }

  .btn-submit,
  .btn-secondary {
    @apply w-full;
  }
}
</style>
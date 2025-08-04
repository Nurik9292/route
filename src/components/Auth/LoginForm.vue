<template>
  <div class="flex items-center justify-center min-h-screen my-0 mx-auto flex-col gap-5">

    <div v-if="showBranding" class="login-header text-center mb-4">
      <div class="logo-icon text-4xl mb-2">🚌</div>
      <h1 class="app-title text-white text-xl font-bold mb-1">
        Система Управления Автобусными Маршрутами
      </h1>
      <p class="app-subtitle text-blue-200 text-sm">Туркменистан</p>
    </div>

    <form
        v-show="!showingForgotPasswordForm"
        :class="{ error: failed }"
        class="w-full sm:w-[288px] sm:border duration-500 p-7 rounded-xl border-transparent sm:bg-white/10 space-y-3"
        data-testid="login-form"
        @submit.prevent="login">

      <div class="text-center mb-8">
        <img alt="Ugur logo" class="inline-block" :src="logo()" width="156" />
      </div>

      <FormRow>
        <TextInput
            v-model="credentials.username"
            autofocus
            placeholder="Имя пользователя"
            required
            autocomplete="username"
            :disabled="loading"
        />
      </FormRow>

      <FormRow>
        <PasswordField
            v-model="credentials.password"
            placeholder="Пароль"
            required
            autocomplete="current-password"
            :disabled="loading"
        />
      </FormRow>

      <FormRow>
        <BtnComponent
            data-testid="submit"
            type="submit"
            :disabled="loading || !isFormValid"
            class="w-full">
          <span v-if="loading">Входим...</span>
          <span v-else>Войти в систему</span>
        </BtnComponent>
      </FormRow>

      <FormRow v-if="canResetPassword">
        <button
            type="button"
            class="text-sm text-blue-300 hover:text-blue-100 underline"
            @click="showForgotPasswordForm">
          Забыли пароль?
        </button>
      </FormRow>
    </form>

    <div v-if="showBranding" class="login-footer text-center text-white text-xs mt-8">
      <p>&copy; 2025 Система Управления Транспортом</p>
    </div>
  </div>
</template>

<script>
import { authService } from '@/services';
import { logger } from '@/utils';
import { useMessageToaster } from '@/composables';
import { defaultLogo } from '@/utils';

import BtnComponent from '../Ui/Form/BtnComponent.vue';
import PasswordField from '../Ui/Form/PasswordField.vue';
import TextInput from '../Ui/Form/TextInput.vue';
import FormRow from '../Ui/Form/FormRow.vue';

export default {
  name: 'LoginForm',

  components: {
    BtnComponent,
    PasswordField,
    TextInput,
    FormRow,
  },

  setup() {
    const { toastError, toastSuccess } = useMessageToaster();
    return { toastError, toastSuccess };
  },

  data() {
    return {
      credentials: {
        username: '',
        password: ''
      },

      failed: false,
      loading: false,
      showingForgotPasswordForm: false,

      canResetPassword: window.MAILER_CONFIGURED || false,
      ssoProviders: window.SSO_PROVIDERS || [],
      showBranding: true
    };
  },

  computed: {
    isFormValid() {
      return this.credentials.username.trim().length >= 2 &&
          this.credentials.password.length >= 3;
    },

    username: {
      get() { return this.credentials.username; },
      set(value) { this.credentials.username = value; }
    },

    password: {
      get() { return this.credentials.password; },
      set(value) { this.credentials.password = value; }
    }
  },

  methods: {

    async login() {
      if (this.loading || !this.isFormValid) return;

      this.loading = true;
      this.failed = false;

      try {
        logger.info('🔐 Попытка входа для пользователя:', this.credentials.username);

        const adminData = await authService.login(
            this.credentials.username.trim(),
            this.credentials.password
        );

        console.log(adminData);

        logger.info('✅ Вход выполнен успешно');

        this.credentials.password = '';
        this.toastSuccess('Добро пожаловать!');

        const userData = adminData ||
            window.__current_user__ ||
            authService.getAdminData();

        if (userData) {
          logger.info('📤 Отправляем данные пользователя:', userData.username);
          this.$emit('loggedin', userData);
        } else {
          logger.error('❌ Нет данных пользователя для передачи');
          try {
            const currentAdmin = await authService.getCurrentAdmin();
            this.$emit('loggedin', currentAdmin);
          } catch (error) {
            logger.error('❌ Не удалось получить данные текущего пользователя:', error);
            this.$emit('loggedin', null);
          }
        }

      } catch (error) {
        logger.error('❌ Ошибка входа:', error);
        this.handleLoginError(error);

      } finally {
        this.loading = false;
      }
    },

    handleLoginError(error) {
      this.failed = true;

      let errorMessage = 'Ошибка входа в систему';

      if (error.response?.status === 401) {
        errorMessage = 'Неверное имя пользователя или пароль';

      } else if (error.response?.status === 403) {
        errorMessage = 'Доступ запрещен';

      } else if (error.response?.status === 429) {
        errorMessage = 'Слишком много попыток. Подождите';

      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network')) {
        errorMessage = 'Нет связи с сервером';

      } else {
        errorMessage = 'Произошла ошибка';
      }

      this.toastError(errorMessage);

      setTimeout(() => {
        this.failed = false;
      }, 2000);

      this.credentials.password = '';
    },

    showForgotPasswordForm() {
      this.showingForgotPasswordForm = true;
    },

    onSSOError(error) {
      logger.error('SSO error: ', error);
      this.toastError('Ошибка входа через SSO');
    },

    onSSOSuccess(token) {
      authService.setApiToken(token);
      this.$emit('loggedin');
    },

    logo() {
      return defaultLogo;
    }
  },
};
</script>

<style lang="postcss" scoped>
@keyframes shake {
  8%, 41% { transform: translateX(-10px); }
  25%, 58% { transform: translateX(10px); }
  75% { transform: translateX(-5px); }
  92% { transform: translateX(5px); }
  0%, 100% { transform: translateX(0); }
}

form.error {
  @apply border-red-500;
  animation: shake .5s;
}

.logo-icon {
  @apply text-4xl mb-2;
}

@media (max-width: 640px) {
  .app-title { @apply text-lg; }
  .logo-icon { @apply text-3xl; }
}

@media (prefers-reduced-motion: reduce) {
  form.error {
    animation: none;
    @apply border-red-500;
  }
}
</style>
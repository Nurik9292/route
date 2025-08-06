<template>
  <OverlayComponent ref="overlay" />
  <DialogBox ref="dialog" />
  <MessageToaster ref="toaster" />
  <GlobalEventListeners />

  <main v-if="layout === 'main' && initialized"
        class="absolute md:relative top-0 h-full md:h-screen pt-k-header-height md:pt-0 w-full md:w-auto flex flex-col justify-end"
        @dragend="onDragEnd"
        @dragleave="onDragLeave"
        @dragover="onDragOver"
        @drop="onDrop">
    <HotkeyListener />
    <MainWrapper />
  </main>

  <LoginForm v-if="layout === 'auth'" @loggedin="onUserLoggedIn" />

  <AppInitializer v-if="authenticated" @error="onInitError" @success="onInitSuccess" />
</template>

<script>
import { defineAsyncComponent, computed } from 'vue';
import { useRouter } from './composables';
import { authService } from './services';
import { logger } from "@/utils/index.js";
import { MessageToasterKey, OverlayKey, DialogBoxKey } from './symbols';
import { mapActions } from "vuex";

import OverlayComponent from './components/Ui/OverlayComponent.vue';
import DialogBox from './components/Ui/DialogBox.vue';
import MessageToaster from './components/Ui/Toaster/MessageToaster.vue';
import GlobalEventListeners from './components/Utils/GlobalEventListeners.vue';
import AppInitializer from './components/Utils/AppInitializer.vue';

export default {
  name: 'App',

  components: {
    OverlayComponent,
    DialogBox,
    MessageToaster,
    HotkeyListener: defineAsyncComponent(() => import('./components/Utils/HotkeyListener.vue')),
    LoginForm: defineAsyncComponent(() => import('./components/Auth/LoginForm.vue')),
    MainWrapper: defineAsyncComponent(() => import('./components/MainWrapper/MainWrapper.vue')),
    GlobalEventListeners,
    AppInitializer
  },

  data() {
    return {
      authenticated: false,
      initialized: false,
      layout: 'auth',
      showDropZone: false,
    };
  },

  async mounted() {
    await this.initializeApp();
    await this.scheduleTokenRefresh();

    window.addEventListener('401-error', () => {
      this.onUserLoggedOut();
    });
  },

  methods: {
    ...mapActions('admin', ['init']),

    async initializeApp() {
      try {
        console.log('🔄 Инициализация App.vue...');


        const token = authService.getApiToken();
        const savedUser = authService.getAdminData();

        if (token && savedUser) {
          console.log('✅ Найдена действующая сессия');
          await this.onUserAuthenticated();
        } else {
          console.log('ℹ️ Показываем форму входа');
          await this.showAuthForm();
        }

      } catch (error) {
        logger.error('❌ Ошибка инициализации App:', error);
        await this.showAuthForm();
      }
    },

    async onUserAuthenticated() {
      try {
        const currentUser =  authService.getAdminData();

        console.log("App App", currentUser)
        if (!currentUser || !currentUser.isActive) {
          throw new Error('Некорректные данные пользователя');
        }

        logger.info('👤 Инициализируем пользователя:', currentUser.username);

        await this.init(currentUser);

        this.authenticated = true;
        this.initialized = true;
        this.layout = 'main';

        logger.info('✅ Пользователь аутентифицирован');

      } catch (error) {
        logger.error('❌ Ошибка аутентификации:', error);
        await this.showAuthForm();
      }
    },

    async showAuthForm() {
      this.authenticated = false;
      this.initialized = false;
      this.layout = 'auth';

      const currentHash = window.location.hash;
      if (!currentHash.includes('/login') && !currentHash.includes('/sign-in')) {
        useRouter().go('/login');
      }

      document.documentElement.classList.add(
          navigator.userAgent.includes('Mac') ? 'mac' : 'non-mac'
      );
    },

    async onUserLoggedIn(userData) {
      try {
        logger.info('🔐 Обработка входа...');

        const currentUser = userData || authService.getAdminData();
        if (!currentUser?.username) {
          throw new Error('Нет данных пользователя');
        }

        await this.onUserAuthenticated();

      } catch (error) {
        logger.error('❌ Ошибка входа:', error);
        this.$refs.toaster?.error(`Ошибка входа: ${error.message}`);
        this.onInitError(error);
      }
    },

    async onUserLoggedOut() {
      logger.info('🚪 Выход из системы');

      await authService.logout();

      this.authenticated = false;
      this.initialized = false;
      this.layout = 'auth';
    },

    async scheduleTokenRefresh() {
      setInterval(async () => {
        if (authService.shouldRefreshToken()) {
          try {
            logger.info('🔄 Обновление токена...');
            await authService.refreshToken();
          } catch (error) {
            logger.error('❌ Ошибка обновления токена:', error);
            await this.onUserLoggedOut();
          }
        }
      }, 60000);
    },

    onInitError(error) {
      logger.error('❌ Ошибка инициализации:', error);
      this.authenticated = false;
      this.initialized = false;
      this.layout = 'auth';
      this.$refs.toaster?.error('Ошибка загрузки приложения');
    },

    onInitSuccess() {
      logger.info('✅ Инициализация завершена успешно');
    },

    onDragOver(e) {
      this.showDropZone = e.dataTransfer?.types.includes('Files') &&
          !this.isCurrentScreen('Upload');
    },

    onDragEnd() {
      this.showDropZone = false;
    },

    onDragLeave(e) {
      if (e.currentTarget.contains(e.relatedTarget)) return;
      this.showDropZone = false;
    },

    onDrop() {
      this.showDropZone = false;
    },

    async resolveRoute() {
      const { resolveRoute } = useRouter();
      return await resolveRoute();
    },

    getCurrentScreen() {
      const { getCurrentScreen } = useRouter();
      return getCurrentScreen();
    },

    isCurrentScreen(screen) {
      const { isCurrentScreen } = useRouter();
      return isCurrentScreen(screen);
    },
  },

  provide() {
    return {
      [OverlayKey]: computed(() => this.$refs.overlay),
      [DialogBoxKey]: computed(() => this.$refs.dialog),
      [MessageToasterKey]: computed(() => this.$refs.toaster)
    };
  },
};
</script>

<style lang="postcss">
#dragGhost {
  @apply inline-block py-2 pl-8 pr-3 rounded-md text-base font-sans fixed top-0 left-0 z-[-1] bg-k-success text-k-text-primary no-hover:hidden;
}

#copyArea {
  @apply absolute -left-full bottom-px w-px h-px no-hover:hidden;
}
</style>
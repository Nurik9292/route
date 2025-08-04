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


<!--  <div v-if="isInitializing" class="loading-overlay">-->
<!--    <div class="loading-spinner">-->
<!--      <div class="spinner"></div>-->
<!--      <p>{{ initializationMessage }}</p>-->
<!--    </div>-->
<!--  </div>-->
</template>

<script>
import { defineAsyncComponent, computed } from 'vue';
import { useRouter } from './composables';
import Router from './router';
import { authService } from './services';
import {logger, use} from "@/utils/index.js";
import { MessageToasterKey, OverlayKey, DialogBoxKey } from './symbols';

import OverlayComponent from './components/Ui/OverlayComponent.vue';
import DialogBox from './components/Ui/DialogBox.vue';
import MessageToaster from './components/Ui/Toaster/MessageToaster.vue';
import GlobalEventListeners from './components/Utils/GlobalEventListeners.vue';
import AppInitializer from './components/Utils/AppInitializer.vue';
import {mapActions} from "vuex";

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

      isInitializing: false,
      initializationMessage: 'Инициализируем приложение...',

      showDropZone: false,
    };
  },


  computed: {
    isAppReady() {
      return this.initialized && !this.isInitializing;
    }
  },

  async mounted() {
    await this.initializeApp();

    this.scheduleTokenRefresh();

    window.addEventListener('401-error', () => {
      this.onUserLoggedOut();
    });
    // this.setupGlobalHandlers();
  },


  methods: {

    ...mapActions('admin', [
              'init'
        ]),


    async initializeApp() {
      this.isInitializing = true;
      this.initializationMessage = 'Проверяем сохраненную сессию...';

      try {
        if (window.__app_initializing__) {
          await this.waitForInitialization();
          return;
        }

        window.__app_initializing__ = true;

        const token = authService.getApiToken();
        const savedUser = authService.getAdminData();

        if (token && savedUser) {
          logger.info('🔄 Найдены сохраненные данные пользователя:', savedUser.username);

          if (authService.hasValidTokenLocally()) {
            logger.info('✅ Токен локально валиден, запускаем приложение');

            window.__user_authenticated__ = true;
            window.__current_user__ = savedUser;

            this.initializationMessage = 'Загружаем приложение...';
            await this.onUserAuthenticated();

          } else {
            const refreshToken = authService.getRefreshToken();

            if (refreshToken) {
              try {
                logger.info('🔄 Токен истек, пытаемся обновить...');
                this.initializationMessage = 'Обновляем токен...';

                await authService.refreshToken();

                window.__user_authenticated__ = true;
                window.__current_user__ = savedUser;
                await this.onUserAuthenticated();

              } catch (refreshError) {
                logger.warn('⚠️ Не удалось обновить токен:', refreshError);
                await this.showAuthForm();
              }
            } else {
              logger.info('ℹ️ Нет refresh токена, показываем форму входа');
              await this.showAuthForm();
            }
          }
        } else {
          logger.info('ℹ️ Нет сохраненных данных, показываем форму входа');
          await this.showAuthForm();
        }

      } catch (error) {
        logger.error('❌ Ошибка инициализации приложения:', error);
        await this.showAuthForm();
      } finally {
        this.isInitializing = false;
        window.__app_initializing__ = false;
      }
    },

    async waitForInitialization() {
      let attempts = 0;
      const maxAttempts = 50;

      while (window.__app_initializing__ && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (attempts >= maxAttempts) {
        logger.warn('⚠️ Таймаут ожидания инициализации');
      }
    },

    async onUserAuthenticated() {
      try {
        const currentUser = window.__current_user__ || authService.getAdminData();

        if (!currentUser) {
          throw new Error('Нет данных текущего пользователя');
        }

        if (!currentUser.isActive) {
          throw new Error('Учетная запись пользователя неактивна');
        }

        logger.info('👤 Инициализируем пользователя:', {
          username: currentUser.username,
          fullName: currentUser.fullName,
          isActive: currentUser.isActive,
          isSuperAdmin: currentUser.isSuperAdmin
        });

        await this.init(currentUser);

        this.authenticated = true;
        this.initialized = true;
        this.layout = 'main';

        Router.restoreRouteAfterLogin();

        logger.info('✅ Пользователь успешно аутентифицирован');

      } catch (error) {
        logger.error('❌ Ошибка при обработке аутентификации:', error);
        await this.showAuthForm();
      }
    },

    async showAuthForm() {
      this.initializationMessage = 'Подготавливаем форму входа...';

      this.authenticated = false;
      this.initialized = false;
      this.layout = 'auth';

      const currentHash = window.location.hash;
      if (!currentHash.includes('/login') && !currentHash.includes('/sign-in')) {
        useRouter().go('/login');
      }

      await this.resolveRoute();

      document.documentElement.classList.add(
          navigator.userAgent.includes('Mac') ? 'mac' : 'non-mac'
      );
    },

    triggerAppInitialization() {

      this.authenticated = true;
    },


    async onUserLoggedIn(userData) {
      try {
        logger.info('🔐 Обработка входа пользователя...');

        let currentUser = userData;

        if (!currentUser) {
          logger.warn('⚠️ Данные пользователя не переданы из LoginForm');
          currentUser = authService.getAdminData();
        }

        if (!currentUser || !currentUser.username) {
          throw new Error('Нет корректных данных пользователя после входа');
        }

        logger.info('✅ Данные пользователя получены:', currentUser.username);

        window.__user_authenticated__ = true;
        window.__current_user__ = currentUser;

        await this.onUserAuthenticated();

      } catch (error) {
        logger.error('❌ Ошибка при обработке входа:', error);

        this.$refs.toaster?.error(
            `Ошибка входа: ${error.message || 'Неизвестная ошибка'}`
        );

        this.onInitError(error);
      }
    },

    async onUserLoggedOut() {
      logger.info('🚪 Пользователь вышел из системы');

      await authService.logout();

      this.authenticated = false;
      this.initialized = false;
      this.layout = 'auth';
    },

    async scheduleTokenRefresh() {
      const checkInterval = 60000;

      setInterval(async () => {
        if (window.__user_authenticated__ && authService.shouldRefreshToken()) {
          try {
            logger.info('🔄 Автоматическое обновление токена...');
            await authService.refreshToken();
            logger.info('✅ Токен автоматически обновлен');
          } catch (error) {
            logger.error('❌ Ошибка автоматического обновления токена:', error);
            await this.onUserLoggedOut();
          }
        }
      }, checkInterval);
    },

    onInitError(error) {
      logger.error('❌ Ошибка инициализации приложения:', error);


      this.authenticated = false;
      this.initialized = false;
      this.layout = 'auth';

      this.$refs.toaster?.error('Ошибка загрузки приложения. Попробуйте войти заново.');
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


    setupGlobalHandlers() {
      window.addEventListener('unhandledrejection', (event) => {
        logger.error('🚨 Необработанная ошибка Promise:', event.reason);

        if (event.reason?.message?.includes('Network Error')) {
          this.$refs.toaster?.error('Проблемы с подключением к серверу');
        }
      });

      window.addEventListener('auth-error', () => {

        this.layout = 'auth';
        this.authenticated = false;
        this.initialized = false;
      });

      window.addEventListener('auth-logout', () => {

        this.layout = 'auth';
        this.authenticated = false;
        this.initialized = false;
      });
    }
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

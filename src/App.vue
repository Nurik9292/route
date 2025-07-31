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
import { authService } from './services';
import { logger } from "@/utils/index.js";
import { MessageToasterKey, OverlayKey, DialogBoxKey } from './symbols';

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
    this.setupGlobalHandlers();
  },


  methods: {
    async initializeApp() {

      this.isInitializing = true;
      this.initializationMessage = 'Проверяем сохраненную сессию...';

      try {
        if (window.AUTH_TOKEN) {

          authService.setApiToken(window.AUTH_TOKEN);
        }

        this.initializationMessage = 'Восстанавливаем сессию...';
        const restoredUser = await authService.restoreSession();

        if (restoredUser) {

          this.initializationMessage = 'Сессия восстановлена, загружаем приложение...';

          this.triggerAppInitialization();
          return;
        }


        await this.showAuthForm();

      } catch (error) {
        logger.error('❌ Ошибка инициализации приложения:', error);

        await this.showAuthForm();

      } finally {
        this.isInitializing = false;
      }
    },

    async showAuthForm() {
      this.initializationMessage = 'Подготавливаем форму входа...';

      await this.resolveRoute();

      const currentScreen = this.getCurrentScreen();
      switch (currentScreen) {
        default:
          this.layout = 'auth';
      }

      document.documentElement.classList.add(
          navigator.userAgent.includes('Mac') ? 'mac' : 'non-mac'
      );


    },

    triggerAppInitialization() {

      this.authenticated = true;
    },


    async onUserLoggedIn() {


      this.layout = 'main';
      this.triggerAppInitialization();
    },

    async onInitSuccess() {


      this.authenticated = false;
      this.initialized = true;

      await this.resolveRoute();
      this.layout = 'main';
    },

    onInitError(error) {
      logger.error('❌ Ошибка инициализации приложения:', error);

      if (error.response?.status === 401) {
        logger.log('🔐 Проблемы с аутентификацией, очищаем сессию');
        authService.destroy();
      }


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

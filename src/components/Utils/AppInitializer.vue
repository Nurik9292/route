<template>
  <slot />
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { useErrorHandler, useOverlay } from '@/composables';
import { authService } from '@/services';
import { logger } from '@/utils';

export default {
  name: 'AppInitializer',



  setup() {
    const { showOverlay, hideOverlay } = useOverlay();
    const errorHandler = useErrorHandler();

    return {
      showOverlay,
      hideOverlay,
      errorHandler
    };
  },


  computed: {
    ...mapGetters('admin', ['currentAdmin', 'isSuperAdmin'])
  },

  methods: {
    ...mapActions('common', {
      initCommon: 'init'
    }),

    ...mapActions({
      initializeApp: 'initializeApp'
    }),



    async init() {
      this.showOverlay({
        message: 'Загружаем ваши данные...'
      });

      try {
        logger.info('🚀 Начинаем инициализацию AppInitializer...');

        this.updateOverlayMessage('Проверяем профиль пользователя...');

        const currentUser = this.getCurrentUserFromCache();

        if (!currentUser) {
          throw new Error('Не удалось получить профиль пользователя');
        }

        logger.info('✅ Пользователь получен:', {
          username: currentUser.username,
          fullName: currentUser.fullName || currentUser.name,
          isSuperAdmin: currentUser.isSuperAdmin || currentUser.admin
        });


        this.updateOverlayMessage('Инициализируем модули приложения...');


        await this.initializeApp(currentUser);

        if (currentUser.isSuperAdmin) {
          this.updateOverlayMessage('Загружаем административные данные...');
          await this.loadAdminData();
        }


        this.updateOverlayMessage('Завершаем настройку...');


        await this.delay(500);

        logger.info('🎉 Инициализация AppInitializer завершена успешно');
        this.$emit('success');

      } catch (error) {
        logger.error('❌ Ошибка инициализации AppInitializer:', error);
        await this.handleInitializationError(error);

      } finally {
        this.hideOverlay();
      }
    },

    getCurrentUserFromCache() {

      let currentUser = window.__current_user__;

      if (currentUser) {
        logger.info('📍 Используем данные из window.__current_user__');
        return currentUser;
      }

      currentUser = authService.getAdminData();

      if (currentUser) {
        logger.info('📂 Используем данные из localStorage');
        return currentUser;
      }

      logger.error('❌ Нет данных пользователя ни в window.__current_user__, ни в localStorage');
      return null;
    },



    async loadAdminData() {
      try {
        const loadingTasks = [];

        this.updateOverlayMessage('Загружаем остановки и маршруты...');

        await Promise.race([
          Promise.all(loadingTasks),
          this.delay(10000)
        ]);

        logger.info('✅ Административные данные загружены');

      } catch (error) {

        logger.warn('⚠️ Частичная ошибка загрузки админ данных:', error);
      }
    },


    async handleInitializationError(error) {

      if (error.response?.status === 401) {

        logger.warn('🔐 Ошибка аутентификации, выполняем logout...');

        try {
          await authService.logout();
        } catch (logoutError) {
          logger.error('❌ Ошибка при logout:', logoutError);
        }


        setTimeout(() => {
          this.$refs?.toaster?.warning('Сессия истекла. Войдите заново.');
        }, 100);

      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network')) {

        logger.error('🌐 Проблемы с подключением к серверу');

        setTimeout(() => {
          this.$refs?.toaster?.error('Проблемы с подключением к серверу. Проверьте интернет.');
        }, 100);

      } else {

        logger.error('🚨 Общая ошибка инициализации:', error);


        if (this.errorHandler?.handleHttpError) {
          this.errorHandler.handleHttpError(error);
        } else {
          setTimeout(() => {
            this.$refs?.toaster?.error('Ошибка загрузки приложения');
          }, 100);
        }
      }


      this.$emit('error', error);
    },


    updateOverlayMessage(message) {

      try {
        if (this.$refs?.overlay?.updateMessage(message)) {
          this.$refs.overlay.updateMessage(message);
        }
      } catch (error) {

        logger.info('Не удалось обновить сообщение overlay:', error);
      }
    },

    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },





    async debugInitialization() {
      if (!import.meta.env.DEV) return;

      logger.info('🐛 Debug информация инициализации:', {
        currentUser: this.currentUser,
        isSuperAdmin: this.isSuperAdmin,
        storeModules: Object.keys(this.$store.state),
        authToken: !!authService.getApiToken(),

      });
    }
  },



  async mounted() {

    await this.init();


    if (import.meta.env.DEV) {
      await this.debugInitialization();
    }
  },


  beforeUnmount() {
    this.hideOverlay();
  }
}
</script>

<style scoped>
/* Компонент не имеет визуального представления */
/* Все стили управляются через overlay система */
</style>
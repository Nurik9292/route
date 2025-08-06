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
        message: 'Загружаем данные...'
      });

      try {
        logger.info('🚀 Запуск AppInitializer...');

        const currentUser = this.getCurrentUser();
        if (!currentUser) {
          throw new Error('Нет данных пользователя');
        }

        logger.info('✅ Пользователь найден:', currentUser.username);

        this.updateMessage('Инициализируем модули...');
        await this.initializeApp(currentUser);

        if (currentUser.isSuperAdmin) {
          this.updateMessage('Загружаем административные данные...');
          await this.loadAdminData();
        }

        this.updateMessage('Завершаем настройку...');
        await this.delay(300);

        logger.info('🎉 AppInitializer завершен');
        this.$emit('success');

      } catch (error) {
        logger.error('❌ Ошибка AppInitializer:', error);
        await this.handleError(error);
      } finally {
        this.hideOverlay();
      }
    },

    getCurrentUser() {
      return window.__current_user__ || authService.getAdminData();
    },

    async loadAdminData() {
      try {
        // Здесь загружаем административные данные
        logger.info('📊 Загрузка админ данных...');

        // Добавьте свою логику загрузки
        await this.delay(500);

        logger.info('✅ Админ данные загружены');
      } catch (error) {
        logger.warn('⚠️ Ошибка загрузки админ данных:', error);
      }
    },

    async handleError(error) {
      if (error.response?.status === 401) {
        logger.warn('🔐 Ошибка аутентификации');

        try {
          await authService.logout();
        } catch (logoutError) {
          logger.error('❌ Ошибка logout:', logoutError);
        }

        setTimeout(() => {
          this.$refs?.toaster?.warning('Сессия истекла. Войдите заново.');
        }, 100);

      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network')) {
        logger.error('🌐 Проблемы с сетью');

        setTimeout(() => {
          this.$refs?.toaster?.error('Проблемы с подключением к серверу');
        }, 100);

      } else {
        logger.error('🚨 Общая ошибка:', error);

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

    updateMessage(message) {
      try {
        if (this.$refs?.overlay?.updateMessage) {
          this.$refs.overlay.updateMessage(message);
        }
      } catch (error) {
        // Игнорируем ошибки обновления сообщений
      }
    },

    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  },

  async mounted() {
    await this.init();
  },

  beforeUnmount() {
    this.hideOverlay();
  }
}
</script>

<style scoped>
/* Компонент без визуального представления */
</style>
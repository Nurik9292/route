import { authAPI, adminAPI } from "@/api/index";
import { useLocalStorage } from "@/composables";
import store from "@/store";
import { logger } from "@/utils/index.js";

const API_TOKEN_STORAGE_KEY = 'api-token';
const REFRESH_TOKEN_STORAGE_KEY = 'refresh-token';
const ADMIN_DATA_STORAGE_KEY = 'admin-data';

const { get: lsGet, set: lsSet, remove: lsRemove } = useLocalStorage(false);

export const authService = {


  async login(username, password) {
    try {
      logger.info('🔐 Попытка входа для пользователя:', username);

      const response = await authAPI.login({ username, password });

      this.setApiToken(response.access_token);
      this.setRefreshToken(response.refresh_token);

      const adminData = adminAPI.convertBackendAdmin(response.admin);
      this.setAdminData(adminData);

      await store.dispatch('admin/init', adminData);

      logger.info('✅ Вход выполнен успешно:', adminData.username);
      return adminData;

    } catch (error) {
      logger.error('❌ Ошибка входа:', error);
      if (error.response?.status === 401) {
        this.destroy();
      }
      throw error;
    }
  },

  async logout() {
    try {
      logger.info('🚪 Выход из системы...');
      try {
        await authAPI.logout();
      } catch (error) {
        logger.warn('⚠️ Не удалось уведомить backend о logout:', error);
      }
    } catch (error) {
      logger.warn('⚠️ Ошибка при logout:', error);
    } finally {
      this.destroy();
      await store.dispatch('admin/clear');
      logger.info('✅ Выход завершен');
    }
  },


  async restoreSession() {
    logger.info('🔄 Попытка восстановления сессии...');

    const token = this.getApiToken();
    const refreshToken = this.getRefreshToken();
    const adminData = this.getAdminData();

    if (!token || !adminData) {
      logger.info('ℹ️ Нет сохраненной сессии');
      return null;
    }

    if (!this.hasValidTokenLocally()) {
      logger.warn('⚠️ Токен истек локально');

      if (refreshToken) {
        try {
          logger.info('🔄 Пытаемся обновить истекший токен...');
          await this.refreshToken();

          return await this.validateSessionWithServer();
        } catch (error) {
          logger.error('❌ Не удалось обновить токен:', error);
          this.destroy();
          return null;
        }
      } else {
        logger.warn('⚠️ Нет refresh token для обновления');
        this.destroy();
        return null;
      }
    }

    return await this.validateSessionWithServer();
  },


  async getCurrentAdmin() {
    try {
      logger.info('📡 Запрос данных текущего администратора...');

      const response = await authAPI.getCurrentAdmin();

      if (!response) {
        throw new Error('Нет данных администратора в ответе сервера');
      }

      const adminData = adminAPI.convertBackendAdmin(response);

      this.setAdminData(adminData);

      logger.info('✅ Данные администратора получены:', adminData.username);
      return adminData;

    } catch (error) {
      logger.error('❌ Ошибка получения данных администратора:', error);

      if (error.response?.status === 401) {
        this.destroy();
      }

      throw error;
    }
  },

  async getProfile() {
    return await this.getCurrentAdmin();
  },

  async validateSessionWithServer() {
    try {
      logger.info('🔍 Проверяем токен на сервере...');

      const currentAdmin = await authAPI.getCurrentAdmin();

      if (!currentAdmin) {
        throw new Error('Не удалось получить данные текущего администратора');
      }

      await store.dispatch('admin/init', currentAdmin);

      logger.info('✅ Сессия валидна:', currentAdmin.username);
      return currentAdmin;

    } catch (error) {
      logger.error('❌ Сессия невалидна:', error);

      if (error.response?.status === 401) {
        const refreshToken = this.getRefreshToken();

        if (refreshToken) {
          try {
            logger.info('🔄 Токен недействителен, пытаемся обновить...');
            await this.refreshToken();

            return await this.validateSessionWithServer();
          } catch (refreshError) {
            logger.error('❌ Не удалось обновить токен:', refreshError);
            this.destroy();
            return null;
          }
        }
      }

      this.destroy();
      return null;
    }
  },


  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      logger.info('🔄 Обновление токена...');

      const response = await authAPI.refreshToken(refreshToken);

      this.setApiToken(response.access_token);
      this.setRefreshToken(response.refresh_token);

      logger.info('✅ Токен обновлен успешно');
      return response.access_token;

    } catch (error) {
      logger.error('❌ Ошибка обновления токена:', error);
      await this.logout();
      throw error;
    }
  },

  hasValidTokenLocally() {
    const token = this.getApiToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      const now = Date.now();

      return now < (expiry - 30000);
    } catch (error) {
      logger.warn('⚠️ Ошибка парсинга токена:', error);
      return false;
    }
  },


  shouldRefreshToken() {
    const token = this.getApiToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      const now = Date.now();

      return now > (expiry - 5 * 60 * 1000);
    } catch (error) {
      logger.warn('⚠️ Ошибка проверки токена для обновления:', error);
      return false;
    }
  },



  getApiToken() {
    return lsGet(API_TOKEN_STORAGE_KEY);
  },

  setApiToken(token) {
    lsSet(API_TOKEN_STORAGE_KEY, token);
  },

  getRefreshToken() {
    return lsGet(REFRESH_TOKEN_STORAGE_KEY);
  },

  setRefreshToken(token) {
    lsSet(REFRESH_TOKEN_STORAGE_KEY, token);
  },

  getAdminData() {
    return lsGet(ADMIN_DATA_STORAGE_KEY);
  },

  setAdminData(data) {
    lsSet(ADMIN_DATA_STORAGE_KEY, data);
  },

  destroy() {
    lsRemove(API_TOKEN_STORAGE_KEY);
    lsRemove(REFRESH_TOKEN_STORAGE_KEY);
    lsRemove(ADMIN_DATA_STORAGE_KEY);
  },


  async updateProfile(data) {
    try {
      const currentUser = store.getters['admin/currentUser'];
      if (!currentUser) {
        throw new Error('No current user found');
      }

      logger.info('📝 Обновление профиля:', currentUser.username);

      const updatedAdmin = await adminAPI.updateProfile(data);
      const convertedUser = adminAPI.convertBackendAdmin(updatedAdmin);

      this.setAdminData(convertedUser);
      await store.dispatch('admin/updateCurrentUser', convertedUser);

      logger.info('✅ Профиль обновлен:', convertedUser.username);
      return convertedUser;

    } catch (error) {
      logger.error('❌ Ошибка обновления профиля:', error);
      throw error;
    }
  }
};
import { authAPI, adminAPI } from "@/api/index";
import { useLocalStorage } from "@/composables";
import store from "@/store";
import { http } from "@/services/http.js";
import { logger } from "@/utils/index.js";

const API_TOKEN_STORAGE_KEY = 'api-token';
const REFRESH_TOKEN_STORAGE_KEY = 'refresh-token';
const USER_DATA_STORAGE_KEY = 'user-data';

const { get: lsGet, set: lsSet, remove: lsRemove } = useLocalStorage(false);

export const authService = {

  async login(username, password) {
    try {
      logger.info('🔐 Попытка входа для пользователя:', username);

      const response = await adminAPI.login({ username, password });

      this.setApiToken(response.access_token);
      this.setRefreshToken(response.refresh_token);

      const userData = adminAPI.convertBackendUser(response.admin);
      this.setUserData(userData);

      await store.dispatch('admin/init', userData);

      logger.info('✅ Вход выполнен успешно:', userData.username);
      return response;

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
        await adminAPI.logout();
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

  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      logger.info('🔄 Обновление токена...');

      const response = await adminAPI.refreshToken(refreshToken);

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


  async initializeFromStorage() {
    const token = this.getApiToken();
    const userData = this.getUserData();

    if (!token || !userData) {
      logger.info('ℹ️ Нет сохраненной сессии');
      return null;
    }

    if (!this.hasValidToken()) {
      logger.warn('⚠️ Токен истек, очищаем данные');
      this.destroy();
      return null;
    }

    await store.dispatch('admin/init', userData);

    logger.info('✅ Сессия восстановлена:', userData.username);
    return userData;
  },

  async restoreSession() {
    return await this.initializeFromStorage();
  },


  async updateProfile(data) {
    try {
      const currentUser = store.getters['admin/currentUser'];
      if (!currentUser) {
        throw new Error('No current user found');
      }

      logger.info('📝 Обновление профиля:', currentUser.username);

      const updatedUser = await adminAPI.updateProfile(data);
      const convertedUser = adminAPI.convertBackendUser(updatedUser);

      this.setUserData(convertedUser);
      await store.dispatch('admin/updateCurrent', convertedUser);

      logger.info('✅ Профиль обновлен успешно');
      return convertedUser;

    } catch (error) {
      logger.error('❌ Ошибка обновления профиля:', error);
      throw error;
    }
  },

  async getProfile() {

    const storeUser = store.getters['admin/currentUser'];
    if (storeUser) {
      return storeUser;
    }

    const cachedUser = this.getUserData();
    if (cachedUser) {
      await store.dispatch('admin/init', cachedUser);
      return cachedUser;
    }

    try {
      logger.info('🔍 Получение профиля с сервера...');

      const profile = await adminAPI.getCurrentUser();
      const convertedProfile = adminAPI.convertBackendUser(profile);

      this.setUserData(convertedProfile);
      await store.dispatch('admin/init', convertedProfile);

      return convertedProfile;

    } catch (error) {
      logger.error('❌ Ошибка получения профиля:', error);

      if (error.response?.status === 401) {
        await this.logout();
      }
      throw error;
    }
  },



  getApiToken: () => lsGet(API_TOKEN_STORAGE_KEY),
  setApiToken: (token) => lsSet(API_TOKEN_STORAGE_KEY, token),

  getRefreshToken: () => lsGet(REFRESH_TOKEN_STORAGE_KEY),
  setRefreshToken: (token) => lsSet(REFRESH_TOKEN_STORAGE_KEY, token),

  getUserData: () => lsGet(USER_DATA_STORAGE_KEY),
  setUserData: (userData) => lsSet(USER_DATA_STORAGE_KEY, userData),

  hasApiToken() {
    return Boolean(this.getApiToken());
  },

  hasValidToken() {
    const token = this.getApiToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);

      return payload.exp > (now + 300);

    } catch (error) {
      logger.warn('⚠️ Ошибка парсинга JWT токена:', error);
      return false;
    }
  },

  isAuthenticated() {
    return this.hasApiToken() && this.hasValidToken();
  },

  destroy() {
    lsRemove(API_TOKEN_STORAGE_KEY);
    lsRemove(REFRESH_TOKEN_STORAGE_KEY);
    lsRemove(USER_DATA_STORAGE_KEY);
  },

  getCurrentUser() {
    const storeUser = store.getters['admin/currentUser'];
    if (storeUser) return storeUser;

    return this.getUserData();
  },

  async postSignIn(credentials) {
    return await this.login(credentials.name || credentials.username, credentials.password);
  },

  async delete() {
    return await this.logout();
  },

  setTokensUsingCompositeToken(token) {
    this.setApiToken(token);
  }
};
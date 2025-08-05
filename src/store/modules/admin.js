import { arrayify } from '@/utils';
import { adminAPI } from '@/api/index.js';
import { logger } from '@/utils';

export default {
    namespaced: true,

    state() {
        return {
            admins: [],
            currentAdmin: null,
            avatar: null,
            vault: new Map(),

            isLoading: false,
            lastError: null,
            isInitialized: false,

            pagination: {
                page: 1,
                size: 20,
                total: 0,
                totalPages: 0
            },

            filters: {
                search: '',
                isActive: null,
                isSuperAdmin: null
            }
        }
    },

    getters: {
        currentAdmin: (state) =>  state.currentAdmin,

        isAuthenticated: (state) => !!state.currentAdmin,

        adminFullName: (state) => {
            const admin = state.currentAdmin;
            return admin?.username || admin?.fullName || admin?.name || 'Гость';
        },

        isSuperAdmin: (state) => {
            const admin = state.currentAdmin;
            return  admin?.isSuperAdmin || admin?.admin || false;
        },

        adminInitials: (state) => {
            const admin =  state.currentAdmin;
            const fullName =  admin?.fullName || admin?.username;

            if (!fullName) return 'A';

            return fullName
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        },

        getAvatar: (state) => state.avatar,

        byId: (state) => (id) => state.vault.get(id),

        admins: (state) => state.admins,

        isLoading: (state) => state.isLoading,

        lastError: (state) => state.lastError,

        activeAdmins: (state) => {
            return state.admins.filter(admin => admin.isActive !== false);
        },

        superAdmins: (state) => {
            return state.admins.filter(admin =>
                admin.isSuperAdmin || admin.admin
            );
        },

        pagination: (state) => state.pagination,

        filters: (state) => state.filters,

        filteredAdmins: (state, getters) => {
            let filtered = state.admins;

            if (state.filters.search.trim()) {
                const query = state.filters.search.toLowerCase();
                filtered = filtered.filter(admin => {
                    const name = (admin.fullName || admin.name || '').toLowerCase();
                    const username = (admin.username || '').toLowerCase();
                    return name.includes(query) || username.includes(query);
                });
            }

            if (state.filters.isActive !== null) {
                filtered = filtered.filter(admin => admin.isActive === state.filters.isActive);
            }

            if (state.filters.isSuperAdmin !== null) {
                filtered = filtered.filter(admin => {
                    const isSuper = admin.isSuperAdmin  || admin.admin;
                    return isSuper === state.filters.isSuperAdmin;
                });
            }

            return filtered;
        }
    },

    mutations: {
        SET_LOADING(state, loading) {
            state.isLoading = loading;
        },

        SET_ERROR(state, error) {
            state.lastError = error;
        },

        CLEAR_ERROR(state) {
            state.lastError = null;
        },

        SET_ADMINS(state, admins) {
            state.admins = Array.isArray(admins) ? admins : [];
        },

        SET_CURRENT_ADMIN(state, admin) {
            state.currentAdmin = admin;
        },

        SET_AVATAR(state, avatar) {
            state.avatar = avatar;
        },

        SET_PAGINATION(state, pagination) {
            state.pagination = { ...state.pagination, ...pagination };
        },

        SET_FILTERS(state, filters) {
            state.filters = { ...state.filters, ...filters };
        },

        SYNC_WITH_VAULT(state, admins) {
            const adminArray = arrayify(admins);
            adminArray.forEach(admin => {
                if (admin.id) {
                    state.vault.set(admin.id, admin);
                }
            });
        },

        ADD_ADMIN(state, admin) {
            if (admin && admin.id) {
                state.admins.push(admin);
                state.vault.set(admin.id, admin);
            }
        },

        UPDATE_ADMIN(state, updatedAdmin) {
            if (!updatedAdmin || !updatedAdmin.id) return;

            const index = state.admins.findIndex(admin => admin.id === updatedAdmin.id);
            if (index !== -1) {
                state.admins.splice(index, 1, updatedAdmin);
            }
            state.vault.set(updatedAdmin.id, updatedAdmin);

            if (state.currentAdmin?.id === updatedAdmin.id) {
                state.current = updatedAdmin;
                state.currentAdmin = updatedAdmin;
            }
        },

        REMOVE_ADMIN(state, adminId) {
            state.admins = state.admins.filter(admin => admin.id !== adminId);
            state.vault.delete(adminId);
        },

        SET_INITIALIZED(state, initialized) {
            state.isInitialized = initialized;
        },

        CLEAR_ALL(state) {
            state.currentAdmin = null;
            state.current = null;
            state.admins = [];
            state.vault = new Map();
            state.avatar = null;
            state.isInitialized = false;
            state.loading = false;
            state.error = null;
            state.pagination = {
                currentPage: 1,
                totalPages: 1,
                totalCount: 0,
                perPage: 20
            };
            state.filters = {
                search: '',
                isActive: null,
                isSuperAdmin: null
            };
        }
    },

    actions: {
        async init({ commit, state }, adminData) {
            if (state.isInitialized && state.currentAdmin) {
                return state.currentAdmin;
            }
            try {
                if (adminData) {
                    commit('SET_CURRENT_ADMIN', adminData);
                }

                commit('SET_INITIALIZED', true);
                return adminData;

            } catch (error) {
                logger.error('❌ Ошибка инициализации admin модуля:', error);
                throw error;
            }
        },

        async index({ commit, dispatch }, params = {}) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const response = await adminAPI.getAll({});

                if (response && response.admins && Array.isArray(response.admins)) {
                    const convertedAdmins = response.admins.map(admin => ({
                        id: admin.id,
                        username: admin.username,
                        fullName: admin.full_name,
                        name: admin.full_name,
                        isActive: admin.is_active,
                        isSuperAdmin: admin.is_super_admin,
                        lastLoginAt: admin.last_login_at,
                        createdAt: admin.created_at
                    }));

                    await dispatch('syncWithVault', convertedAdmins);
                    commit('SET_ADMINS', convertedAdmins);

                } else {
                    throw new Error('Неожиданный формат ответа от API');
                }

            } catch (error) {
                logger.error('❌ Ошибка загрузки администраторов:', error);
                commit('SET_ERROR', error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async fetchAvatar({ commit }, avatar) {
            try {
                const avatarData = await adminAPI.fetchAvatar(avatar);
                commit('SET_AVATAR', avatarData);
                return avatarData;
            } catch (error) {
                logger.warn('⚠️ Не удалось загрузить аватар:', error);
                return null;
            }
        },

        syncWithVault({ commit }, admins) {
            commit('SYNC_WITH_VAULT', admins);
        },

        async store({ dispatch, commit }, data) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                logger.info('➕ Создание нового администратора:', data.username);

                const createdAdmin = await adminAPI.store(data);
                const convertedAdmin = adminAPI.convertBackendAdmin(createdAdmin);

                commit('ADD_ADMIN', convertedAdmin);

                logger.info('✅ Администратор создан:', convertedAdmin.username);
                return convertedAdmin;

            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message || 'Ошибка создания администратора';
                commit('SET_ERROR', errorMessage);
                logger.error('❌ Ошибка создания администратора:', error);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async update({ commit }, { id, data }) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const updatedAdmin = await adminAPI.update(id, data);
                const convertedAdmin = adminAPI.convertBackendAdmin(updatedAdmin);

                commit('UPDATE_ADMIN', convertedAdmin);

                return convertedAdmin;

            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message || 'Ошибка обновления администратора';
                commit('SET_ERROR', errorMessage);
                logger.error('❌ Ошибка обновления администратора:', error);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async destroy({ commit }, adminId) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                logger.info('🗑️ Удаление администратора:', adminId);

                await adminAPI.destroy(adminId);
                commit('REMOVE_ADMIN', adminId);

                logger.info('✅ Администратор удален:', adminId);

            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message || 'Ошибка удаления администратора';
                commit('SET_ERROR', errorMessage);
                logger.error('❌ Ошибка удаления администратора:', error);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async activate({ commit }, adminId) {
            try {
                logger.info('🔓 Активация администратора:', adminId);

                const updatedAdmin = await adminAPI.activate(adminId);
                const convertedAdmin = adminAPI.convertBackendAdmin(updatedAdmin);

                commit('UPDATE_ADMIN', convertedAdmin);
                logger.info('✅ Администратор активирован:', adminId);
                return convertedAdmin;

            } catch (error) {
                logger.error('❌ Ошибка активации администратора:', error);
                throw error;
            }
        },

        async deactivate({ commit }, adminId) {
            try {
                logger.info('🔒 Деактивация администратора:', adminId);

                const updatedAdmin = await adminAPI.deactivate(adminId);
                const convertedAdmin = adminAPI.convertBackendAdmin(updatedAdmin);

                commit('UPDATE_ADMIN', convertedAdmin);
                logger.info('✅ Администратор деактивирован:', adminId);
                return convertedAdmin;

            } catch (error) {
                logger.error('❌ Ошибка деактивации администратора:', error);
                throw error;
            }
        },

        setFilters({ commit }, filters) {
            commit('SET_FILTERS', filters);
        },

        clearFilters({ commit }) {
            commit('SET_FILTERS', {
                search: '',
                isActive: null,
                isSuperAdmin: null
            });
        },

        async clear({ commit }) {
            try {
                commit('CLEAR_ALL');
            } catch (error) {
                logger.error('❌ Ошибка очистки данных администраторов:', error);
                throw error;
            }
        },

        async updateCurrentAdmin({ commit }, adminData) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const updatedAdmin = await adminAPI.updateProfile(adminData);
                const convertedAdmin = adminAPI.convertBackendAdmin(updatedAdmin);

                commit('SET_CURRENT_ADMIN', adminData);
                return convertedAdmin;
            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message || 'Ошибка обновления профиля';
                commit('SET_ERROR', errorMessage);
                logger.error('❌ Ошибка обновления профиля:', error);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        }
    }
};
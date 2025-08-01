import { differenceBy, merge } from 'lodash';
import { arrayify } from '@/utils';
import { adminAPI } from '@/api/index.js';
import { logger } from '@/utils';

export default {
    namespaced: true,

    state() {
        return {
            admins: [],
            currentAdmin: null,
            current: null,
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

        currentAdmin: (state) => state.current || state.currentAdmin,

        isAuthenticated: (state) => !!(state.current || state.currentAdmin),

        adminFullName: (state) => {
            const admin = state.current || state.currentAdmin;
            return admin?.full_name || admin?.fullName || admin?.name || 'Гость';
        },

        isSuperAdmin: (state) => {
            const admin = state.current || state.currentAdmin;
            return admin?.is_super_admin || admin?.isSuperAdmin || admin?.admin || false;
        },

        adminInitials: (state) => {
            const admin = state.current || state.currentAdmin;
            const fullName = admin?.full_name || admin?.fullName || admin?.name;

            if (!fullName) return 'G';

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
                admin.isSuperAdmin || admin.is_super_admin || admin.admin
            );
        },

        pagination: (state) => state.pagination,

        filters: (state) => state.filters,

        filteredAdmins: (state) => {
            let filtered = state.admins;

            if (state.filters.search) {
                const search = state.filters.search.toLowerCase();
                filtered = filtered.filter(admin => {
                    const fullName = admin.full_name || admin.fullName || admin.name || '';
                    const username = admin.username || '';
                    return fullName.toLowerCase().includes(search) ||
                        username.toLowerCase().includes(search);
                });
            }

            if (state.filters.isActive !== null) {
                filtered = filtered.filter(admin =>
                    Boolean(admin.isActive) === Boolean(state.filters.isActive)
                );
            }

            if (state.filters.isSuperAdmin !== null) {
                filtered = filtered.filter(admin => {
                    const isSuperAdmin = admin.isSuperAdmin || admin.is_super_admin || admin.admin;
                    return Boolean(isSuperAdmin) === Boolean(state.filters.isSuperAdmin);
                });
            }

            return filtered;
        }
    },

    mutations: {

        SET_ADMINS(state, admins) {
            state.admins = admins;
        },

        SET_CURRENT_ADMIN(state, admin) {
            state.current = admin;
            state.currentAdmin = admin;
            state.isInitialized = true;
            logger.info('🔐 Текущий пользователь установлен:', admin?.username || admin?.full_name);
        },

        UPDATE_CURRENT_ADMIN(state, updates) {
            if (state.current) {
                merge(state.current, updates);
                state.currentAdmin = state.current;
                logger.info('📝 Данные текущего пользователя обновлены');
            }
        },

        CLEAR_CURRENT_ADMIN(state) {
            state.current = null;
            state.currentAdmin = null;
            state.isInitialized = false;
            state.lastError = null;
            logger.info('🚪 Текущий пользователь очищен');
        },

        ADD_ADMIN(state, admin) {
            state.admins.push(user);
            logger.info('➕ Добавлен новый админ:', admin.username || admin.full_name);
        },

        UPDATE_ADMIN(state, admin) {
            const index = state.admins.findIndex(a => a.id === admin.id);
            if (index !== -1) {
                state.admins.splice(index, 1, admin);
                logger.info('📝 Админ обновлен:', admin.username || admin.full_name);
            }
        },

        REMOVE_ADMIN(state, admin) {
            state.admins = differenceBy(state.admins, [admin], 'id');
            state.vault.delete(admin.id);
            logger.info('🗑️ Админ удален:', admin.username || admin.full_name);
        },

        SET_AVATAR(state, avatar) {
            state.avatar = avatar;
        },

        SYNC_WITH_VAULT(state, admins) {
            arrayify(admins).forEach(admin => {
                let local = state.vault.get(admin.id);
                local = local ? merge(local, admin) : admin;
                state.vault.set(admin.id, local);
            });
        },

        SET_LOADING(state, loading) {
            state.isLoading = loading;
        },

        SET_ERROR(state, error) {
            state.lastError = error;
            logger.error('❌ Ошибка в admin store:', error);
        },

        CLEAR_ERROR(state) {
            state.lastError = null;
        },


        SET_PAGINATION(state, pagination) {
            state.pagination = { ...state.pagination, ...pagination };
        },

        SET_FILTERS(state, filters) {
            state.filters = { ...state.filters, ...filters };
        },

        RESET_FILTERS(state) {
            state.filters = {
                search: '',
                isActive: null,
                isSuperAdmin: null
            };
        }
    },

    actions: {

        async init({ commit, dispatch }, adminData) {
            try {
                commit('SET_CURRENT_USER', adminData);
                await dispatch('syncWithVault', adminData);

                const isSuperAdmin = adminData.isSuperAdmin || adminData.is_super_admin || adminData.admin;
                if (isSuperAdmin) {
                    await dispatch('fetchUsers');
                }

            } catch (error) {
                commit('SET_ERROR', error.message || 'Ошибка инициализации');
                throw error;
            }
        },

        async updateCurrent({ commit, dispatch }, adminData) {
            commit('UPDATE_CURRENT_USER', adminData);
            await dispatch('syncWithVault', adminData);
        },

        async updateProfile({ commit, state, dispatch }, data) {
            if (!state.current && !state.currentAdmin) {
                throw new Error('No current user to update');
            }

            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const currentAdmin = state.current || state.currentAdmin;
                const updatedUser = await adminAPI.update(currentAdmin.id, data);

                await dispatch('updateCurrent', updatedUser);
                return updatedUser;

            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message || 'Ошибка обновления профиля';
                commit('SET_ERROR', errorMessage);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async clear({ commit }) {
            commit('CLEAR_CURRENT_USER');
            commit('CLEAR_ERROR');
            commit('SET_LOADING', false);
            commit('SET_USERS', []);
            commit('RESET_FILTERS');
            logger.info('🧹 Админ модуль очищен');
        },

        async fetchAdmins({ commit, dispatch, state }) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const params = {
                    page: state.pagination.page,
                    size: state.pagination.size,
                    search: state.filters.search || undefined,
                    isActive: state.filters.isActive,
                    isSuperAdmin: state.filters.isSuperAdmin
                };

                Object.keys(params).forEach(key =>
                    params[key] === undefined && delete params[key]
                );

                const response = await adminAPI.getAll(params);

                if (response.content && Array.isArray(response.content)) {
                    await dispatch('syncWithVault', response.content);
                    commit('SET_USERS', response.content);
                    commit('SET_PAGINATION', {
                        page: response.page,
                        size: response.size,
                        total: response.total,
                        totalPages: response.totalPages
                    });
                } else if (Array.isArray(response)) {
                    await dispatch('syncWithVault', response);
                    commit('SET_USERS', response);
                } else {
                    throw new Error('Неожиданный формат ответа от API');
                }

            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message || 'Ошибка загрузки пользователей';
                commit('SET_ERROR', errorMessage);
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
                const admin = await adminAPI.store(data);
                await dispatch('add', admin);
                return admin;
            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message || 'Ошибка создания пользователя';
                commit('SET_ERROR', errorMessage);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        add({ commit, dispatch }, admin) {
            dispatch('syncWithVault', admin);
            commit('ADD_ADMIN', admin);
        },

        async update({ commit, dispatch, state }, data) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const updatedAdmin = await adminAPI.update(data.id, data);
                await dispatch('syncWithVault', updatedAdmin);
                commit('UPDATE_ADMIN', updatedAdmin);

                const currentAdmin = state.current || state.currentAdmin;
                if (currentAdmin && currentAdmin.id === data.id) {
                    commit('UPDATE_CURRENT_ADMIN', updatedAdmin);
                }

                return updatedAdmin;
            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message || 'Ошибка обновления пользователя';
                commit('SET_ERROR', errorMessage);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async destroy({ commit }, admin) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const adminId = typeof admin === 'object' ? admin.id : admin;
                await adminAPI.delete(adminId);
                commit('REMOVE_USER', admin);
            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message || 'Ошибка удаления пользователя';
                commit('SET_ERROR', errorMessage);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async activate({ commit, dispatch }, admin) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                await adminAPI.activate(admin.id);

                const updatedAdmin = { ...admin, isActive: true };
                await dispatch('syncWithVault', updatedAdmin);
                commit('UPDATE_USER', updatedAdmin);

                logger.info('✅ Админ активирован:', admin.username || admin.full_name);
                return updatedAdmin;
            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message || 'Ошибка активации администратора';
                commit('SET_ERROR', errorMessage);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async deactivate({ commit, dispatch }, admin) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                await adminAPI.deactivate(admin.id);

                const updatedUser = { ...admin, isActive: false };
                await dispatch('syncWithVault', updatedUser);
                commit('UPDATE_USER', updatedUser);

                logger.info('✅ Админ деактивирован:', admin.username || admin.full_name);
                return updatedUser;
            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message || 'Ошибка деактивации администратора';
                commit('SET_ERROR', errorMessage);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },


        async setFilters({ commit, dispatch }, filters) {
            commit('SET_FILTERS', filters);
            commit('SET_PAGINATION', { page: 1 });
            await dispatch('fetchUsers');
        },

        async setPage({ commit, dispatch }, page) {
            commit('SET_PAGINATION', { page });
            await dispatch('fetchUsers');
        },

        async setPageSize({ commit, dispatch }, size) {
            commit('SET_PAGINATION', { page: 1, size });
            await dispatch('fetchUsers');
        },

        async resetFilters({ commit, dispatch }) {
            commit('RESET_FILTERS');
            commit('SET_PAGINATION', { page: 1 });
            await dispatch('fetchUsers');
        },

        async search({ dispatch }, searchTerm) {
            await dispatch('setFilters', { search: searchTerm });
        },

        async changePassword({ commit }, { id, oldPassword, newPassword }) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                await adminAPI.changePassword(id, oldPassword, newPassword);
                logger.info('✅ Пароль изменен для админа ID:', id);
            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message || 'Ошибка смены пароля';
                commit('SET_ERROR', errorMessage);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        }
    }
};
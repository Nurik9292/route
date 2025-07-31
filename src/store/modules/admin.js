import { differenceBy, merge } from 'lodash';
import { arrayify } from '@/utils';
import { adminAPI } from '@/api/index.js';
import { logger } from '@/utils';

export default {
    namespaced: true,

    state() {
        return {
            users: [],
            currentUser: null,
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

        currentUser: (state) => state.current || state.currentUser,

        isAuthenticated: (state) => !!(state.current || state.currentUser),

        userFullName: (state) => {
            const user = state.current || state.currentUser;
            return user?.full_name || user?.fullName || user?.name || 'Гость';
        },

        isSuperAdmin: (state) => {
            const user = state.current || state.currentUser;
            return user?.is_super_admin || user?.isSuperAdmin || user?.admin || false;
        },

        userInitials: (state) => {
            const user = state.current || state.currentUser;
            const fullName = user?.full_name || user?.fullName || user?.name;

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

        users: (state) => state.users,

        isLoading: (state) => state.isLoading,

        lastError: (state) => state.lastError,


        activeUsers: (state) => {
            return state.users.filter(user => user.isActive !== false);
        },

        superAdmins: (state) => {
            return state.users.filter(user =>
                user.isSuperAdmin || user.is_super_admin || user.admin
            );
        },

        pagination: (state) => state.pagination,

        filters: (state) => state.filters,

        filteredUsers: (state) => {
            let filtered = state.users;

            if (state.filters.search) {
                const search = state.filters.search.toLowerCase();
                filtered = filtered.filter(user => {
                    const fullName = user.full_name || user.fullName || user.name || '';
                    const username = user.username || '';
                    return fullName.toLowerCase().includes(search) ||
                        username.toLowerCase().includes(search);
                });
            }

            if (state.filters.isActive !== null) {
                filtered = filtered.filter(user =>
                    Boolean(user.isActive) === Boolean(state.filters.isActive)
                );
            }

            if (state.filters.isSuperAdmin !== null) {
                filtered = filtered.filter(user => {
                    const isSuperAdmin = user.isSuperAdmin || user.is_super_admin || user.admin;
                    return Boolean(isSuperAdmin) === Boolean(state.filters.isSuperAdmin);
                });
            }

            return filtered;
        }
    },

    mutations: {

        SET_USERS(state, users) {
            state.users = users;
        },

        SET_CURRENT_USER(state, user) {
            state.current = user;
            state.currentUser = user;
            state.isInitialized = true;
            logger.info('🔐 Текущий пользователь установлен:', user?.username || user?.full_name);
        },

        UPDATE_CURRENT_USER(state, updates) {
            if (state.current) {
                merge(state.current, updates);
                state.currentUser = state.current;
                logger.info('📝 Данные текущего пользователя обновлены');
            }
        },

        CLEAR_CURRENT_USER(state) {
            state.current = null;
            state.currentUser = null;
            state.isInitialized = false;
            state.lastError = null;
            logger.info('🚪 Текущий пользователь очищен');
        },

        ADD_USER(state, user) {
            state.users.push(user);
            logger.info('➕ Добавлен новый админ:', user.username || user.full_name);
        },

        UPDATE_USER(state, user) {
            const index = state.users.findIndex(u => u.id === user.id);
            if (index !== -1) {
                state.users.splice(index, 1, user);
                logger.info('📝 Админ обновлен:', user.username || user.full_name);
            }
        },

        REMOVE_USER(state, user) {
            state.users = differenceBy(state.users, [user], 'id');
            state.vault.delete(user.id);
            logger.info('🗑️ Админ удален:', user.username || user.full_name);
        },

        SET_AVATAR(state, avatar) {
            state.avatar = avatar;
        },

        SYNC_WITH_VAULT(state, users) {
            arrayify(users).forEach(user => {
                let local = state.vault.get(user.id);
                local = local ? merge(local, user) : user;
                state.vault.set(user.id, local);
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

        async init({ commit, dispatch }, userData) {
            try {
                commit('SET_CURRENT_USER', userData);
                await dispatch('syncWithVault', userData);

                const isSuperAdmin = userData.isSuperAdmin || userData.is_super_admin || userData.admin;
                if (isSuperAdmin) {
                    await dispatch('fetchUsers');
                }

            } catch (error) {
                commit('SET_ERROR', error.message || 'Ошибка инициализации');
                throw error;
            }
        },

        async updateCurrent({ commit, dispatch }, userData) {
            commit('UPDATE_CURRENT_USER', userData);
            await dispatch('syncWithVault', userData);
        },

        async updateProfile({ commit, state, dispatch }, data) {
            if (!state.current && !state.currentUser) {
                throw new Error('No current user to update');
            }

            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const currentUser = state.current || state.currentUser;
                const updatedUser = await adminAPI.update(currentUser.id, data);

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

        async fetchUsers({ commit, dispatch, state }) {
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

        syncWithVault({ commit }, users) {
            commit('SYNC_WITH_VAULT', users);
        },

        async store({ dispatch, commit }, data) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const user = await adminAPI.store(data);
                await dispatch('add', user);
                return user;
            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message || 'Ошибка создания пользователя';
                commit('SET_ERROR', errorMessage);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        add({ commit, dispatch }, user) {
            dispatch('syncWithVault', user);
            commit('ADD_USER', user);
        },

        async update({ commit, dispatch, state }, data) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const updatedUser = await adminAPI.update(data.id, data);
                await dispatch('syncWithVault', updatedUser);
                commit('UPDATE_USER', updatedUser);

                const currentUser = state.current || state.currentUser;
                if (currentUser && currentUser.id === data.id) {
                    commit('UPDATE_CURRENT_USER', updatedUser);
                }

                return updatedUser;
            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message || 'Ошибка обновления пользователя';
                commit('SET_ERROR', errorMessage);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async destroy({ commit }, user) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const userId = typeof user === 'object' ? user.id : user;
                await adminAPI.delete(userId);
                commit('REMOVE_USER', user);
            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message || 'Ошибка удаления пользователя';
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
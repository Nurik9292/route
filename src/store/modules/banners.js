import { bannerAPI } from "@/api/index.js";
import { arrayify, logger } from '@/utils';
import { difference, differenceBy, map, merge, orderBy, unionBy } from 'lodash';

export default {
    namespaced: true,

    state: () => ({
        banners: [],
        vault: new Map(),
        loading: false,
        error: null,
        pagination: {
            currentPage: 1,
            itemsPerPage: 25,
            totalCount: 0,
            activeCount: 0,
            hasMorePages: true,
            nextPage: null
        },
        filters: {
            activeOnly: null,
            searchQuery: ''
        }
    }),

    getters: {
        getBanners: state => state.banners,
        getBannerById: state => id => state.vault.get(id),
        getLoading: state => state.loading,
        getError: state => state.error,
        getPagination: state => state.pagination,
        getFilters: state => state.filters,

        moreBannersAvailable: state => state.pagination.hasMorePages,

        getBannersFromVault: state => ids => {
            return ids.map(id => state.vault.get(id)).filter(Boolean);
        }
    },

    mutations: {
        SET_BANNERS(state, banners) {
            state.banners = arrayify(banners);
        },

        ADD_BANNERS(state, banners) {
            state.banners = unionBy(state.banners, arrayify(banners), 'id');
        },

        ADD_BANNER(state, banner) {
            state.banners.unshift(banner);
            state.vault.set(banner.id, banner);

            state.pagination.totalCount += 1;
            if (banner.isActive) {
                state.pagination.activeCount += 1;
            }
        },

        UPDATE_BANNER(state, updatedBanner) {
            const index = state.banners.findIndex(b => b.id === updatedBanner.id);
            if (index !== -1) {
                const originalBanner = state.banners[index];
                state.banners.splice(index, 1, updatedBanner);
                state.vault.set(updatedBanner.id, updatedBanner);

                if (originalBanner.isActive !== updatedBanner.isActive) {
                    if (updatedBanner.isActive) {
                        state.pagination.activeCount += 1;
                    } else {
                        state.pagination.activeCount -= 1;
                    }
                }
            }
        },

        REMOVE_BANNER(state, bannerId) {
            const index = state.banners.findIndex(b => b.id === bannerId);
            if (index !== -1) {
                const removedBanner = state.banners[index];
                state.banners.splice(index, 1);
                state.vault.delete(bannerId);

                state.pagination.totalCount -= 1;
                if (removedBanner.isActive) {
                    state.pagination.activeCount -= 1;
                }
            }
        },

        SYNC_WITH_VAULT(state, banners) {
            arrayify(banners).forEach(banner => {
                state.vault.set(banner.id, banner);
            });
        },

        SET_PAGINATION(state, pagination) {
            state.pagination = merge(state.pagination, pagination);
        },

        RESET_PAGINATION(state) {
            state.pagination.currentPage = 1;
            state.pagination.hasMorePages = true;
            state.banners = [];
        },

        SET_FILTERS(state, filters) {
            state.filters = merge(state.filters, filters);
        },

        CLEAR_FILTERS(state) {
            state.filters = {
                activeOnly: null,
                searchQuery: ''
            };
        },

        SET_LOADING(state, loading) {
            state.loading = loading;
        },

        SET_ERROR(state, error) {
            state.error = error;
        },

        CLEAR_ERROR(state) {
            state.error = null;
        }
    },

    actions: {
        async paginate({ commit, state }, params = {}) {
            if (state.loading || !state.pagination.hasMorePages) {
                return null;
            }

            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const requestParams = {
                    page: params.page || state.pagination.currentPage,
                    size: params.size || state.pagination.itemsPerPage,
                    sort: params.sort || 'display_order',
                    order: params.order || 'asc',
                    active: params.active !== undefined ? params.active : state.filters.activeOnly,
                    ...params
                };

                const response = await bannerAPI.getAll(requestParams);
                console.log('banners vasdfdsfds', response)

                await commit('SYNC_WITH_VAULT', response.banners || response.content || []);

                if (requestParams.page === 1) {
                    commit('SET_BANNERS', response.banners || response.content || []);
                } else {
                    commit('ADD_BANNERS', response.banners || response.content || []);
                }

                const hasMorePages = response.hasMore !== undefined ?
                    response.hasMore :
                    (response.banners || response.content || []).length === requestParams.size;

                commit('SET_PAGINATION', {
                    currentPage: requestParams.page,
                    totalCount: response.totalCount || response.totalElements || 0,
                    activeCount: response.activeCount || response.totalElements || 0,
                    hasMorePages,
                    nextPage: hasMorePages ?
                        state.pagination.currentPage + 1 :
                        state.pagination.currentPage
                });

                return hasMorePages ? state.pagination.currentPage : null;

            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async fetchAll({ dispatch, commit }, params = {}) {
            commit('RESET_PAGINATION');
            return await dispatch('paginate', params);
        },

        async fetchById({ dispatch, commit }, bannerId) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const banner = await bannerAPI.getById(bannerId);
                await dispatch('syncWithVault', banner);
                return banner;
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        syncWithVault({ commit }, banners) {
            commit('SYNC_WITH_VAULT', banners);
        },

        async store({ dispatch, commit }, data) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const banner = await bannerAPI.store(data);
                await dispatch('syncWithVault', banner);
                commit('ADD_BANNER', banner);
                return banner;
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        add({ commit, dispatch }, banner) {
            dispatch('syncWithVault', banner);
            commit('ADD_BANNER', banner);
        },

        async update({ dispatch, commit }, { bannerId, data }) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const updatedBanner = await bannerAPI.update(bannerId, data);
                await dispatch('syncWithVault', updatedBanner);
                commit('UPDATE_BANNER', updatedBanner);
                return updatedBanner;
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async destroy({ commit }, bannerId) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                await bannerAPI.destroy(bannerId);
                commit('REMOVE_BANNER', bannerId);
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async uploadImage({ commit }, formData) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const response = await bannerAPI.uploadImage(formData);
                return response.filename;
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async toggleStatus({commit,dispatch }, {bannerId, active} ) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');
            try {
                const params = {
                    active: active
                };

                const banner = await bannerAPI.toggleStatus(bannerId, params);
                commit('UPDATE_BANNER', banner);
                await dispatch('syncWithVault', banner, params);
                return banner;
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        setFilters({ commit }, filters) {
            commit('SET_FILTERS', filters);
        },

        clearFilters({ commit }) {
            commit('CLEAR_FILTERS');
        }
    }
};
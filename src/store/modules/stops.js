import { differenceBy, merge } from 'lodash';
import { arrayify } from '@/utils';
import stopAPI from '@/api/stopAPI';

export default {
    namespaced: true,

    state() {
        return {
            stops: [],
            vault: new Map(),
            loading: false,
            error: null,

            pagination: {
                currentPage: 1,
                itemsPerPage: 25,
                totalCount: 0,
                activeCount: 0,
                hasMorePages: true
            },

            filters: {
                cityId: null,
                activeOnly: null,
                searchQuery: ''
            }
        }
    },

    getters: {
        getStops(state) {
            return state.stops;
        },

        getStopById: (state) => (id) => {
            return state.stops.find(stop => stop.id === id) || state.vault.get(id);
        },

        isLoading(state) {
            return state.loading;
        },

        getError(state) {
            return state.error;
        },

        activeStops(state) {
            return state.stops.filter(stop => stop.isActive);
        },

        totalCount(state) {
            return state.pagination.totalCount;
        },

        activeCount(state) {
            return state.pagination.activeCount;
        },

        currentPage(state) {
            return state.pagination.currentPage;
        },

        hasMorePages(state) {
            return state.pagination.hasMorePages;
        },

        itemsPerPage(state) {
            return state.pagination.itemsPerPage;
        },

        getFilters(state) {
            return state.filters;
        }
    },

    mutations: {
        SET_LOADING(state, loading) {
            state.loading = loading;
        },

        SET_ERROR(state, error) {
            state.error = error;
        },

        CLEAR_ERROR(state) {
            state.error = null;
        },

        SET_STOPS(state, stops) {
            state.stops = arrayify(stops);
        },

        ADD_STOPS(state, stops) {
            const existingIds = state.stops.map(stop => stop.id);
            const newStops = arrayify(stops).filter(stop => !existingIds.includes(stop.id));
            state.stops.push(...newStops);
        },

        ADD_STOP(state, stop) {
            state.stops.unshift(stop);
            state.pagination.totalCount += 1;
            if (stop.is_active) {
                state.pagination.activeCount += 1;
            }
        },

        UPDATE_STOP(state, updatedStop) {
            const index = state.stops.findIndex(stop => stop.id === updatedStop.id);
            if (index !== -1) {
                const oldStop = state.stops[index];
                state.stops.splice(index, 1, updatedStop);

                if (oldStop.isActive !== updatedStop.isActive) {
                    if (updatedStop.isActive) {
                        state.pagination.activeCount += 1;
                    } else {
                        state.pagination.activeCount -= 1;
                    }
                }
            }
        },

        REMOVE_STOP(state, stopId) {
            const index = state.stops.findIndex(stop => stop.id === stopId);
            if (index !== -1) {
                const removedStop = state.stops[index];
                state.stops.splice(index, 1);
                state.vault.delete(stopId);

                state.pagination.totalCount -= 1;
                if (removedStop.isActive) {
                    state.pagination.activeCount -= 1;
                }
            }
        },

        SYNC_WITH_VAULT(state, stops) {
            arrayify(stops).forEach(stop => {
                state.vault.set(stop.id, stop);
            });
        },

        SET_PAGINATION(state, pagination) {
            state.pagination = merge(state.pagination, pagination);
        },

        RESET_PAGINATION(state) {
            state.pagination.currentPage = 1;
            state.pagination.hasMorePages = true;
            state.stops = [];
        },

        SET_FILTERS(state, filters) {
            state.filters = merge(state.filters, filters);
        },

        CLEAR_FILTERS(state) {
            state.filters = {
                cityId: null,
                activeOnly: null,
                searchQuery: ''
            };
        }
    },

    actions: {
        async paginate({ commit, state }, params = {}) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const requestParams = {
                    page: params.page || state.pagination.currentPage,
                    size: params.size || state.pagination.itemsPerPage,
                    sort: params.sort,
                    order: params.order,
                    active: params.active !== undefined ? params.active : state.filters.activeOnly,
                    cityId: params.cityId || state.filters.cityId,
                    ...params
                };

                const response = await stopAPI.getAll(requestParams);
                console.log('res res stop', response)
                await commit('SYNC_WITH_VAULT', response.stops || response.content || []);

                if (requestParams.page === 1) {
                    commit('SET_STOPS', response.stops || response.content || []);
                } else {
                    commit('ADD_STOPS', response.stops || response.content || []);
                }

                const hasMorePages = response.hasMore !== undefined ?
                    response.hasMore :
                    (response.stops || response.content || []).length === requestParams.size;

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

        async fetchById({ dispatch, commit }, stopId) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const stop = await stopAPI.getById(stopId);
                await dispatch('syncWithVault', stop);
                return stop;
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        syncWithVault({ commit }, stops) {
            commit('SYNC_WITH_VAULT', stops);
        },

        async store({ dispatch, commit }, data) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const stop = await stopAPI.store(data);
                await dispatch('syncWithVault', stop);
                commit('ADD_STOP', stop);
                return stop;
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        add({ commit, dispatch }, stop) {
            dispatch('syncWithVault', stop);
            commit('ADD_STOP', stop);
        },

        async update({ dispatch, commit }, { stopId, data }) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');
            try {
                const updatedStop = await stopAPI.update(stopId, data);
                await dispatch('syncWithVault', updatedStop);
                commit('UPDATE_STOP', updatedStop);
                return updatedStop;
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async destroy({ commit }, stopId) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                await stopAPI.delete(stopId);
                commit('REMOVE_STOP', stopId);
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
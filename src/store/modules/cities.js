import { differenceBy, merge } from 'lodash';
import { arrayify } from '@/utils';
import cityAPI from '@/api/cityAPI';

export default {
    namespaced: true,

    state() {
        return {
            cities: [],
            vault: new Map(),
            loading: false,
            error: null,

            pagination: {
                currentPage: 1,
                itemsPerPage: 25,
                totalCount: 0,
                activeCount: 0,
                hasMorePages: true
            }
        }
    },

    getters: {
        getCities(state) {
            return state.cities;
        },

        getCityById: (state) => (id) => {
            return state.cities.find(city => city.id === id) || state.vault.get(id);
        },

        isLoading(state) {
            return state.loading;
        },

        getError(state) {
            return state.error;
        },

        activeCities(state) {
            return state.cities.filter(city => city.isActive);
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

        SET_CITIES(state, cities) {
            state.cities = cities;
        },

        ADD_CITIES(state, cities) {
            const existingIds = state.cities.map(city => city.id);
            const newCities = cities.filter(city => !existingIds.includes(city.id));
            state.cities.push(...newCities);
        },

        ADD_CITY(state, city) {
            state.cities.unshift(city); // Добавляем в начало списка
            state.pagination.totalCount += 1;
            if (city.isActive) {
                state.pagination.activeCount += 1;
            }
        },

        UPDATE_CITY(state, updatedCity) {
            const index = state.cities.findIndex(city => city.id === updatedCity.id);
            if (index !== -1) {
                const oldCity = state.cities[index];
                state.cities.splice(index, 1, updatedCity);

                if (oldCity.isActive !== updatedCity.isActive) {
                    if (updatedCity.isActive) {
                        state.pagination.activeCount += 1;
                    } else {
                        state.pagination.activeCount -= 1;
                    }
                }
            }
        },

        REMOVE_CITY(state, cityToRemove) {
            state.cities = differenceBy(state.cities, [cityToRemove], 'id');
            state.vault.delete(cityToRemove.id);

            state.pagination.totalCount = Math.max(0, state.pagination.totalCount - 1);
            if (cityToRemove.isActive) {
                state.pagination.activeCount = Math.max(0, state.pagination.activeCount - 1);
            }
        },

        SET_PAGINATION(state, paginationData) {
            state.pagination = {
                ...state.pagination,
                ...paginationData
            };
        },

        RESET_PAGINATION(state) {
            state.pagination = {
                currentPage: 1,
                itemsPerPage: 25,
                totalCount: 0,
                activeCount: 0,
                hasMorePages: true
            };
        },

        SYNC_WITH_VAULT(state, cities) {
            arrayify(cities).forEach(city => {
                let local = state.vault.get(city.id);
                local = local ? merge(local, city) : city;
                state.vault.set(city.id, local);
            });
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
                    page: state.pagination.currentPage,
                    size: state.pagination.itemsPerPage,
                    sort: params.sort || 'name',
                    order: params.order || 'asc',
                    active: params.active
                };

                const response = await cityAPI.getAll(requestParams);


                const cities = response.cities || [];
                const totalCount = response.total_count || 0;
                const activeCount = response.active_count || 0;

                if (state.pagination.currentPage === 1) {
                    await this.dispatch('cities/syncWithVault', cities);
                    commit('SET_CITIES', cities);
                } else {
                    await this.dispatch('cities/syncWithVault', cities);
                    commit('ADD_CITIES', cities);
                }

                const hasMorePages = cities.length === state.pagination.itemsPerPage;

                commit('SET_PAGINATION', {
                    totalCount,
                    activeCount,
                    hasMorePages,
                    currentPage: hasMorePages ? state.pagination.currentPage + 1 : state.pagination.currentPage
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

        async fetchById({ dispatch, commit }, cityId) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const city = await cityAPI.getById(cityId);
                await dispatch('syncWithVault', city);
                return city;
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        syncWithVault({ commit }, cities) {
            commit('SYNC_WITH_VAULT', cities);
        },

        async store({ dispatch, commit }, data) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const city = await cityAPI.store(data);
                await dispatch('syncWithVault', city);
                commit('ADD_CITY', city);
                return city;
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        add({ commit, dispatch }, city) {
            dispatch('syncWithVault', city);
            commit('ADD_CITY', city);
        },

        async update({ dispatch, commit }, { cityId, data }) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const updatedCity = await cityAPI.update(cityId, data);
                await dispatch('syncWithVault', updatedCity);
                commit('UPDATE_CITY', updatedCity);
                return updatedCity;
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async destroy({ commit }, city) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                await cityAPI.delete(city.id);
                commit('REMOVE_CITY', city);
                return true;
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        clearError({ commit }) {
            commit('CLEAR_ERROR');
        },

        resetPagination({ commit }) {
            commit('RESET_PAGINATION');
        }
    }
}
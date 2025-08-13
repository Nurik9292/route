import { differenceBy, merge } from 'lodash';
import { arrayify } from '@/utils';
import routeAPI from '@/api/routeAPI';

export default {
    namespaced: true,

    state() {
        return {
            routes: [],
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
                searchQuery: '',
                routeType: null
            },

            routeGeometry: new Map(),
            routeStops: new Map(),
            drawingMode: false
        }
    },

    getters: {
        getRoutes(state) {
            return state.routes;
        },

        getRouteById: (state) => (id) => {
            return state.routes.find(route => route.id === id) || state.vault.get(id);
        },

        getRouteByNumber: (state) => (routeNumber) => {
            return state.routes.find(route => route.routeNumber === routeNumber);
        },

        isLoading(state) {
            return state.loading;
        },

        getError(state) {
            return state.error;
        },

        activeRoutes(state) {
            return state.routes.filter(route => route.is_active);
        },

        inactiveRoutes(state) {
            return state.routes.filter(route => !route.is_active);
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
        },

        getRouteGeometry: (state) => (routeNumber) => {
            return state.routeGeometry.get(routeNumber);
        },

        getRouteStops: (state) => (routeNumber, direction = 0) => {
            const key = `${routeNumber}_${direction}`;
            return state.routeStops.get(key);
        },

        isDrawingMode(state) {
            return state.drawingMode;
        },

        routesByColor(state) {
            const colorMap = new Map();
            state.routes.forEach(route => {
                const color = route.color || '#3B82F6';
                if (!colorMap.has(color)) {
                    colorMap.set(color, []);
                }
                colorMap.get(color).push(route);
            });
            return colorMap;
        },

        averageFrequency(state) {
            if (state.routes.length === 0) return 0;
            const total = state.routes.reduce((sum, route) => sum + (route.estimated_duration_minutes || 0), 0);
            return Math.round(total / state.routes.length);
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

        SET_ROUTES(state, routes) {
            state.routes = arrayify(routes);
        },

        ADD_ROUTES(state, routes) {
            const existingIds = state.routes.map(route => route.id);
            const newRoutes = arrayify(routes).filter(route => !existingIds.includes(route.id));
            state.routes.push(...newRoutes);
        },

        ADD_ROUTE(state, route) {
            state.routes.unshift(route);
            state.pagination.totalCount += 1;
            if (route.is_active) {
                state.pagination.activeCount += 1;
            }
        },

        UPDATE_ROUTE(state, updatedRoute) {
            const index = state.routes.findIndex(route => route.id === updatedRoute.id);
            if (index !== -1) {
                const oldRoute = state.routes[index];
                state.routes.splice(index, 1, updatedRoute);

                if (oldRoute.isActive !== updatedRoute.isActive) {
                    if (updatedRoute.isActive) {
                        state.pagination.activeCount += 1;
                    } else {
                        state.pagination.activeCount -= 1;
                    }
                }
            }
        },

        REMOVE_ROUTE(state, routeId) {
            const index = state.routes.findIndex(route => route.id === routeId);
            if (index !== -1) {
                const removedRoute = state.routes[index];
                state.routes.splice(index, 1);
                state.vault.delete(routeId);

                state.routeGeometry.delete(removedRoute.routeNumber);
                state.routeStops.delete(`${removedRoute.routeNumber}_0`);
                state.routeStops.delete(`${removedRoute.routeNumber}_1`);

                state.pagination.totalCount -= 1;
                if (removedRoute.isActive) {
                    state.pagination.activeCount -= 1;
                }
            }
        },

        SYNC_WITH_VAULT(state, routes) {
            arrayify(routes).forEach(route => {
                state.vault.set(route.id, route);
            });
        },

        SET_VAULT(state, route) {
            state.vault.set(route.id, route);
        },

        SET_PAGINATION(state, pagination) {
            state.pagination = merge(state.pagination, pagination);
        },

        RESET_PAGINATION(state) {
            state.pagination.currentPage = 1;
            state.pagination.hasMorePages = true;
            state.routes = [];
        },

        SET_FILTERS(state, filters) {
            state.filters = merge(state.filters, filters);
        },

        CLEAR_FILTERS(state) {
            state.filters = {
                cityId: null,
                activeOnly: null,
                searchQuery: '',
                routeType: null
            };
        },

        SET_ROUTE_GEOMETRY(state, { routeNumber, geometry }) {
            state.routeGeometry.set(routeNumber, geometry);
        },

        CLEAR_ROUTE_GEOMETRY(state, routeNumber) {
            state.routeGeometry.delete(routeNumber);
        },

        SET_ROUTE_STOPS(state, { routeNumber, direction, stops }) {
            const key = `${routeNumber}_${direction}`;
            state.routeStops.set(key, arrayify(stops));
        },

        CLEAR_ROUTE_STOPS(state, routeNumber) {
            state.routeStops.delete(`${routeNumber}_0`);
            state.routeStops.delete(`${routeNumber}_1`);
        },

        SET_DRAWING_MODE(state, isDrawing) {
            state.drawingMode = isDrawing;
        }
    },

    actions: {
        async paginate({ commit, state }, params = {}) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');
            console.log('route params', params)
            try {
                const requestParams = {
                    page: params.page || state.pagination.currentPage,
                    size: params.size || state.pagination.itemsPerPage,
                    sort: params.sort || 'route_number',
                    order: params.order || 'asc',
                    active: true,      //params.active !== undefined ? params.active : state.filters.activeOnly,
                    search: params.search || state.filters.searchQuery,
                    ...params
                };

                const response = await routeAPI.getAll(requestParams);
                console.log('Routes API response:', response);

                await commit('SYNC_WITH_VAULT', response.routes || []);

                if (requestParams.page === 1) {
                    commit('SET_ROUTES', response.routes || []);
                } else {
                    commit('ADD_ROUTES', response.routes || []);
                }

                const hasMorePages = response.hasMore !== undefined ?
                    response.hasMore :
                    (response.routes || response.content || []).length === requestParams.size;

                commit('SET_PAGINATION', {
                    currentPage: requestParams.page,
                    totalCount: response.total_count  || 0,
                    activeCount: response.activeCount  || 0,
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

        async fetchById({ dispatch, commit }, routeId) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const route = await routeAPI.getById(routeId);
                await dispatch('syncWithVault', route);
                return route;
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        syncWithVault({ commit }, routes) {
            commit('SYNC_WITH_VAULT', routes);
        },

        async store({ dispatch, commit }, data) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const route = await routeAPI.store(data);
                commit('SET_VAULT', route);
                commit('ADD_ROUTE', route);
                return route;
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        add({ commit, dispatch }, route) {
            dispatch('syncWithVault', route);
            commit('ADD_ROUTE', route);
        },

        async update({ dispatch, commit }, { routeId, data }) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const updatedRoute = await routeAPI.update(routeId, data);

                await dispatch('syncWithVault', updatedRoute);
                commit('UPDATE_ROUTE', updatedRoute);
                return updatedRoute;
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async destroy({ commit }, routeId) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                await routeAPI.delete(routeId);
                commit('REMOVE_ROUTE', routeId);
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async fetchRouteGeometry({ commit }, routeNumber) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const geometry = await routeAPI.getRouteGeometry(routeNumber);
                commit('SET_ROUTE_GEOMETRY', { routeNumber, geometry });
                return geometry;
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async updateRouteGeometry({ commit }, { routeNumber, geometry }) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const updatedGeometry = await routeAPI.updateRouteGeometry(routeNumber, { geometry });
                commit('SET_ROUTE_GEOMETRY', { routeNumber, geometry: updatedGeometry });
                return updatedGeometry;
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async fetchRouteStops({ commit }, { routeNumber, direction = 0 }) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const stops = await routeAPI.getRouteStops(routeNumber, direction);
                commit('SET_ROUTE_STOPS', { routeNumber, direction, stops });
                return stops;
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
        },

        enableDrawingMode({ commit }) {
            commit('SET_DRAWING_MODE', true);
        },

        disableDrawingMode({ commit }) {
            commit('SET_DRAWING_MODE', false);
        },

        async bulkUpdateStatus({ dispatch, commit }, { routeIds, isActive }) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const promises = routeIds.map(routeId =>
                    routeAPI.updateStatus(routeId, { is_active: isActive })
                );

                const updatedRoutes = await Promise.all(promises);

                updatedRoutes.forEach(route => {
                    commit('UPDATE_ROUTE', route);
                });

                return updatedRoutes;
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async searchRoutes({ dispatch }, searchQuery) {
            return await dispatch('fetchAll', {
                page: 1,
                search: searchQuery
            });
        },

        async fetchRouteStatistics({ commit }) {
            commit('SET_LOADING', true);
            commit('CLEAR_ERROR');

            try {
                const stats = await routeAPI.getStatistics();
                return stats;
            } catch (error) {
                commit('SET_ERROR', error.response?.data?.message || error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        }
    }
};
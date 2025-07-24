import routeAPI from "@/api/routeAPI";
import { arrayify, use } from "@/utils";
import { unionBy, merge, differenceBy } from 'lodash';

export default {
    namespaced: true,

    state() {
        return {
            routes: [],
        }
    },

    getters: {

        getRoutes(state) {
            return state.routes;
        }
    },

    mutations: {

        SET_ROUTES(state, routes) {
            state.routes = routes;
        },

        ADD_ROUTE(state, route) {
            state.routes.push(route);
        },


        UPDATE_STOP(state, updatedRoute) {
            const index = state.routes.findIndex(route => route.id === updatedRoute.id);
            if (index !== -1) {
                state.stops.splice(index, 1, updatedRoute);
            }
        },

        REMOVE_STOP(state, route) {
            state.routes = differenceBy(state.routes, [route], 'id');
          },
    },

    actions: {
        async paginate({ commit, dispatch }, params) {
            console.log('1');
            
            let page = params.page;
            const routes = await routeAPI.getAll(params);  
            console.log(routes);
            
            await dispatch('syncWithVault', routes.items);      
            commit('SET_ROUTES', routes.items);
         
            return routes.isLastPage ? null : ++page;
        },

        async store({commit}, data) {
            const route = await routeAPI.store(data);
            commit('ADD_ROUTE', route);
            return route;            
        },
    }
}


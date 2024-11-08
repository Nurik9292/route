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
        async paginate({ commit, state }, params) {

         
            const res = await routeAPI.getAll(params);
            console.log(res);
            
            const routes = res._embedded.routeList;
            const links = res._links;
        
            const mergedRoutes = unionBy(state.routes, routes, 'id');
            const { sort = 'id', order = 'asc' } = params;

            const sortedRoutes = mergedRoutes.sort((a, b) => {
                if (order === 'asc') {
                    return a[sort] > b[sort] ? 1 : -1;
                } else {
                    return a[sort] < b[sort] ? 1 : -1;
                }
            });
            

            commit('SET_ROUTES', sortedRoutes);

            return links.next ? ++res.page.number : null;
        },
    }
}


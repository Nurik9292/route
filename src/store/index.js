import { createStore } from 'vuex';

import adminModule from './modules/admin.js';
import commonModule from './modules/common.js';
import stopsModule from './modules/stops.js';
import routesModule from './modules/routes.js';
import citiesModule from './modules/cities.js';
import bannersModule from './modules/banners.js';

const store = createStore({
    modules: {
        admin: adminModule,
        common: commonModule,
        stops: stopsModule,
        routes: routesModule,
        cities: citiesModule,
        banners: bannersModule
    },


    getters: {
        currentAdmin: (state, getters) => getters['admin/currentAdmin'],

        isAuthenticated: (state, getters) => getters['admin/isAuthenticated'],

        userFullName: (state, getters) => getters['admin/userFullName'],

        isSuperAdmin: (state, getters) => getters['admin/isSuperAdmin'],
    },

    actions: {

    },


});



export default store;
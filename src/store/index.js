import { createStore } from 'vuex';

import userModule from './modules/staff.js';
import commonModule from './modules/common.js';
import stopsModule from './modules/stops.js';
import routesModule from './modules/routes.js';
import citiesModule from './modules/cities.js';
import bannersModule from './modules/banners.js';

const store = createStore({
    modules: {
        user: userModule,
        common: commonModule,
        stops: stopsModule,
        routes: routesModule,
        cities: citiesModule,
        banners: bannersModule
    }

});

export default store;
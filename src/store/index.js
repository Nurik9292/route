import { createStore } from 'vuex';

import userModule from './modules/user.js';
import commonModule from './modules/common.js';
import stopsModule from './modules/stops.js';
import routesModule from './modules/routes.js';

const store = createStore({
    modules: {
        user: userModule,
        common: commonModule,
        stops: stopsModule,
        routes: routesModule
    }

});

export default store;
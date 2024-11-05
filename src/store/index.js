import { createStore } from 'vuex';

import userModule from './modules/user.js';
import commonModule from './modules/common.js';
import stopsModule from './modules/stops.js';

const store = createStore({
    modules: {
        user: userModule,
        common: commonModule,
        stops: stopsModule
    }

});

export default store;
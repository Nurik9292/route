import { createStore } from 'vuex';

import userModule from './modules/user.js';
import commonModule from './modules/common.js';

const store = createStore({
    modules: {
        user: userModule,
        common: commonModule
    }

});

export default store;
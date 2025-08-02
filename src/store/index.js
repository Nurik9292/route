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
        async initializeApp({ dispatch }, userData) {
            try {
                await dispatch('admin/init', userData);

                await dispatch('common/init');

                // if (userData.isSuperAdmin || userData.admin) {
                //     await Promise.all([
                //         dispatch('stops/fetchAll'),
                //         dispatch('routes/fetchAll'),
                //         dispatch('cities/fetchAll'),
                //         dispatch('banners/paginate', { page: 1 })
                //     ]);
                // }

                console.log('🎉 Приложение инициализировано успешно');

            } catch (error) {
                console.error('❌ Ошибка инициализации приложения:', error);
                throw error;
            }
        },

        async clearAll({ dispatch }) {
            await Promise.all([
                dispatch('admin/clear'),
                dispatch('common/clear'),
            ]);

            console.log('🧹 Все данные приложения очищены');
        }
    },

    strict: import.meta.env.DEV,

    plugins: import.meta.env.DEV ? [
        (store) => {
            store.subscribe((mutation, state) => {
                if (mutation.type.includes('SET_LOADING')) return;

                console.log('🔄 Vuex Mutation:', mutation.type, mutation.payload);
            });

            store.subscribeAction((action, state) => {
                if (action.type.includes('fetch') || action.type.includes('sync')) {
                    console.log('⚡ Vuex Action:', action.type);
                }
            });
        }
    ] : []

});



export default store;
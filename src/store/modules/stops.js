import stopAPI from "@/api/stopAPI";
import { isStop, arrayify, use } from "@/utils";
import { unionBy, merge, differenceBy } from 'lodash';


export default {
    namespaced: true,

    state() {
        return {
            stops: [],
            vault: new Map()
        }
    },

    getters: {

        getStops(state) {
            return state.stops;
        },

        byId({ state }, id) {
            const stop = state.vault.get(id);
            if (!stop || (!isStop(stop) && stop.deleted)) return;
            return stop;
        },

        byIds({ state, getters }, ids) {
            const stops = [];
            ids.forEach(id => use(getters.byId(id), stop => stops.push(stop)));
            return stops;
        }
    },

    mutations: {
        SYNC_WITH_VAULT(state, stop) {
            state.vault.set(stop.id, stop);
        },

        SET_STOPS(state, stops) {
            state.stops = stops;
        },

        ADD_STOP(state, stop) {
            state.stops.push(stop);
        },


        UPDATE_STOP(state, updatedStop) {
            const index = state.stops.findIndex(stop => stop.id === updatedStop.id);
            if (index !== -1) {
                state.stops.splice(index, 1, updatedStop);
            }
        },

        REMOVE_STOP(state, stop) {
            state.stops = differenceBy(state.stops, [stop], 'id');  
            state.vault.delete(stop.id);
          },

    },

    actions: {

        async store({commit}, data) {
            const stop = await stopAPI.store(data);
            commit('ADD_STOP', stop);
            return stop;            
        },

        async update({commit},{stopId, data}) {
            const updateStop = await stopAPI.update(stopId, data);
            commit('UPDATE_STOP', updateStop);
            
            return updateStop;
        },

        async destroy({ commit }, stop) {
            await stopAPI.destroy(stop.id);
            commit('REMOVE_STOP', stop);
        },

        async fetchAll({commit, dispatch}) {
            const stops = await stopAPI.fetchAll(); 
            await dispatch('syncWithVault', stops);
            commit('SET_STOPS', stops);
        },

        async paginate({ commit, dispatch }, params) {
            let page = params.page;
            const stops = await stopAPI.getAll(params);  
          
            await dispatch('syncWithVault', stops.items);      
            commit('SET_STOPS', stops.items);

            return stops.isLastPage ? null : ++page;
        },

        syncWithVault({ state, commit }, stops) {

            const syncedStops = arrayify(stops).map(stop => {
                let local = state.vault.get(stop.id);

                if (local) {
                    merge(local, stop);
                } else {
                    local = stop;
                    commit('SYNC_WITH_VAULT', local);
                }

                return local;
            });

            return syncedStops;
        }

    }
}
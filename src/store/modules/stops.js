import { secondsToHumanReadable, isStop, arrayify, use, logger } from "@/utils";
import slugify from 'slugify';

export default {
    namespaced: true,

    state() {
        return {
            stops: [],
            vault: new Map()
        }
    },

    getters: {
        
        getFormattedLength( state , stops) {
            return secondsToHumanReadable(sumBy(arrayify(stops), 'length'));
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
        SYNC_WITH_VAULT ( {state, dispatch} , stops) {
            arrayify(stops).forEach(stop => {
                let local = state.vault.get(stop.id);

                if (local) {
                     merge(local, stop); 
                } else {
                    local = reactive(stop)
                    state.vault.set(local.id, local)
                }
            })
        },

        SET_STOPS ( state , stops) {
            state.stops = stops;
          }
    
    },

    actions:{

        async resolve ({ getters, commit }, id) {
            let stop = getters.byId(id);
            if (!stop) {
              try {
                const response = await http.get(`stop/${id}`);
                commit('SYNC_WITH_VAULT', response);
                stop = response[0]
              } catch (error) {
                logger.error(error);
              }
            }
            return playable
        },

        match ({}, { title, songs }) {
            title = slugify(title.toLowerCase());
            return songs.find(song => slugify(song.title.toLowerCase()) === title) || null;
          },
    }       
}
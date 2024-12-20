import { differenceBy, merge } from 'lodash';
import { arrayify } from '@/utils';
import cityAPI from '@/api/cityAPI';


export default {
    namespaced: true,

    state() {
        return {
            cities: [],
            vault: new Map()
        }
    },

    getters: {
        getCities(state) {
            return state.cities;
        }
    },

    mutations: {
        SET_CITIES(state, cities) {
            state.cities = cities;
          },
          
          ADD_CITY(state, city) {
            state.cities.push(city);
          },

          UPDATE_CITY(state, city) {
            const index = state.cities.findIndex(u => u.id === city.id)
            if (index !== -1) 
              state.cities.splice(index, 1, city);
            
          },

          REMOVE_CITY(state, city) {
            state.cities = differenceBy(state.cities, [city], 'id');
            state.vault.delete(city.id);
          },

        

          SYNC_WITH_VAULT(state, cities) {
            arrayify(cities).forEach(city => {
              let local = state.vault.get(city.id);
              local = local ? merge(local, city) : city;
              state.vault.set(city.id, local)
            });
          }
    },


    actions: {
          
          async paginate({ commit, dispatch }, params) {
            let page = params.page;
            const cities = await cityAPI.getAll(params);     
                             
            await dispatch('syncWithVault', cities.items);
            commit('SET_CITIES', cities.items);

            return cities.isLastPage ? null : ++page;
          },

          syncWithVault({ commit }, cities) {
            commit('SYNC_WITH_VAULT', cities);
          },
        
          async store({ dispatch }, data) {
            const city = await cityAPI.store(data);
            await dispatch('add', city);
            return city;
          },
        
          add({ commit, dispatch }, city) {
            dispatch('syncWithVault', city);
            commit('ADD_CITY', city);
          },
        
          async update({ dispatch },  { cityId, data } ) {            
            const updatedCity =  await cityAPI.update(cityId, data);
            await dispatch('syncWithVault', updatedCity);
            return updatedCity;
          },
        
          async destroy({ commit }, city) {
            await cityAPI.delete(city.id);
            commit('REMOVE_CITY', city);
          }
    }
}
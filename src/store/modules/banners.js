import { differenceBy, merge } from 'lodash';
import { arrayify } from '@/utils';
import bannerAPI from '@/api/bannerAPI';


export default {
    namespaced: true,

    state() {
        return {
            banners: [],
            vault: new Map()
        }
    },

    getters: {
        getBanners(state) {
            return state.banners;
        }
    },

    mutations: {
        SET_BANNERS(state, banners) {
            state.banners = banners;
          },
          
          ADD_BANNER(state, banner) {
            state.banners.push(banner);
          },

          UPDATE_BANNER(state, banners) {
            const index = state.banners.findIndex(u => u.id === banner.id)
            if (index !== -1) 
              state.banners.splice(index, 1, banner);
            
          },

          REMOVE_BANNER(state, banners) {
            state.banners = differenceBy(state.banners, [banners], 'id');
            state.vault.delete(banners.id);
          },

        

          SYNC_WITH_VAULT(state, banners) {
            arrayify(banners).forEach(banner => {
              let local = state.vault.get(banner.id);
              local = local ? merge(local, banner) : banner;
              state.vault.set(banner.id, local)
            });
          }
    },


    actions: {
          
          async paginate({ commit, dispatch }, params) {
            let page = params.page;
            console.log(params);
            
            const banners = await bannerAPI.getAll(params);     
                             
            await dispatch('syncWithVault', banners.items);
            commit('SET_BANNERS', banners.items);

            return banners.isLastPage ? null : ++page;
          },

          syncWithVault({ commit }, cities) {
            commit('SYNC_WITH_VAULT', cities);
          },
        
          async store({ dispatch }, data) {
            const banner = await bannerAPI.store(data);
            await dispatch('add', banner);
            return banner;
          },
        
          add({ commit, dispatch }, banner) {
            dispatch('syncWithVault', banner);
            commit('ADD_BANNER', banner);
          },
        
          async update({ dispatch },  { bannerId, data } ) {            
            const updatedBanner =  await bannerAPI.update(bannerId, data);
            await dispatch('syncWithVault', updatedBanner);
            return updatedBanner;
          },
        
          async destroy({ commit }, banner) {
            await bannerAPI.delete(banner.urlImage);
            commit('REMOVE_BANNER', banner);
          }
    }
}
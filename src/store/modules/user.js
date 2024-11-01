import { differenceBy, merge } from 'lodash';
import { arrayify } from '@/utils';
import userAPI from '@/api/userAPI';

export default {
    namespaced: true,

    state() {
        return {
            users: [],
            current: null,
            vault: new Map()
        }
    },

    getters: {
        currentUser(state) {
            return state.current;
          },

          byId: (state) => (id) => {
            return state.vault.get(id);
          },

          users(state) {
            return state.users;
          }


    },
    
    mutations: {
        SET_USERS(state, users) {
            state.users = users;
          },

          SET_CURRENT_USER(state, user) {
            state.current = user;
          },
          
          ADD_USER(state, user) {
            state.users.push(user);
          },

          UPDATE_USER(state, user) {
            const index = state.users.findIndex(u => u.id === user.id)
            if (index !== -1) 
              state.users.splice(index, 1, user);
            
          },

          REMOVE_USER(state, user) {
            state.users = differenceBy(state.users, [user], 'id');
            state.vault.delete(user.id);
          },

          SYNC_WITH_VAULT(state, users) {
            arrayify(users).forEach(user => {
              let local = state.vault.get(user.id);
              local = local ? merge(local, user) : user;
              state.vault.set(user.id, local)
            });
          }
    },

    actions: {
        async init({ commit, dispatch }, currentUser) {
            await dispatch('syncWithVault', currentUser);
            commit('SET_CURRENT_USER', currentUser);
          },
          
          async fetchUsers({ commit, dispatch }) {
            const users = await userAPI.getAll();            
            await dispatch('syncWithVault', users);
            commit('SET_USERS', users);
          },
        
          syncWithVault({ commit }, users) {
            commit('SYNC_WITH_VAULT', users);
          },
        
          async store({ dispatch }, data) {
            const user = await userAPI.store(data);
            await dispatch('add', user);
            return user;
          },
        
          add({ commit, dispatch }, user) {
            dispatch('syncWithVault', user);
            commit('ADD_USER', user);
          },
        
          async update({ dispatch },  {userId, data} ) {
            const updatedUser =  await userAPI.update(userId, data);
            await dispatch('syncWithVault', updatedUser);
            return updatedUser;
          },
        
          async destroy({ commit }, user) {
            console.log(user);
            
            await userAPI.destroy(user.id);
            commit('REMOVE_USER', user);
          }
    }
}
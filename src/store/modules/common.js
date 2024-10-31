import homeAPI from "@/api/homeAPI";

export default {

    namespaced: true,

    state() {
        return {
            current_user: null,
            users: [],
        }
    },

    getters: {

        currentUser(state) {
            return state.current_user;
        }
    },

    mutations: {
        SET_CURRENT_USER(state, current_user) {
            state.current_user = current_user;
        }
    },

    actions: {
        async init({dispatch, commit}) {
            const currentUser = await homeAPI.fetchData();
            
            commit('SET_CURRENT_USER', currentUser);

            await dispatch('user/init', currentUser, { root: true });
        }
    }
}
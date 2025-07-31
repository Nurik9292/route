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
            // await homeAPI.fetchData().then(res => {
            //     const currentUser = res;
            //     commit('SET_CURRENT_USER', currentUser);
            //     dispatch('user/init', currentUser, { root: true });
            // });
        }
    }
}
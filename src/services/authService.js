import authAPI from "@/api/authAPI";
import staffAPI from "@/api/staffAPI";
import { useLocalStorage } from "@/composables";
import store from "@/store";
import { merge } from 'lodash';

const API_TOKEN_STORAGE_KEY = 'api-token';

const { get: lsGet, set: lsSet, remove: lsRemove } = useLocalStorage(false);

export const authService = {

  async login(name, password) {    
    this.setTokensUsingCompositeToken( await authAPI.postSignIn({ name, password }));
  },

  async logout() {
    await authAPI.delete();
    this.destroy();
  },

  getProfile: async () => await http.get < User > ('me'),

  async updateProfile (data) {
    const newUser = await staffAPI.me(data);
    this.destroy();
    merge(store.state['user/current'], newUser);
  },

  getApiToken: () => lsGet(API_TOKEN_STORAGE_KEY),

  hasApiToken() {
    return Boolean(this.getApiToken())
  },

  setTokensUsingCompositeToken(compositeToken) {
      this.setApiToken(compositeToken);
  },

  setApiToken: (token) => lsSet(API_TOKEN_STORAGE_KEY, token),

  destroy: () => {
    lsRemove(API_TOKEN_STORAGE_KEY)
  },


}
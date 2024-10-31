import authAPI from "@/api/authAPI";
import { useLocalStorage } from "@/composables";

const API_TOKEN_STORAGE_KEY = 'api-token';

const { get: lsGet, set: lsSet, remove: lsRemove } = useLocalStorage(false);

export const authService = {

  async login(name, password) {
    this.setTokensUsingCompositeToken(await authAPI.postSignIn({ name, password }));
  },

  async logout() {
    await authAPI.delete();
    this.destroy();
  },

  getProfile: async () => await http.get < User > ('me'),

  updateProfile: async (data) => {
    merge(userStore.current, (await http.put < User > ('me', data)))
  },

  getApiToken: () => lsGet(API_TOKEN_STORAGE_KEY),

  hasApiToken() {
    return Boolean(this.getApiToken())
  },

  setTokensUsingCompositeToken(compositeToken) {
    this.setApiToken(compositeToken.token)
  },

  setApiToken: (token) => lsSet(API_TOKEN_STORAGE_KEY, token),

  destroy: () => {
    lsRemove(API_TOKEN_STORAGE_KEY)
  },


}
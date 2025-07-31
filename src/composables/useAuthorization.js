import { computed, toRef } from 'vue';
import { useStore } from 'vuex';

export const useAuthorization = () => {
  const store = useStore();
  const currentUser = computed(() => store.getters['admin/currentUser']);
  const isAdmin = true;

  return {
    currentUser,
    isAdmin
  }
}

import { computed, toRef } from 'vue';
import { useStore } from 'vuex';

export const useAuthorization = () => {
  const store = useStore();
  const currentAdmin = computed(() => store.getters['admin/currentAdmin']);
  const isSuperAdmin = computed(() => store.getters['admin/isSuperAdmin']);

  return {
    currentAdmin,
    isSuperAdmin
  }
}

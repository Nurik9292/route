import { computed, toRef } from 'vue';
import user from '@/store/modules/user';

export const useAuthorization = () => {
  const currentUser = toRef(user.state, 'curretn')
  const isAdmin = true;

  return {
    currentUser,
    isAdmin
  }
}

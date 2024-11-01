import { requireInjection } from '@/utils';
import { ModalContextKey } from '@/symbols';

export const useModal = () => {
  const [modalContext] = requireInjection(ModalContextKey);
    
  return {
    getFromContext: (key) => modalContext.value[key]
  }
}
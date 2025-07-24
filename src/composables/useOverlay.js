import { requireInjection } from '@/utils';
import { OverlayKey } from '@/symbols';


export const useOverlay = (overlay) => {
  overlay = overlay || requireInjection(OverlayKey)

  return {
    showOverlay: overlay.value.show.bind(overlay.value),
    hideOverlay: overlay.value.hide.bind(overlay.value)
  }
}

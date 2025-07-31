<template>
    <slot />
</template>

<script>
import { useDialogBox, useMessageToaster, useRouter } from '@/composables';
import { eventBus, forceReloadWindow } from '@/utils';
import { authService } from '@/services';

export default {
    name: 'GlobalEventListeners',

    mounted() {
  
        this.toastSuccess = useMessageToaster().toastSuccess;
        this.showConfirmDialog = useDialogBox().showConfirmDialog;
        this.go = useRouter().go;

        eventBus.on('STOP_DELETE', this.handleStopDelete);
        eventBus.on('LOG_OUT', this.handleLogout);
    },

    methods: {
        async handleStopDelete(stop) {
            if (await this.showConfirmDialog(`Delete the stop "${stop.name}"?`)) {
                await playlistStore.delete(stop);
                this.toastSuccess(`Stop "${stop.name}" deleted.`);
                this.go('stops');
            }
        },


        async handleLogout() {

            await authService.logout();
            forceReloadWindow();
        }
    }
}
</script>
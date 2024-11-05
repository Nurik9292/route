<template>
    <dialog ref="dialog"
        class="text-k-text-primary min-w-full md:min-w-[480px] border-0 p-0 rounded-md bg-k-bg-primary overflow-visible backdrop:bg-black/70"
        @cancel.prevent>
        <component :is="modalNameToComponentMap[activeModalName]" v-if="activeModalName" @close="close" />
    </dialog>
</template>

<script>
import { defineAsyncComponent, computed, watch } from 'vue';
import { eventBus, provideReadonly } from '@/utils';
import { ModalContextKey } from '@/symbols';

export default {
    name: 'ModalWrapper',

    data() {
        return {
            modalNameToComponentMap: {
                'add-user-form': defineAsyncComponent(() => import('../User/AddUserForm.vue')),
                'edit-user-form': defineAsyncComponent(() => import('../User/EditUserForm.vue')),
                'add-stop-form': defineAsyncComponent(() => import('../Stops/AddStopForm.vue')),
                'edit-stop-form': defineAsyncComponent(() => import('../Stops/EditStopForm.vue')),
            },
            activeModalName: null,
            context: {},
        };
    },

    mounted() {
        provideReadonly(ModalContextKey, computed(() => this.context));

        watch(
            () => this.activeModalName,
            (name) => (name ? this.$refs.dialog.showModal() : this.$refs.dialog.close())
        );

        eventBus.on('MODAL_SHOW_ADD_USER_FORM', () => (this.activeModalName = 'add-user-form'));
        eventBus.on('MODAL_SHOW_ADD_STOP_FORM', () => (this.activeModalName = 'add-stop-form'));
        eventBus.on('MODAL_SHOW_EDIT_USER_FORM', (user) => {
                this.context = { user };
                this.activeModalName = 'edit-user-form'});
        eventBus.on('MODAL_SHOW_EDIT_STOP_FORM', (stop) => {
                this.context = { stop };
                this.activeModalName = 'edit-stop-form'});
    },

    methods: {
        close() {
            this.activeModalName = null;
            this.context = {};
        },
    },
};
</script>

<style lang="postcss" scoped>
dialog {

    :deep(form),
    :deep(>div) {
        @apply relative;

        >header,
        >main,
        >footer {
            @apply px-6 py-5;
        }

        >footer {
            @apply mt-0 bg-black/10 border-t border-white/5 space-x-2;
        }

        >header {
            @apply flex bg-k-bg-secondary;

            h1 {
                @apply text-3xl leading-normal overflow-hidden text-ellipsis whitespace-nowrap;
            }
        }
    }
}
</style>
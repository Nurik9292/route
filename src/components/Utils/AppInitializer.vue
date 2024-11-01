<template>
    <slot />
</template>

<script>
import { mapActions } from 'vuex';
import { useErrorHandler, useOverlay } from '@/composables'

export default {
    name: 'AppInitializer',

    setup() {
        const { showOverlay, hideOverlay } = useOverlay();

        return {
            showOverlay, hideOverlay
        }
    },

    methods: {
        
        ...mapActions('common', {
            initCommon: 'init'
        }),


        async init() {
            this.showOverlay({ message: 'Просто немного терпения…' })

            try {
                await this.initCommon();
                this.$emit('success');
            } catch (error) {
                useErrorHandler().handleHttpError(error);
                this.$emit('error', error);
            } finally {
                this.hideOverlay();
            }
        },

    },

    async mounted() {
       await this.init();
    }
}
</script>
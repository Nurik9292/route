<template>
    <dialog ref="el" :class="state.type" class="border-0 p-0 bg-transparent backdrop:bg-black/80 outline-0"
        data-testid="overlay" @cancel.prevent="onCancel">
        <span class="flex items-baseline justify-center gap-3">
            <ItemBars v-if="state.type === 'loading'" />
            <Icon v-if="state.type === 'error'" :icon="faCircleExclamation" />
            <Icon v-if="state.type === 'warning'" :icon="faWarning" />
            <Icon v-if="state.type === 'info'" :icon="faCircleInfo" />
            <Icon v-if="state.type === 'success'" :icon="faCircleCheck" />

            <span class="message" v-html="state.message" />
        </span>
    </dialog>
</template>

<script>
import ItemBars from './ItemBars.vue';

export default {
    components: {
       ItemBars
    },
    data() {
        return {
            state: {
                dismissible: false,
                type: 'loading',
                message: ''
            }
        }
    },

    mounted() {
        this.el = this.$refs.el;
    },

    methods: {
        show(options = {}) {
            Object.assign(this.state, options)
            if (!this.el.open) {
                this.el.showModal()
            }
        },
        hide() {
            this.el.close()
        },
        onCancel() {
            if (this.state.dismissible) {
                this.hide()
            }
        }
    },
    
    expose: ['show', 'hide']
}
</script>

<style lang="postcss" scoped>
dialog {
    &.error {
        @apply text-red-400;
    }

    &.success {
        @apply text-green-400;
    }

    &.info {
        @apply text-blue-400;
    }

    &.loading {
        @apply text-k-text-secondary;
    }

    &.warning {
        @apply text-orange-400;
    }
}
</style>
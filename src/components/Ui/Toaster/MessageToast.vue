<template>
    <article 
        :class="message.type" 
        class="group rounded-l-md cursor-pointer flex items-stretch opacity-90 transition-transform duration-300 origin-right hover:opacity-100 hover:scale-110" 
        title="Click to dismiss" 
        @click="dismiss" 
        @mouseenter="cancelAutoDismiss"
        @mouseleave="setAutoDismiss"
    >
        <aside class="flex items-center px-3 py-0 bg-black/10">
            <Icon :icon="typeIcon" class="group-hover:hidden" />
            <Icon :icon="['fas', 'times-circle']" class="hidden group-hover:block" />
        </aside>
        <main class="flex-1 py-2 pl-3 pr-4">{{ message.content }}</main>
    </article>
</template>

<script>
export default {
    name: 'MessageToast',

    props: {
        message: {
            type: Object,
            required: true
        }
    },
    emits: ['dismiss'],
    data() {
        return {
            timeoutHandler: null
        }
    },
    computed: {
        typeIcon() {
            switch (this.message.type) {
                case 'info':
                    return ['fas', 'circle-info'];
                case 'success':
                    return ['fas', 'circle-check'];
                case 'warning':
                    return ['fas', 'triangle-exclamation'];
                default:
                    return ['fas', 'circle-exclamation']; 
            }
        }
    },

    methods: {
        dismiss() {
            this.$emit('dismiss', this.message);
            clearTimeout(this.timeoutHandler);
        },

        cancelAutoDismiss() {
            clearTimeout(this.timeoutHandler);
        },

        setAutoDismiss() {
            this.timeoutHandler = setTimeout(() => this.dismiss(), this.message.timeout * 1000);
        }
    },

    mounted() {
        this.setAutoDismiss();
    },
    
    beforeUnmount() {
        clearTimeout(this.timeoutHandler);
    }
}
</script>

<style lang="postcss" scoped>
.info {
    @apply bg-blue-600 text-blue-100;
}

.danger {
    @apply bg-red-700 text-red-100;
}

.success {
    @apply bg-green-600 text-green-100;
}

.warning {
    @apply bg-orange-600 text-orange-100;
}
</style>
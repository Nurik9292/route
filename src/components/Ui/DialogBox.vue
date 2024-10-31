<template>
    <dialog ref="dialog" :class="`${type}`"
        class="rounded-md shadow-xl border-0 p-0 min-w-[320px] max-w-[calc(100vw - 40px)] backdrop:bg-black/50">
        <div class="flex gap-5 py-6 px-7">
            <aside>
                <i class="text-lg w-[2.3rem] aspect-square flex justify-center items-center rounded-full">
                    <Icon v-if="type === 'info'" :icon="['fas', 'info']" />
                    <Icon v-if="type === 'success'" :icon="['fas', 'check']" />
                    <Icon v-if="type === 'warning'" :icon="['fas', 'triangle-exclamation']" />
                    <Icon v-if="type === 'danger'" :icon="['fas', 'exclamation']" />
                    <Icon v-if="type === 'confirm'" :icon="['fas', 'question']" />
                </i>
            </aside>

            <main>
                <h3 v-if="title" class="text-2xl mb-4">{{ title }}</h3>
                <div class="mt-2">{{ message }}</div>
            </main>
        </div>

        <footer class="flex justify-end gap-2 px-6 py-4">
            <BtnComponent v-if="showCancelButton" gray name="cancel" @click.prevent="cancel">Cancel</BtnComponent>
            <BtnComponent name="ok">OK</BtnComponent>
        </footer>
    </dialog>
</template>

<script>
import BtnComponent from './Form/BtnComponent.vue';

export default {
    name: 'DialogBox',

    components: {
        BtnComponent
    },

    data() {
        return {
            dialog: null,
            type: 'info',
            title: '',
            message: '',
        }
    },

    computed: {
        showCancelButton() {
            return this.type === 'confirm';
        },
    },

    mounted() {
        this.dialog = this.$refs.dialog;
    },

    methods: {
        close() {
            this.dialog?.close()
        },

        cancel() {
            this.dialog?.dispatchEvent(new Event('cancel'))
        },

        waitForInput() {
            return new Promise((resolve) => {
                this.dialog.addEventListener('cancel', () => {
                    this.close()
                    resolve(false)
                }, { once: true })

                this.dialog.querySelector('[name=ok]').addEventListener('click', () => {
                    this.close()
                    resolve(true)
                }, { once: true })
            })
        },
        
        async show(_type, _message, _title = '') {
            this.type = _type
            this.message = _message
            this.title = _title
            this.dialog.showModal()
            return this.waitForInput()
        },

        async success(message, title = '') {
            return this.show('success', message, title)
        },

        async info(message, title = '') {
            return this.show('info', message, title)
        },

        async warning(message, title = '') {
            return this.show('warning', message, title)
        },

        async error(message, title = '') {
            return this.show('danger', message, title)
        },

        async confirm(message, title = '') {
            return this.show('confirm', message, title)
        }
    },


}
</script>


<style lang="postcss" scoped>
dialog {
    --dialog-bg-color: #fff;
    --dialog-fg-color: #333;
    --dialog-footer-bg-color: rgba(0, 0, 0, .05);

    @media (prefers-color-scheme: dark) {
        --dialog-bg-color: rgb(38 38 38);
        --dialog-fg-color: #eee;
        --dialog-footer-bg-color: rgba(255, 255, 255, .02);
    }

    background: var(--dialog-bg-color);
    color: var(--dialog-fg-color);

    footer {
        background: var(--dialog-footer-bg-color);
    }

    &.info aside i {
        @apply bg-blue-100 text-blue-600;
    }

    &.success aside i {
        @apply bg-green-100 text-green-600;
    }

    &.confirm aside i {
        @apply bg-purple-100 text-purple-700;
    }

    &.warning aside i {
        @apply bg-orange-100 text-orange-600;
    }

    &.danger aside i {
        @apply bg-red-300 text-red-800;
    }
}
</style>

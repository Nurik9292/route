<template>
    <div @click="onClickOutside">
        <form
            class="flex border rounded-md overflow-hidden border-solid border-white/10 focus-within:bg-black/10 focus-within:border-white/40"
            @submit.prevent>
            <BtnComponent v-tooltip title="Filter" transparent unrounded @click.prevent="toggleInput">
                <Icon :icon="['fas', 'filter']" fixed-width />
            </BtnComponent>
            <TextInput v-show="showingInput" ref="input" v-model="keywords"
                class="!text-k-text-primary !bg-transparent !rounded-none !pl-0 !h-[unset] placeholder:text-white/50 focus-visible:outline-0"
                placeholder="Keywords" type="search" @blur="maybeClose" 
            />
        </form>
    </div>
</template>

<script>
import BtnComponent from './Form/BtnComponent.vue';
import TextInput from './Form/TextInput.vue';

export default {
    name: 'ListFilter',

    components: {
        BtnComponent,
        TextInput
    },

    data() {
        return {
            showingInput: false,
            keywords: '',
            input: null
        }
    },

    emits: ['change'],

    watch: {
        keywords(value) {
            this.$emit('change', value)
        }
    },

    methods: {
        toggleInput() {
            this.showingInput = !this.showingInput

            if (this.showingInput) {
                this.$nextTick(() => {
                    this.input?.el?.focus()
                    this.input?.el?.select()
                })
            } else {
                this.input?.el?.blur()
                this.keywords = ''
            }
        },

        maybeClose() {
            if (this.keywords.trim() !== '') return

            this.showingInput = false
            this.input?.el?.blur()
            this.keywords = ''
        },

        onClickOutside(event) {
            const form = this.$refs.form;

            if (form && !form.contains(event.target))
                this.maybeClose();
            
        }
    },

    mounted() {
        this.input = this.$refs.input;
        document.addEventListener('click', this.onClickOutside);
    },

    beforeDestroy() {
        document.removeEventListener('click', this.onClickOutside);
    }

}
</script>
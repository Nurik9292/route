<template>
    <form
        id="searchForm"
        class="text-k-text-secondary flex items-stretch border overflow-hidden gap-2 pl-4 pr-0 py-0 rounded-md
        border-solid border-transparent bg-black/20 focus-within:border-white/20 focus-within:bg-black/50
        transition-[border,_background-color] duration-200 ease-in-out"
        role="search"
        @submit.prevent="onSubmit"
    >

        <TextInput
        ref="input"
        v-model="q"
        :class="{ dirty: q }"
        :placeholder="placeholder"
        autocorrect="false"
        class="w-full rounded-none h-[36px] !bg-transparent !text-k-text-primary !placeholder:text-white/50
        focus-visible:outline-0 !px-2"
        name="q"
        required
        spellcheck="false"
        type="search"
        @focus="maybeGoToSearchScreen"
        @input="onInput"
        />
        
    </form>
</template>

<script>
import { useRouter } from '@/composables/useRouter';
import { eventBus } from '@/utils/eventBus';
import isMobile from 'ismobilejs';

import TextInput from './Form/TextInput.vue';

export default {
    name: 'SearchForm',

    components: {
        TextInput
    },

    setup() {
        const { go } = useRouter();

        return { go };
    },

    data() {
        return {
            query: '',
            placeholder: isMobile.any ? 'Search' : 'Press F to search',
            input: null,
        }
    },

    mounted() {
        this.input = this.$refs.input;
    
        eventBus.on('FOCUS_SEARCH_FIELD', () => {
            this.input?.el?.focus();
            this.input?.el?.select();
        });
    },
 
    beforeUnmount() {
        eventBus.off('FOCUS_SEARCH_FIELD');
    },

    methods: {

        onInput() {
            const _q = this.q.trim();
            if (_q) 
                eventBus.emit('SEARCH_KEYWORDS_CHANGED', _q);    
        },

        onSubmit() {
            eventBus.emit('TOGGLE_SIDEBAR');
            this.go('search');
        },

        maybeGoToSearchScreen() {
            if (isMobile.any)
                return;
            this.go('search');
        },
    }
}
</script>
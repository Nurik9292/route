<template>
    <div class="relative">
        <TextInput v-model="value" :type="type" class="w-full" data-testid="input" v-bind="$attrs" />
        <button class="absolute p-2.5 right-0 top-0 text-k-bg-primary" data-testid="toggle" type="button"
            @click.prevent="toggleReveal">
            <Icon v-if="type === 'password'" :icon="['fas', 'eye']" />
            <Icon v-else :icon="['fas', 'eye-slash']" />
        </button>
    </div>
</template>

<script>
import TextInput from './TextInput.vue';

export default {
    name: 'PasswordField',

    components: {
        TextInput,
    },

    props: {
        modelValue: {
            type: String,
            default: '',
        },
    },

    data() {
        return {
            type: 'password',
        };
    },

    computed: {
        value: {

            get() {
                return this.modelValue;
            },

            set(value) {
                this.$emit('update:modelValue', value);
            },
        },
    },

    methods: {
        toggleReveal() {
            this.type = this.type === 'password' ? 'text' : 'password';
        },
    },
};
</script>

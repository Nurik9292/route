<template>
    <input
        ref="el"
        v-model="value"
        class="block text-base w-full px-4 py-2.5 rounded bg-k-bg-input text-k-text-input
        read-only:bg-gray-400 read-only:text-gray-900 disabled:bg-gray-400 disabled:text-gray-900"
        type="text"
    > 
</template>

<script>
export default {
    name: 'TextInput',

    props: {
        modelValue: {
            type: [String, Number, Object],
            default: null
        }
    },

    emits: ['update:modelValue'],

    data() {
        return {
          el: null,
        };
    },

    computed: {
        value: {
          get() {
            return this.modelValue;
          },
          set(newValue) {
            this.$emit('update:modelValue', newValue);
          }
        }
    },

    mounted() {
        this.el = this.$refs.el;
    },

}
</script>
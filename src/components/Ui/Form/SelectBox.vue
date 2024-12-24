<template>
    <label class="relative bg-white text-gray-800 rounded">
        <select
          ref="el"
          v-model="internalValue"
          class="appearance-none w-full pl-4 pr-8 py-2.5 text-base text-current"
          required
        >
          <slot />
        </select>
        <Icon
          :icon="['fas', 'caret-down']"
          class="text-k-highlight pointer-events-none absolute top-1/3 right-[8px]"
          size="sm"
        />
    </label>
</template>

<script>
export default {
    name: 'SelectBox',

    emits: ['update:modelValue'],

    props: {
        modelValue: {
            type: [String, Number, Object, Boolean, Array],
            default: null,
        },
    },

    computed: {
        internalValue: {
          get() {
            return this.modelValue; 
          },
          set(value) {
            this.$emit('update:modelValue', value);
          },
        },
    },
}
</script>

<style lang="postcss" scoped>
select {
  background: none; 
}
</style>
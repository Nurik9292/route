<template>
  <label class="relative bg-white text-gray-800 rounded">
    <select
        ref="el"
        v-model="internalValue"
        class="appearance-none w-full pl-4 pr-8 py-2.5 text-base text-current"
        required
    >
      <option v-if="placeholder !== null" :value="null" disabled hidden>
        {{ placeholder }}
      </option>

      <option
          v-for="option in options"
          :key="option[valueKey]"
          :value="option[valueKey]"
      >
        {{ option[labelKey] }}
      </option>
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
    options: {
      type: Array,
      default: () => [],
    },
    valueKey: {
      type: String,
      default: 'value',
    },
    labelKey: {
      type: String,
      default: 'label',
    },
    placeholder: {
      type: String,
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
};
</script>

<style lang="postcss" scoped>
select {
  background: none;
}
</style>

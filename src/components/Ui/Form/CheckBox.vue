<template>
    <input
      v-model="value"
      :checked="value"
      class="relative align-bottom inline-block w-[32px] h-[20px] bg-gray-400 rounded-full shadow-inner cursor-pointer transition-all duration-200 ease-in-out mr-2
      after:h-[16px] after:aspect-square after:absolute after:bg-white after:top-[2px] after:left-[2px] after:rounded-full after:transition-left after:duration-200 after:ease-in-out
      checked:bg-k-highlight checked:after:left-[14px]"
      type="checkbox"
      v-bind="$attrs"
    />
  </template>
  
  <script>
  export default {
    name: 'CheckBox',

    props: {
      modelValue: {
        type: Boolean,
        default: false,
      },
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
  }
  </script>
  
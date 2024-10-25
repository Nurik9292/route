<template>
    <label 
        class="btn-toggle hidden md:flex w-[24px] aspect-square absolute rounded-full -right-[12px] top-[27px]
        items-center justify-center z-10 text-k-text-secondary bg-k-bg-secondary border-[1.5px] border-white/20 cursor-pointer
        hover:text-k-text-primary hover:bg-k-highlight"
    >
        <input v-model="internalValue" class="hidden" type="checkbox">
        <Icon :class="internalValue || 'scale-x-[-1]'" :icon="['fa', 'angle-left']" class="transition" />
    </label>
</template>

<script>

export default {
    name: 'SidebarToggleButton',

    props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },

  emits: ['update:modelValue'],

  data() {
    return {
      internalValue: this.modelValue
    }
  },

  watch: {
    modelValue(newValue) {
      this.internalValue = newValue;
    },
    internalValue(newValue) {
      this.$emit('update:modelValue', newValue);
    }
  },
}
</script>
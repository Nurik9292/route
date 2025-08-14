<template>
  <div class="flex justify-between items-center text-sm">
    <div class="flex items-center text-k-text-secondary">
      <Icon
          :icon="['fas', icon]"
          :class="iconColorClass"
          class="mr-2 text-sm"
      />
      <span>{{ label }}:</span>
    </div>
    <span class="font-medium" :class="valueColorClass">{{ value }}</span>
  </div>
</template>

<script>

export default {
  name: 'StatItem',

  components: {
  },

  props: {
    label: {
      type: String,
      required: true
    },
    value: {
      type: [String, Number],
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: 'gray',
      validator: (value) => ['blue', 'green', 'yellow', 'red', 'purple', 'indigo', 'orange', 'gray'].includes(value)
    }
  },

  computed: {
    iconColorClass() {
      const colors = {
        blue: 'text-blue-500',
        green: 'text-green-500',
        yellow: 'text-yellow-500',
        red: 'text-red-500',
        purple: 'text-purple-500',
        indigo: 'text-indigo-500',
        orange: 'text-orange-500',
        gray: 'text-gray-500'
      }
      return colors[this.color] || colors.gray
    },

    valueColorClass() {
      const colors = {
        blue: 'text-blue-600',
        green: 'text-green-600',
        yellow: 'text-yellow-600',
        red: 'text-red-600',
        purple: 'text-purple-600',
        indigo: 'text-indigo-600',
        orange: 'text-orange-600',
        gray: 'text-gray-600'
      }
      return colors[this.color] || colors.gray
    }
  }
}
</script>
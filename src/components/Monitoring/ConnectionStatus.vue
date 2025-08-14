<template>
  <div class="flex items-center">
    <div
        class="w-2 h-2 rounded-full mr-1"
        :class="statusColor"
    ></div>
    <span :class="textColor" class="text-xs">{{ statusText }}</span>
  </div>
</template>

<script>
export default {
  name: 'ConnectionStatus',

  props: {
    isConnected: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    statusColor() {
      return this.isConnected ? 'bg-green-500' : 'bg-red-500'
    },

    textColor() {
      return this.isConnected ? 'text-green-600' : 'text-red-600'
    },

    statusText() {
      return this.isConnected ? 'Онлайн' : 'Офлайн'
    }
  }
}
</script>
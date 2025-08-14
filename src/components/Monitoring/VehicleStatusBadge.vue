<template>
  <div class="flex items-center text-xs">
    <div
        class="w-2 h-2 rounded-full mr-1"
        :class="statusColor"
    ></div>
    <span :class="statusTextColor">{{ statusText }}</span>
  </div>
</template>

<script>
export default {
  name: 'VehicleStatusBadge',

  props: {
    vehicle: {
      type: Object,
      required: true
    }
  },

  computed: {
    statusColor() {
      if (this.isOnline && this.vehicle.isMoving) return 'bg-green-500'
      if (this.isOnline && !this.vehicle.isMoving) return 'bg-yellow-500'
      return 'bg-gray-400'
    },

    statusTextColor() {
      if (this.isOnline && this.vehicle.isMoving) return 'text-green-600'
      if (this.isOnline && !this.vehicle.isMoving) return 'text-yellow-600'
      return 'text-gray-500'
    },

    statusText() {
      if (!this.isOnline) return 'Офлайн'
      if (this.vehicle.isMoving) return 'В движении'
      return 'Стоит'
    },

    isOnline() {
      if (!this.vehicle.lastUpdate) return false

      const lastUpdate = new Date(this.vehicle.lastUpdate)
      const now = new Date()
      const diffMinutes = (now - lastUpdate) / (1000 * 60)

      // Считаем онлайн если обновление было менее 5 минут назад
      return diffMinutes < 5
    }
  }
}
</script>
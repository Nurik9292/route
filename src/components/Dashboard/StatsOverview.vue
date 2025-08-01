<template>
  <div class="stats-overview bg-k-bg-secondary border border-k-border rounded-lg p-6">
    <h3 class="text-lg font-semibold text-k-text-primary mb-4">Сводка за сегодня</h3>

    <div class="grid grid-cols-2 gap-4">
      <div class="stat-item">
        <div class="flex items-center gap-2 mb-2">
          <Icon :icon="['fas', 'bus']" class="text-blue-500" />
          <span class="text-sm font-medium text-k-text-primary">Поездки</span>
        </div>
        <div class="text-2xl font-bold text-k-text-primary">{{ todayStats.trips }}</div>
        <div class="text-xs text-k-text-secondary">
          {{ todayStats.tripsChange > 0 ? '+' : '' }}{{ todayStats.tripsChange }}% от вчера
        </div>
      </div>

      <div class="stat-item">
        <div class="flex items-center gap-2 mb-2">
          <Icon :icon="['fas', 'users']" class="text-green-500" />
          <span class="text-sm font-medium text-k-text-primary">Пассажиры</span>
        </div>
        <div class="text-2xl font-bold text-k-text-primary">{{ todayStats.passengers }}</div>
        <div class="text-xs text-k-text-secondary">
          {{ todayStats.passengersChange > 0 ? '+' : '' }}{{ todayStats.passengersChange }}% от вчера
        </div>
      </div>

      <div class="stat-item">
        <div class="flex items-center gap-2 mb-2">
          <Icon :icon="['fas', 'clock']" class="text-yellow-500" />
          <span class="text-sm font-medium text-k-text-primary">Ср. время</span>
        </div>
        <div class="text-2xl font-bold text-k-text-primary">{{ todayStats.avgTime }}</div>
        <div class="text-xs text-k-text-secondary">минут в пути</div>
      </div>

      <div class="stat-item">
        <div class="flex items-center gap-2 mb-2">
          <Icon :icon="['fas', 'percentage']" class="text-purple-500" />
          <span class="text-sm font-medium text-k-text-primary">Точность</span>
        </div>
        <div class="text-2xl font-bold text-k-text-primary">{{ todayStats.accuracy }}%</div>
        <div class="text-xs text-k-text-secondary">прибытия по расписанию</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatsOverview',

  data() {
    return {
      todayStats: {
        trips: 1247,
        tripsChange: 12,
        passengers: 5832,
        passengersChange: 8,
        avgTime: 23,
        accuracy: 94
      }
    };
  }
};
</script>

<style lang="postcss" scoped>
.stat-item {
  @apply p-3 bg-k-bg-primary rounded-lg;
}
</style>
<template>
  <div class="recent-activity bg-k-bg-secondary border border-k-border rounded-lg p-6">
    <h3 class="text-lg font-semibold text-k-text-primary mb-4">Последние действия</h3>

    <div class="space-y-3">
      <div v-for="activity in activities" :key="activity.id" class="flex items-center gap-3 py-2">
        <div :class="activity.iconColor" class="p-2 rounded-full">
          <Icon :icon="activity.icon" class="text-sm" />
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-sm text-k-text-primary">{{ activity.description }}</p>
          <p class="text-xs text-k-text-secondary">{{ activity.timeAgo }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RecentActivity',

  data() {
    return {
      activities: [
        {
          id: 1,
          description: 'Добавлен новый маршрут №47',
          timeAgo: '2 часа назад',
          icon: ['fas', 'route'],
          iconColor: 'bg-blue-100 text-blue-600'
        },
        {
          id: 2,
          description: 'Обновлена остановка "Центральный вокзал"',
          timeAgo: '4 часа назад',
          icon: ['fas', 'map-marker-alt'],
          iconColor: 'bg-green-100 text-green-600'
        },
        {
          id: 3,
          description: 'Создан новый администратор',
          timeAgo: '1 день назад',
          icon: ['fas', 'user-plus'],
          iconColor: 'bg-purple-100 text-purple-600'
        }
      ]
    };
  }
};
</script>
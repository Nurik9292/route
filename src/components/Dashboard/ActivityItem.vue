<template>
  <div class="activity-item p-3 rounded-lg hover:bg-gray-50 transition-colors">
    <div class="flex items-start space-x-3">
      <div :class="iconClasses" class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
        <Icon :icon="activityIcon" class="text-sm text-white" />
      </div>

      <div class="flex-1 min-w-0">
        <p class="text-sm text-k-text-primary">
          {{ activity.description }}
        </p>
        <div class="flex items-center mt-1 text-xs text-k-text-secondary">
          <span>{{ activity.user }}</span>
          <span class="mx-1">•</span>
          <span>{{ formatTimestamp(activity.timestamp) }}</span>
        </div>
      </div>

      <!-- Тип активности бейдж -->
      <div class="flex-shrink-0">
        <span :class="badgeClasses" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium">
          {{ activityTypeText }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export default {
  name: 'ActivityItem',

  props: {
    activity: {
      type: Object,
      required: true
    }
  },

  computed: {
    activityIcon() {
      const iconMap = {
        'route_created': ['fas', 'route'],
        'route_updated': ['fas', 'route'],
        'route_deleted': ['fas', 'route'],
        'stop_created': ['fas', 'shop'],
        'stop_updated': ['fas', 'shop'],
        'stop_deleted': ['fas', 'shop'],
        'bus_offline': ['fas', 'exclamation-triangle'],
        'bus_online': ['fas', 'check-circle'],
        'user_login': ['fas', 'users'],
        'user_logout': ['fas', 'users'],
        'system_update': ['fas', 'refresh'],
        'error': ['fas', 'times-circle']
      };

      return iconMap[this.activity.type] || ['fas', 'info'];
    },

    iconClasses() {
      const colorMap = {
        'route_created': 'bg-blue-500',
        'route_updated': 'bg-blue-400',
        'route_deleted': 'bg-red-500',
        'stop_created': 'bg-green-500',
        'stop_updated': 'bg-green-400',
        'stop_deleted': 'bg-red-500',
        'bus_offline': 'bg-red-500',
        'bus_online': 'bg-green-500',
        'user_login': 'bg-purple-500',
        'user_logout': 'bg-gray-500',
        'system_update': 'bg-amber-500',
        'error': 'bg-red-600'
      };

      return colorMap[this.activity.type] || 'bg-gray-500';
    },

    badgeClasses() {
      const colorMap = {
        'route_created': 'bg-blue-100 text-blue-800',
        'route_updated': 'bg-blue-100 text-blue-800',
        'route_deleted': 'bg-red-100 text-red-800',
        'stop_created': 'bg-green-100 text-green-800',
        'stop_updated': 'bg-green-100 text-green-800',
        'stop_deleted': 'bg-red-100 text-red-800',
        'bus_offline': 'bg-red-100 text-red-800',
        'bus_online': 'bg-green-100 text-green-800',
        'user_login': 'bg-purple-100 text-purple-800',
        'user_logout': 'bg-gray-100 text-gray-800',
        'system_update': 'bg-amber-100 text-amber-800',
        'error': 'bg-red-100 text-red-800'
      };

      return colorMap[this.activity.type] || 'bg-gray-100 text-gray-800';
    },

    activityTypeText() {
      const textMap = {
        'route_created': 'Маршрут',
        'route_updated': 'Маршрут',
        'route_deleted': 'Маршрут',
        'stop_created': 'Остановка',
        'stop_updated': 'Остановка',
        'stop_deleted': 'Остановка',
        'bus_offline': 'Автобус',
        'bus_online': 'Автобус',
        'user_login': 'Вход',
        'user_logout': 'Выход',
        'system_update': 'Система',
        'error': 'Ошибка'
      };

      return textMap[this.activity.type] || 'Событие';
    }
  },

  methods: {
    formatTimestamp(timestamp) {
      if (!timestamp) return 'Неизвестно';
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: ru
      });
    }
  }
};
</script>

<style lang="postcss" scoped>
.activity-item {
  @apply transition-all duration-200;
}

.activity-item:hover {
  @apply bg-gray-50;
}
</style>
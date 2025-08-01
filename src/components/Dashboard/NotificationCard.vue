<template>
  <div class="notification-card bg-k-bg-secondary border border-k-border rounded-lg p-4">
    <div class="flex items-start gap-3">
      <div :class="iconColorClass" class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
        <Icon :icon="notificationIcon" class="text-sm text-white" />
      </div>

      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-medium text-k-text-primary mb-1">
          {{ notification.title }}
        </h4>
        <p class="text-xs text-k-text-secondary mb-2">
          {{ notification.message }}
        </p>
        <div class="flex items-center justify-between">
          <span class="text-xs text-k-text-secondary">
            {{ formatTimestamp(notification.timestamp) }}
          </span>
          <button
              v-if="!notification.read"
              @click="markAsRead"
              class="text-xs text-k-primary hover:text-k-primary-dark transition-colors">
            Прочитано
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export default {
  name: 'NotificationCard',

  props: {
    notification: {
      type: Object,
      required: true
    }
  },

  emits: ['mark-read'],

  computed: {
    notificationIcon() {
      const iconMap = {
        'info': ['fas', 'info-circle'],
        'warning': ['fas', 'exclamation-triangle'],
        'error': ['fas', 'times-circle'],
        'success': ['fas', 'check-circle'],
        'system': ['fas', 'cog']
      };
      return iconMap[this.notification.type] || ['fas', 'bell'];
    },

    iconColorClass() {
      const colorMap = {
        'info': 'bg-blue-500',
        'warning': 'bg-yellow-500',
        'error': 'bg-red-500',
        'success': 'bg-green-500',
        'system': 'bg-gray-500'
      };
      return colorMap[this.notification.type] || 'bg-blue-500';
    }
  },

  methods: {
    formatTimestamp(timestamp) {
      try {
        return formatDistanceToNow(new Date(timestamp), {
          addSuffix: true,
          locale: ru
        });
      } catch {
        return '';
      }
    },

    markAsRead() {
      this.$emit('mark-read', this.notification.id);
    }
  }
};
</script>
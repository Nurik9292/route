<template>
  <div class="system-info bg-k-bg-secondary border border-k-border rounded-lg p-6">
    <h3 class="text-lg font-semibold text-k-text-primary mb-4">Информация о системе</h3>

    <div class="space-y-4">
      <div class="flex justify-between items-center py-2 border-b border-k-border">
        <span class="text-sm text-k-text-secondary">Версия системы</span>
        <span class="text-sm font-medium text-k-text-primary">v1.0.0</span>
      </div>

      <div class="flex justify-between items-center py-2 border-b border-k-border">
        <span class="text-sm text-k-text-secondary">Статус API</span>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          <span class="text-sm font-medium text-green-600">Активно</span>
        </div>
      </div>

      <div class="flex justify-between items-center py-2 border-b border-k-border">
        <span class="text-sm text-k-text-secondary">GPS сервис</span>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          <span class="text-sm font-medium text-green-600">Подключен</span>
        </div>
      </div>

      <div class="flex justify-between items-center py-2 border-b border-k-border">
        <span class="text-sm text-k-text-secondary">База данных</span>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          <span class="text-sm font-medium text-green-600">PostgreSQL</span>
        </div>
      </div>

      <div class="flex justify-between items-center py-2 border-b border-k-border">
        <span class="text-sm text-k-text-secondary">Redis кэш</span>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          <span class="text-sm font-medium text-green-600">Подключен</span>
        </div>
      </div>

      <div class="flex justify-between items-center py-2">
        <span class="text-sm text-k-text-secondary">Последнее обновление</span>
        <span class="text-sm font-medium text-k-text-primary">{{ lastUpdate }}</span>
      </div>
    </div>

    <div class="mt-6 pt-4 border-t border-k-border">
      <div class="flex items-center gap-2 text-xs text-k-text-secondary">
        <Icon :icon="['fas', 'info-circle']" />
        <span>Система автобусных маршрутов Туркменистана</span>
      </div>

      <div class="mt-2 flex items-center justify-between text-xs text-k-text-secondary">
        <span>Uptime: {{ systemUptime }}</span>
        <span>Memory: {{ memoryUsage }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default {
  name: 'SystemInfo',

  data() {
    return {
      startTime: new Date(),
      memoryUsage: '45%'
    };
  },

  computed: {
    lastUpdate() {
      return format(new Date(), 'dd.MM.yyyy HH:mm', { locale: ru });
    },

    systemUptime() {
      const now = new Date();
      const diff = Math.floor((now - this.startTime) / 1000 / 60); // в минутах

      if (diff < 60) {
        return `${diff} мин`;
      } else if (diff < 1440) {
        return `${Math.floor(diff / 60)} ч ${diff % 60} мин`;
      } else {
        const days = Math.floor(diff / 1440);
        const hours = Math.floor((diff % 1440) / 60);
        return `${days} д ${hours} ч`;
      }
    }
  }
};
</script>
<template>
  <div class="quick-actions">
    <h3 class="text-lg font-semibold text-k-text-primary mb-4">Быстрые действия</h3>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <QuickActionCard
          title="Добавить маршрут"
          description="Создать новый автобусный маршрут"
          icon="route"
          color="blue"
          @click="$emit('navigate', 'routes')"
      />

      <QuickActionCard
          title="Добавить остановку"
          description="Создать новую остановку"
          icon="map-marker"
          color="green"
          @click="$emit('navigate', 'stops')"
      />

      <QuickActionCard
          title="Управление автобусами"
          description="Настроить автобусы и водителей"
          icon="bus"
          color="yellow"
          @click="$emit('navigate', 'buses')"
      />

      <QuickActionCard
          title="Добавить админа"
          description="Создать нового администратора"
          icon="user-plus"
          color="purple"
          @click="$emit('navigate', 'admins')"
      />
    </div>
  </div>
</template>

<script>
import QuickActionCard from './QuickActionCard.vue';

export default {
  name: 'QuickActions',

  components: {
    QuickActionCard
  },

  emits: ['navigate']
};
</script>

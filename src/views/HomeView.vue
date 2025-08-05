<template>
  <BaseView>
    <template #header>
      <ScreenHeader layout="collapsed">
        Панель управления

        <template #meta>
          <span class="text-k-text-secondary">
            Добро пожаловать в систему управления автобусными маршрутами
          </span>
        </template>
      </ScreenHeader>
    </template>

    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <DashboardCardSkeleton v-for="i in 6" :key="i" />
    </div>

    <div v-else class="space-y-8">
      <!-- Приветствие -->
      <WelcomeCard :admin="currentAdmin" />

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
            title="Всего маршрутов"
            :value="stats.totalRoutes"
            icon="route"
            color="blue"
            :loading="statsLoading"
        />
        <StatCard
            title="Активных остановок"
            :value="stats.activeStops"
            icon="map-marker"
            color="green"
            :loading="statsLoading"
        />
        <StatCard
            title="Автобусов онлайн"
            :value="stats.onlineBuses"
            icon="bus"
            color="yellow"
            :loading="statsLoading"
        />
        <StatCard
            title="Администраторов"
            :value="stats.totalAdmins"
            icon="users"
            color="purple"
            :loading="statsLoading"
        />
      </div>

      <QuickActions />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <SystemInfo />
      </div>
    </div>
  </BaseView>
</template>

<script>
import { useAuthorization } from '@/composables';

import BaseView from './BaseView.vue';
import ScreenHeader from '@/components/Ui/ScreenHeader.vue';
import DashboardCardSkeleton from '@/components/Dashboard/DashboardCardSkeleton.vue';
import WelcomeCard from '@/components/Dashboard/WelcomeCard.vue';
import StatCard from '@/components/Dashboard/StatCard.vue';
import QuickActions from '@/components/Dashboard/QuickActions.vue';
import RecentActivity from '@/components/Dashboard/RecentActivity.vue';
import SystemInfo from '@/components/Dashboard/SystemInfo.vue';

export default {
  name: 'HomeView',

  components: {
    BaseView,
    ScreenHeader,
    DashboardCardSkeleton,
    WelcomeCard,
    StatCard,
    QuickActions,
    RecentActivity,
    SystemInfo
  },

  setup() {
    const { currentAdmin } = useAuthorization();
    return { currentAdmin };
  },

  data() {
    return {
      isLoading: true,
      statsLoading: true,

      stats: {
        totalRoutes: 0,
        activeStops: 0,
        onlineBuses: 0,
        totalAdmins: 0
      }
    };
  },

  async mounted() {
    try {
      await this.loadDashboardData();
    } catch (error) {
      console.error('Ошибка загрузки данных панели:', error);
    } finally {
      this.isLoading = false;
    }
  },

  methods: {
    async loadDashboardData() {
      this.statsLoading = true;

      try {
        const [routesData, stopsData, vehiclesData, adminsData] = await Promise.allSettled([
          this.loadRoutesStats(),
          this.loadStopsStats(),
          this.loadVehiclesStats(),
          this.loadAdminsStats()
        ]);

        // Обрабатываем результаты
        if (routesData.status === 'fulfilled') {
          this.stats.totalRoutes = routesData.value;
        }
        if (stopsData.status === 'fulfilled') {
          this.stats.activeStops = stopsData.value;
        }
        if (vehiclesData.status === 'fulfilled') {
          this.stats.onlineBuses = vehiclesData.value;
        }
        if (adminsData.status === 'fulfilled') {
          this.stats.totalAdmins = adminsData.value;
        }

      } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
      } finally {
        this.statsLoading = false;
      }
    },

    async loadRoutesStats() {
      // Простая заглушка - в реальном проекте это API вызов
      return new Promise(resolve => {
        setTimeout(() => resolve(47), 500);
      });
    },

    async loadStopsStats() {
      return new Promise(resolve => {
        setTimeout(() => resolve(238), 600);
      });
    },

    async loadVehiclesStats() {
      return new Promise(resolve => {
        setTimeout(() => resolve(12), 700);
      });
    },

    async loadAdminsStats() {
      return new Promise(resolve => {
        setTimeout(() => resolve(3), 400);
      });
    }
  }
};
</script>

<style lang="postcss" scoped>
</style>
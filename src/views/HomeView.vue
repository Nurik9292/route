<template>
  <BaseView id="homeWrapper">
    <template #header>
      <ScreenHeader layout="expanded">
        {{ greeting }}

        <template #thumbnail>
          <ThumbnailStack :thumbnails="thumbnails" />
        </template>

        <template #meta>
          <span>Обзор системы автобусных маршрутов</span>
        </template>

        <template #controls>
          <BtnGroup uppercase>
            <BtnComponent @click="refreshData" :disabled="loading">
              <Icon :icon="['fas', 'refresh']" :class="{ 'animate-spin': loading }" />
              Обновить
            </BtnComponent>
          </BtnGroup>
        </template>
      </ScreenHeader>
    </template>

    <div class="dashboard-content space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
            title="Активные маршруты"
            :value="stats.activeRoutes"
            :loading="loading"
            icon="route"
            color="blue"
            :trend="routesTrend"
        />
        <StatCard
            title="Остановки"
            :value="stats.totalStops"
            :loading="loading"
            icon="shop"
            color="green"
            :trend="stopsTrend"
        />
        <StatCard
            title="Автобусы онлайн"
            :value="stats.onlineBuses"
            :loading="loading"
            icon="fas fa-bus"
            color="amber"
            :trend="busesTrend"
        />
        <StatCard
            title="Пользователей сегодня"
            :value="stats.dailyUsers"
            :loading="loading"
            icon="users"
            color="purple"
            :trend="usersTrend"
        />
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="xl:col-span-2">
          <div class="bg-white rounded-lg border border-k-bg-secondary p-6 h-[400px]">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-k-text-primary">
                <Icon :icon="['fas', 'route']" class="mr-2" />
                Live карта автобусов
              </h3>
              <div class="flex items-center text-sm text-k-text-secondary">
                <span class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Обновлено {{ formatLastUpdate(lastMapUpdate) }}
              </div>
            </div>
            <div class="h-[320px] bg-gray-100 rounded-lg flex items-center justify-center">
              <div v-if="loading" class="text-center">
                <Icon :icon="['fas', 'refresh']" class="text-2xl animate-spin mb-2" />
                <p class="text-k-text-secondary">Загрузка карты...</p>
              </div>
              <div v-else class="text-center">
                <Icon :icon="['fas', 'route']" class="text-4xl text-k-text-secondary mb-2" />
                <p class="text-k-text-secondary">Карта автобусов</p>
                <p class="text-sm text-k-text-secondary mt-1">{{ liveBuses.length }} автобусов онлайн</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="bg-white rounded-lg border border-k-bg-secondary p-6">
            <h3 class="text-lg font-semibold mb-4 text-k-text-primary">
              <Icon :icon="['fas', 'info']" class="mr-2" />
              Статус автобусов
            </h3>
            <div class="space-y-3 max-h-80 overflow-y-auto">
              <div v-if="loading" class="space-y-3">
                <div v-for="i in 5" :key="i" class="animate-pulse">
                  <div class="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
              <BusStatusItem
                  v-else
                  v-for="bus in liveBuses.slice(0, 8)"
                  :key="bus.id"
                  :bus="bus"
              />
              <div v-if="!loading && liveBuses.length === 0"
                   class="text-center text-k-text-secondary py-8">
                <Icon :icon="['fas', 'circle-exclamation']" class="text-2xl mb-2" />
                <p>Нет активных автобусов</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg border border-k-bg-secondary p-6">
          <h3 class="text-lg font-semibold mb-4 text-k-text-primary">
            <Icon :icon="['fas', 'clock']" class="mr-2" />
            Последние действия
          </h3>
          <div class="space-y-3 max-h-80 overflow-y-auto">
            <div v-if="loading" class="space-y-3">
              <div v-for="i in 4" :key="i" class="animate-pulse">
                <div class="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
            <ActivityItem
                v-else
                v-for="activity in recentActivities"
                :key="activity.id"
                :activity="activity"
            />
            <div v-if="!loading && recentActivities.length === 0"
                 class="text-center text-k-text-secondary py-8">
              <Icon :icon="['fas', 'info']" class="text-xl mb-2" />
              <p>Нет недавних действий</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-k-bg-secondary p-6">
          <h3 class="text-lg font-semibold mb-4 text-k-text-primary">
            <Icon :icon="['fas', 'shield']" class="mr-2" />
            Системная информация
          </h3>
          <div class="space-y-4">
            <SystemInfoItem
                label="Статус системы"
                :value="systemInfo.status === 'online' ? 'В сети' : 'Офлайн'"
                :status="systemInfo.status === 'online' ? 'success' : 'error'"
            />
            <SystemInfoItem
                label="Последнее обновление GPS"
                :value="formatLastUpdate(systemInfo.lastGpsUpdate)"
                status="info"
            />
            <SystemInfoItem
                label="Активных подключений"
                :value="systemInfo.activeConnections"
                status="info"
            />
            <SystemInfoItem
                label="Версия системы"
                :value="systemInfo.version"
                status="neutral"
            />
          </div>
        </div>
      </div>
    </div>
  </BaseView>
</template>

<script>
import { sample } from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import { useRouter, useErrorHandler } from '@/composables';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

import BaseView from './BaseView.vue';
import ScreenHeader from '@/components/Ui/ScreenHeader.vue';
import ThumbnailStack from '@/components/Ui/ThumbnailStack.vue';
import BtnGroup from '@/components/Ui/Form/BtnGroup.vue';
import BtnComponent from '@/components/Ui/Form/BtnComponent.vue';
import StatCard from '@/components/Dashboard/StatCard.vue';
import BusStatusItem from '@/components/Dashboard/BusStatusItem.vue';
import ActivityItem from '@/components/Dashboard/ActivityItem.vue';
import SystemInfoItem from '@/components/Dashboard/SystemInfoItem.vue';

export default {
  name: 'HomeView',

  components: {
    BaseView,
    ScreenHeader,
    ThumbnailStack,
    BtnGroup,
    BtnComponent,
    StatCard,
    BusStatusItem,
    ActivityItem,
    SystemInfoItem
  },

  data() {
    return {
      greetings: [
        'Добро пожаловать в админ панель, %s',
        'Привет, %s! Управляй автобусами',
        'Рад видеть вас, %s',
        'Здравствуйте, %s! Система готова к работе'
      ],
      initialized: false,
      loading: false,
      thumbnails: [],
      refreshInterval: null,
      lastMapUpdate: new Date(),

      stats: {
        activeRoutes: 0,
        totalStops: 0,
        onlineBuses: 0,
        dailyUsers: 0
      },

      routesTrend: { value: 5, direction: 'up' },
      stopsTrend: { value: 2, direction: 'up' },
      busesTrend: { value: 10, direction: 'down' },
      usersTrend: { value: 15, direction: 'up' },

      // Live данные
      liveBuses: [],
      recentActivities: [],
      systemInfo: {
        status: 'online',
        lastGpsUpdate: new Date(),
        activeConnections: 0,
        version: '1.0.0'
      }
    };
  },

  computed: {
    ...mapGetters('admin', ['userFullName']),
    ...mapGetters('routes', ['routes']),
    ...mapGetters('stops', ['stops']),

    greeting() {
      const greeting = sample(this.greetings);
      return greeting ? greeting.replace('%s', this.userFullName) : 'Добро пожаловать!';
    }
  },

  mounted() {
    useRouter().onScreenActivated('Home', async () => {
      if (!this.initialized) {
        await this.initializeDashboard();
        this.initialized = true;
      }
    });
  },

  beforeUnmount() {
    this.stopRealTimeUpdates();
  },

  methods: {
    ...mapActions('routes', { fetchRoutes: 'fetchAll' }),
    ...mapActions('stops', { fetchStops: 'fetchAll' }),

    async initializeDashboard() {
      this.loading = true;
      try {
        await this.loadDashboardData();
        this.startRealTimeUpdates();
      } catch (error) {
        console.error('Ошибка инициализации Dashboard:', error);
        useErrorHandler('dialog').handleHttpError(error);
      } finally {
        this.loading = false;
      }
    },

    async loadDashboardData() {
      try {
        await Promise.all([
          this.fetchRoutes(),
          this.fetchStops(),
          // this.fetchUsers()
        ]);

        await Promise.all([
          this.loadLiveBusesMock(),
          this.loadRecentActivitiesMock(),
          this.loadSystemInfoMock()
        ]);

        this.updateStats();
        this.updateThumbnails();
      } catch (error) {
        console.error('Ошибка загрузки данных Dashboard:', error);
        throw error;
      }
    },

    async refreshData() {
      await this.loadDashboardData();
      // Можно добавить toast уведомление о обновлении
    },

    updateStats() {
      this.stats = {
        activeRoutes: this.routes?.filter(r => r.isActive)?.length || 0,
        totalStops: this.stops?.length || 0,
        onlineBuses: this.liveBuses?.filter(b => b.isOnline)?.length || 0,
        dailyUsers: this.systemInfo?.dailyUsers || 0
      };
    },

    updateThumbnails() {
      // Создаем миниатюры для популярных маршрутов
      this.thumbnails = this.routes
          ?.filter(r => r.isActive)
          ?.slice(0, 4)
          ?.map(route => ({
            id: route.id,
            title: `Маршрут ${route.number}`,
            image: null // Можно добавить иконки маршрутов
          })) || [];
    },

    // ✅ УПРОЩЕННЫЕ МОКИ для начала
    async loadLiveBusesMock() {
      // В будущем заменить на: const buses = await dashboardAPI.getLiveBuses();
      this.liveBuses = [
        {
          id: 1,
          vehicleNumber: 'TMN001',
          routeNumber: '29',
          isOnline: true,
          lastUpdate: new Date(),
          status: 'moving',
          nextStop: 'Mahtumkuli'
        },
        {
          id: 2,
          vehicleNumber: 'TMN002',
          routeNumber: '12',
          isOnline: true,
          lastUpdate: new Date(Date.now() - 120000),
          status: 'stopped',
          nextStop: 'Bagtyyarlyk'
        },
        {
          id: 3,
          vehicleNumber: 'TMN003',
          routeNumber: '7A',
          isOnline: false,
          lastUpdate: new Date(Date.now() - 900000),
          status: 'offline',
          nextStop: null
        }
      ];
    },

    async loadRecentActivitiesMock() {
      // В будущем заменить на: const activities = await dashboardAPI.getRecentActivities();
      this.recentActivities = [
        {
          id: 1,
          type: 'route_created',
          description: 'Создан новый маршрут №15A',
          user: this.userFullName,
          timestamp: new Date(Date.now() - 300000),
        },
        {
          id: 2,
          type: 'stop_updated',
          description: 'Обновлена остановка "Mahtumkuli"',
          user: 'Админ Петров',
          timestamp: new Date(Date.now() - 600000),
        },
        {
          id: 3,
          type: 'bus_offline',
          description: 'Автобус TMN003 потерял связь',
          user: 'Система',
          timestamp: new Date(Date.now() - 1200000),
        }
      ];
    },

    async loadSystemInfoMock() {
      // В будущем заменить на: const info = await dashboardAPI.getSystemInfo();
      this.systemInfo = {
        status: 'online',
        lastGpsUpdate: new Date(),
        activeConnections: Math.floor(Math.random() * 50) + 10,
        version: '1.0.0',
        // ✅ ЗАГЛУШКА: Пользователи (в будущем из реального API)
        dailyUsers: Math.floor(Math.random() * 500) + 100, // 100-600 пользователей в день
      };
    },

    startRealTimeUpdates() {
      this.refreshInterval = setInterval(async () => {
        await this.loadLiveBusesMock();
        await this.loadSystemInfoMock();
        this.updateStats();
        this.lastMapUpdate = new Date();
      }, 30000);
    },

    stopRealTimeUpdates() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }
    },

    formatLastUpdate(date) {
      if (!date) return 'Неизвестно';
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: ru
      });
    }
  }
};
</script>

<style lang="postcss" scoped>
.dashboard-content {
  @apply p-6;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}
</style>
<template>
  <section id="mainContent" class="flex-1 relative overflow-hidden">
    <!-- Добавляем отладочную информацию -->
    <div v-if="showDebug" class="fixed top-0 right-0 bg-red-500 text-white p-2 text-xs z-50">
      Current Screen: {{ screen }}<br>
      Hash: {{ currentHash }}<br>
      Router Screen: {{ routerScreen }}<br>
      Route: {{ JSON.stringify(currentRoute) }}
    </div>

    <HomeView v-show="screen === 'Home'" />
    <StopsView v-show="screen === 'Stops'"/>
    <RoutesView v-show="screen === 'Routes'"/>
    <CityView v-show="screen === 'Cities'"/>
    <BannerView v-show="screen === 'Banners'"/>
    <RouteMonitoringView v-show="screen === 'Monitoring'"/>

    <ProfileView v-if="screen === 'Profile'" />
    <AdminView v-if="screen === 'Admins'" />
  </section>
</template>

<script>
import HomeView from '@/views/HomeView.vue';
import StopsView from '@/views/StopsView.vue';
import ProfileView from '@/views/ProfileView.vue';
import AdminView from '@/views/AdminView.vue';
import RoutesView from '@/views/RoutesView.vue';
import CityView from '@/views/CityView.vue';
import BannerView from '@/views/BannerView.vue';
import RouteMonitoringView from "@/views/RouteMonitoringView.vue";

import { useRouter } from '@/composables';

export default {
  name: "MainContent",

  components: {
    RouteMonitoringView,
    HomeView,
    StopsView,
    ProfileView,
    AdminView,
    RoutesView,
    CityView,
    BannerView
  },

  data() {
    return {
      screen: 'Home',
      showDebug: true, // Включаем отладку
      currentHash: '',
      routerScreen: '',
      currentRoute: null
    }
  },

  mounted() {
    console.log('🔧 MainContent mounted');
    const { onRouteChanged, getCurrentScreen, router } = useRouter();

    // Получаем текущую информацию
    this.routerScreen = getCurrentScreen();
    this.currentHash = location.hash;
    this.currentRoute = router ? router.$currentRoute.value : null;

    console.log('🔧 Initial state:');
    console.log('  - getCurrentScreen():', this.routerScreen);
    console.log('  - location.hash:', this.currentHash);
    console.log('  - router.$currentRoute.value:', this.currentRoute);

    // Устанавливаем экран
    if (this.routerScreen) {
      this.screen = this.routerScreen;
      console.log('✅ Установили screen:', this.screen);
    }

    // Подписываемся на изменения роута
    onRouteChanged(this.onRouteChanged);

    // Дополнительная проверка через небольшой timeout
    setTimeout(() => {
      const newScreen = getCurrentScreen();
      console.log('🔧 Timeout check - getCurrentScreen():', newScreen);
      if (newScreen && newScreen !== this.screen) {
        console.log('🔄 Обновляем screen с', this.screen, 'на', newScreen);
        this.screen = newScreen;
      }
    }, 100);
  },

  methods: {
    async onRouteChanged(route) {
      console.log('🔄 onRouteChanged вызван с route:', route);
      this.screen = route.screen;
      this.currentRoute = route;
      this.currentHash = location.hash;
      this.routerScreen = route.screen;

      console.log('✅ Обновили screen на:', this.screen);
    }
  }
}
</script>
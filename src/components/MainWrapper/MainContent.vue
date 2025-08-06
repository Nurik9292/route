<template>
    <section id="mainContent" class="flex-1 relative overflow-hidden">
        <HomeView v-show="screen === 'Home'" />
        <StopsView v-show="screen === 'Stops'"/>
        <RoutesView v-show="screen === 'Routes'"/>
        <CityView v-show="screen === 'Cities'"/>
        <BannerView v-show="screen === 'Banners'"/>
        
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

import { useRouter } from '@/composables';

export default {
    name: "MainContent",

    components: {
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
        }
    },

    mounted() {
        const { onRouteChanged, getCurrentScreen } = useRouter();
        onRouteChanged(this.onRouteChanged);
      console.log(getCurrentScreen())
        this.screen = getCurrentScreen();
    },
     
    methods: {
        async onRouteChanged(route) {
            this.screen = route.screen;
        }
    }

}
</script>
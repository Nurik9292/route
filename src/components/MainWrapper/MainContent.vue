<template>
    <section id="mainContent" class="flex-1 relative overflow-hidden">
        <HomeView v-show="screen === 'Home'" />
        <StopsView v-show="screen === 'Stops'"/>
        <RoutesView v-show="screen === 'Routes'"/>
        <CityView v-show="screen === 'Cities'"/>
        
        <ProfileView v-if="screen === 'Profile'" />
        <UserView v-if="screen === 'Users'" />
    </section>
</template>

<script>
import HomeView from '@/views/HomeView.vue';
import StopsView from '@/views/StopsView.vue';
import ProfileView from '@/views/ProfileView.vue';
import UserView from '@/views/UserView.vue';
import RoutesView from '@/views/RoutesView.vue';
import CityView from '@/views/CityView.vue';

import { useRouter } from '@/composables';

export default {
    name: "MainContent",

    components: {
        HomeView, 
        StopsView,
        ProfileView,
        UserView,
        RoutesView,
        CityView
    },

    data() {
        return {
            screen: 'Home',
        }
    },

    mounted() {
        const { onRouteChanged, getCurrentScreen } = useRouter();
        onRouteChanged(this.onRouteChanged);
        this.screen = getCurrentScreen();
    },
     
    methods: {
        async onRouteChanged(route) {
            this.screen = route.screen;
        }
    }

}
</script>
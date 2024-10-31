<template>
    <section id="mainContent" class="flex-1 relative overflow-hidden">
        <HomeView v-show="screen === 'Home'" />
        <StopsView v-show="screen === 'Stops'"/>
        
        <ProfileView v-if="screen === 'Profile'" />
    </section>
</template>

<script>
import HomeView from '@/views/HomeView.vue';
import StopsView from '@/views/StopsView.vue';
import ProfileView from '@/views/ProfileView.vue';

import { useRouter } from '@/composables';

export default {
    name: "MainContent",

    components: {
        HomeView, 
        StopsView,
        ProfileView
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
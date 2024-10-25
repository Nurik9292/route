<template>
    <section id="mainContent" class="flex-1 relative overflow-hidden">
        <HomeView v-show="screen === 'Home'" />
        <StopsView v-show="screen === 'Stops'"/>
        {{ screen }}
    </section>
</template>

<script>
import HomeView from '@/views/HomeView.vue';
import StopsView from '@/views/StopsView.vue';

import { useRouter } from '@/composables';

export default {
    name: "MainContent",

    components: {
        HomeView, 
        StopsView
    },

    data() {
        return {
            screen: 'Home',
        }
    },

    mounted() {
        const { onRouteChanged, getCurrentScreen } = useRouter();
        const savedScreen = localStorage.getItem('currentScreen');
        if (savedScreen) {
            this.screen = savedScreen; 
        } else {
            this.screen = getCurrentScreen(); 
        }
    
        onRouteChanged(route => {
            this.screen = route.screen;
            localStorage.setItem('currentScreen', this.screen);
        });
    },
    
    beforeDestroy() {
        localStorage.removeItem('currentScreen');
    },
   
    methods: {
    
    }

}
</script>
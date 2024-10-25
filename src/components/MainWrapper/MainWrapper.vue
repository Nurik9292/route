<template>
    <div class="relative flex flex-1 overflow-hidden">
        <SibebarMenu />
        <MainContent />
        <ExtraDrawer />
    </div>
</template>
  
<script>
import MainContent from './MainContent.vue';
import SibebarMenu from './Sidebar/SibebarMenu.vue';
import ExtraDrawer from './ExtraDrawer/ExtraDrawer.vue';

export default {
    name: "MainWrapper",

    components: {
        MainContent, SibebarMenu, ExtraDrawer
    }
}

</script>
  
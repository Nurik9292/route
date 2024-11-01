<template>
    <div class="relative flex flex-1 overflow-hidden">
        <SibebarMenu />
        <MainContent />
        <ExtraDrawer />
        <ModalWrapper />

    </div>
</template>
  
<script>
import MainContent from './MainContent.vue';
import SibebarMenu from './Sidebar/SibebarMenu.vue';
import ExtraDrawer from './ExtraDrawer/ExtraDrawer.vue';
import ModalWrapper from './ModalWrapper.vue';

export default {
    name: "MainWrapper",

    components: {
        MainContent, SibebarMenu, ExtraDrawer, ModalWrapper
    }
}

</script>
  
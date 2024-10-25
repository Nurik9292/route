<template>
    <main
    v-if="layout === 'main' && initialized"
    class="absolute md:relative top-0 h-full md:h-screen pt-k-header-height md:pt-0 w-full md:w-auto flex flex-col justify-end"
    @dragend="onDragEnd"
    @dragleave="onDragLeave"
    @dragover="onDragOver"
    @drop="onDrop"
    >
        <MainWrapper />
    </main>

</template>


<script>
import { RouterLink, RouterView } from 'vue-router';
import MainWrapper from './components/MainWrapper/MainWrapper.vue';

export default {
    components: {
        MainWrapper
    },

    data() {
        return {
            showDropZone: false,
            initialized: false,
            authenticated: false,
            layout: 'main',
        }
    },

    mounted() {
        this.onInitSuccess()
    },

    methods: {
        onDragEnd() {
            this.showDropZone = false;
        },

        onDragLeave(e) {
            if (e.currentTarget?.contains?.(e.relatedTarget))
                return;

            this.showDropZone = false;
        },

        onDragOver(e) {
            this.showDropZone = Boolean(e.dataTransfer?.types.includes('Files')) && !this.isCurrentScreen('Upload');
        },
        
        isCurrentScreen(screen) {
            return screen === 'Upload';
        },

        onDrop() {
            this.showDropZone = false;
        },

        async onInitSuccess() {
            this.authenticated = false;
            this.initialized = true;
            
            await this.resolveRoute();
            this.layout = 'main';
        },

        async resolveRoute() {
        }
    }
}

</script>


<style lang="postcss">
#dragGhost {
  @apply inline-block py-2 pl-8 pr-3 rounded-md text-base font-sans fixed top-0 left-0 z-[-1] bg-k-success
  text-k-text-primary no-hover:hidden;
}

#copyArea {
  @apply absolute -left-full bottom-px w-px h-px no-hover:hidden;
}
</style>
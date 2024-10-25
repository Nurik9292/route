<template>
    <nav  
    :class="{ collapsed: !expanded, 'tmp-showing': tmpShowing, showing: mobileShowing }"
    class="group left-0 top-0 flex flex-col fixed h-full w-full md:relative md:w-k-sidebar-width z-[999] md:z-10"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave">

        <section class="btn-collapse-block flex md:hidden items-center border-b border-b-white/5 h-k-header-height px-6">
            <div class="bg-white/5 rounded-full">
              <ExtraDrawerButton>
                <Icon :icon="['fas', 'times']" fixed-width />
              </ExtraDrawerButton>
            </div>
        </section>
        <section class="home-search-block p-6 flex gap-2">
            <HomeButton />
            <SearchForm class="flex-1" />
        </section>
        <section v-overflow-fade class="pt-2 pb-10 overflow-y-auto space-y-8">
          <SidebarGeodataSection />
          <SidebarOtherSection />
        </section>
        
        <SidebarToggleButton
          class="opacity-0 no-hover:hidden group-hover:opacity-100 transition"
          v-model="expanded"
          :class="expanded || 'opacity-100'"
        />
    </nav>    
</template>

<script>
import HomeButton from '@/components/MainWrapper/Sidebar/parts/HomeButton.vue';
import SearchForm from '@/components/Ui/SearchForm.vue';
import ExtraDrawerButton from '@/components/MainWrapper/ExtraDrawer/ExtraDrawerButton.vue';
import SidebarGeodataSection from './sections/SidebarGeodataSection.vue';
import SidebarOtherSection from './sections/SidebarOtherSection.vue';
import SidebarToggleButton from './parts/SidebarToggleButton.vue';

import { useLocalStorage } from '@/composables';

export default {
    name: 'SidebarMenu',

    components: {
        HomeButton, 
        ExtraDrawerButton, 
        SearchForm, 
        SidebarGeodataSection, 
        SidebarOtherSection,
        SidebarToggleButton
    },

    data() {
        const { get: lsGet, set: lsSet } = useLocalStorage();

        return {
            mobileShowing: false,
            expanded: !lsGet('sidebar-collapsed', false)
        };
    },

    watch: {
        expanded(newValue) {
            const { set: lsSet } = useLocalStorage();
            lsSet('sidebar-collapsed', !newValue);
        }
    },


    mounted() {
     
    }
}
</script>

<style lang="postcss" scoped>
@import '@/assets/partials/mixins.pcss';

nav {
  @apply bg-k-bg-secondary;
  -ms-overflow-style: -ms-autohiding-scrollbar;
  box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.1);
}

nav.collapsed {
  @apply w-[24px] transition-[width] duration-200;

  > *:not(.btn-toggle) {
    @apply hidden;
  }

  &.tmp-showing {
    @apply fixed h-screen bg-k-bg-primary w-k-sidebar-width shadow-2xl z-[999];

    > *:not(.btn-toggle, .btn-collapse-block) {
      @apply block;
    }

    > .home-search-block {
      @apply flex;
    }
  }
}

@media screen and (max-width: 768px) {
  nav {
    @apply bg-k-bg-secondary; 

    transform: translateX(-100vw);
    transition: transform 0.2s ease-in-out;

    &.showing {
      transform: translateX(0);
    }
  }
}
</style>

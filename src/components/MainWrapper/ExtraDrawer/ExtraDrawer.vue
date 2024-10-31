<template>
    <aside
        :class="{ 'showing-pane': activeTab }"
        class="fixed sm:relative top-0 w-screen md:w-auto flex flex-col md:flex-row-reverse z-[2] text-k-text-secondary"
    >
        <div    
            class="controls flex md:flex-col justify-between items-center md:w-[64px] md:py-6 tw:px-0
            bg-black/5 md:border-l border-solid md:border-l-white/5 md:border-b-0 md:shadow-none
            z-[2] w-screen flex-row border-b border-b-white/5 border-l-0 shadow-xl
            py-0 px-6 h-k-header-height"
        >
            <div class="btn-group">
                <ExtraDrawerButton class="md:hidden" @click.prevent="expandSidebar">
                    <Icon :icon="['fas', 'bars']" fixed-width />
                </ExtraDrawerButton>
            </div>
            <div class="btn-group">
                <LogoutButton />
                <ProfileAvatar @click="onProfileLinkClick" />
            </div>
        </div>

    </aside>
</template>

<script>
import ExtraDrawerButton from './ExtraDrawerButton.vue';
import LogoutButton from './LogoutButton.vue';
import ProfileAvatar from '@/components/Ui/ProfileAvatar.vue';

import isMobile from 'ismobilejs';
import { eventBus } from '@/utils';

export default {
    name: 'ExtraDrawer',

    components: {
        ExtraDrawerButton, LogoutButton, ProfileAvatar
    },

    mounted() {
     
    },

    methods: {
      
      expandSidebar() {
        eventBus.emit('TOGGLE_SIDEBAR');
      },

      onProfileLinkClick() {
        if (isMobile.any) 
          this.activeTab = null
      }

    }

}
</script>

<style lang="postcss" scoped>
@import '@/assets/partials/mixins.pcss';

@tailwind utilities;

@layer utilities {
  .btn-group {
    @apply flex md:flex-col justify-between items-center gap-1 md:gap-3;
  }
}

aside {
 
  @media screen and (max-width: 768px) {
    background-color: var(--themed-background); 

    &.showing-pane {
      height: 100%;
    }
  }
}

.panes {
  @apply no-hover:overflow-y-auto w-k-extra-drawer-width;
  box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.1);

  @media screen and (max-width: 768px) {
    width: 100%;
    height: calc(100vh - var(--header-height) - var(--footer-height));
  }
}
</style>
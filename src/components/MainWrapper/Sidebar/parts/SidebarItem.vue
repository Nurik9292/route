<template>
    <li
      :class="current && 'current'"
      class="relative before:right-0 px-6 before:top-1/4 before:w-[4px] before:h-1/2 before:absolute before:rounded-full
      before:transition-[box-shadow,_background-color] before:ease-in-out before:duration-500"
      data-testid="sidebar-item"
      @click="onClick"
    >
      <a
        :href="href"
        class="flex items-center overflow-x-hidden gap-3 h-11 relative active:pt-0.5 active:pr-0 active:pb-0 active:pl-0.5
        !text-k-text-secondary hover:!text-k-text-primary"
      >
        <span class="opacity-70">
          <slot name="icon" />
        </span>
  
        <span class="overflow-hidden text-ellipsis whitespace-nowrap">
          <slot />
        </span>
      </a>
    </li>
</template>
  
<script>
import { useRouter } from '@/composables';
import { eventBus } from '@/utils/eventBus';

export default {
    name: 'SidebarItem',

    props: {
        href: {
            type: String,
            default: undefined,
        },
        screen: {
            type: String,
            default: undefined
        }
    },

    data() {
        return {
            current: false,
        }
    },

    mounted() {
      const { onRouteChanged } = useRouter();

      if (this.screen) {
        console.log(this.screen, 'Sidebar item');
      
        
        onRouteChanged((route) => {
          this.current = route.screen === this.screen
        });
}
    },

    methods: {
        onClick() {
          eventBus.emit('TOGGLE_SIDEBAR');
        }
    }
  }
</script>
  
<style lang="postcss" scoped>
  li.current {
    a {
      @apply text-k-text-primary !important;
    }
  
    &::before {
      @apply bg-k-highlight !important;
      box-shadow: 0 0 40px 10px var(--color-highlight);
    }
  }
</style>
  
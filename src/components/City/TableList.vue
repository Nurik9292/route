<template>
  <div ref="wrapper" class="city-list-wrap">
    <div class="city-list-header flex items-center h-[48px] px-2 text-k-text-secondary bg-k-bg-secondary border-b border-k-border">
            <span class="track-number cursor-pointer flex items-center gap-2" @click="sort('displayOrder')">
                <span class="truncate">Порядок</span>
                <Icon v-if="sortField === 'displayOrder'" :icon="getSortIcon()" class="text-xs flex-shrink-0" />
            </span>
      <span class="title-city cursor-pointer flex items-center gap-2" @click="sort('name')">
                <span class="truncate">Название</span>
                <Icon v-if="sortField === 'name'" :icon="getSortIcon()" class="text-xs flex-shrink-0" />
            </span>
      <span class="action">Действия</span>
    </div>

    <VirtualScroller
        ref="scroller"
        v-slot="{ item }"
        :item-height="64"
        :items="rows"
        @click="onClick(item, $event)"
        @scroll="onScroll"
        @scrolled-to-end="$emit('scrolled-to-end')"
    >
      <ListItem
          :key="`city-${item.city.id}`"
          :item="item"
          @click="onClick(item, $event)"
      />
    </VirtualScroller>

    <!-- Loading indicator -->
    <div v-if="isLoading" class="loading-indicator flex justify-center py-4">
      <div class="spinner-border" role="status">
        <span class="sr-only">Загрузка...</span>
      </div>
    </div>
  </div>
</template>

<script>
import isMobile from 'ismobilejs';
import { nextTick } from 'vue';
import { throttle } from 'lodash';

import VirtualScroller from '../Ui/VirtualScroller.vue';
import ListItem from './ListItem.vue';

export default {
  name: 'TableList',

  components: {
    VirtualScroller,
    ListItem,
  },

  props: {
    cities: {
      type: Array,
      default: () => []
    },
    selectedCities: {
      type: Array,
      default: () => []
    },
    config: {
      type: Object,
      default: () => ({})
    },
    sortField: {
      type: String,
      default: 'name'
    },
    sortOrder: {
      type: String,
      default: 'asc'
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },

  emits: ['sort', 'scroll-breakpoint', 'scrolled-to-end', 'resize'],

  data() {
    return {
      wrapper: null,
      rows: [],
      lastScrollTop: 0,
      throttledResize: null
    };
  },

  mounted() {
    nextTick(() => {
      this.wrapper = this.$refs.wrapper;

      if (isMobile.any) {
        this.wrapper.setAttribute('tabindex', '0');
      }

      this.throttledResize = throttle(() => {
        this.$emit('resize');
      }, 100);

      window.addEventListener('resize', this.throttledResize);
    });

    this.render();
  },

  beforeUnmount() {
    if (this.throttledResize) {
      window.removeEventListener('resize', this.throttledResize);
    }
  },

  watch: {
    cities: {
      handler() {
        this.render();
      },
      deep: true
    },
    selectedCities: {
      handler() {
        this.render();
      },
      deep: true
    }
  },

  methods: {
    onScroll(e) {
      const scroller = e.target;

      if (scroller.scrollTop > 512 && this.lastScrollTop < 512) {
        this.$emit('scroll-breakpoint', 'down');
      } else if (scroller.scrollTop < 512 && this.lastScrollTop > 512) {
        this.$emit('scroll-breakpoint', 'up');
      }

      this.lastScrollTop = scroller.scrollTop;
    },

    render() {
      this.rows = this.generateRows();
    },

    generateRows() {
      const selectedIds = this.selectedCities.map(city => city.id);
      return this.cities.map(city => ({
        city,
        selected: selectedIds.includes(city.id)
      }));
    },

    sort(field) {
      if (!this.config.sortable) return;

      const newSortOrder = this.sortField === field && this.sortOrder === 'asc' ? 'desc' : 'asc';
      this.$emit('sort', field, newSortOrder);
    },

    getSortIcon() {
      return this.sortOrder === 'asc' ? ['fas', 'sort-up'] : ['fas', 'sort-down'];
    },

    onClick(row, event) {
      if (isMobile.any) {
        this.toggleRow(row);
        return;
      }
    },

    toggleRow(row) {
      row.selected = !row.selected;
    }
  }
};
</script>

<style lang="postcss">
.city-list-wrap {
  .virtual-scroller {
    @apply flex-1;
  }

  &.dragging .city-item * {
    @apply pointer-events-none;
  }

  .city-list-header > span, .city-item > span {
    @apply text-left p-3 align-middle text-ellipsis overflow-hidden;

    &.track-number {
      @apply basis-24 flex-shrink-0 min-w-0;
      max-width: 6rem;
    }

    &.action {
      @apply basis-64 flex-shrink-0 text-center; /* Увеличили с basis-56 до basis-64 */
      min-width: 16rem; /* 256px - для двух кнопок */
    }

    &.title-city {
      @apply flex-1 min-w-0; /* Займет оставшееся место */
    }
  }

  .city-list-header {
    @apply tracking-wide uppercase cursor-pointer text-k-text-secondary font-medium text-sm;

    span {
      @apply transition-colors duration-200;

      &:hover {
        @apply text-k-text-primary;
      }

      /* Обеспечиваем что текст не переносится */
      white-space: nowrap;
    }

    /* Иконки сортировки */
    .text-xs {
      @apply opacity-60;
    }
  }

  .loading-indicator {
    @apply border-t border-k-border bg-k-bg-secondary;
  }

  .spinner-border {
    @apply inline-block w-6 h-6 border-2 border-solid border-r-transparent rounded-full animate-spin;
    border-color: #3b82f6 transparent #3b82f6 transparent;
  }

  .sr-only {
    @apply absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0;
    clip: rect(0, 0, 0, 0);
  }

  /* Mobile responsiveness */
  @media only screen and (max-width: 768px) {
    .city-list-header {
      display: none;
    }

    .city-item {
      @apply p-4 border-b border-k-border;
      flex-direction: column;
      align-items: stretch;
      height: auto;
      min-height: 80px;
    }

    .city-item > span {
      padding: 0;

      &.track-number {
        @apply absolute top-2 right-2 basis-auto;
      }

      &.title-city {
        @apply mb-3;
      }

      &.action {
        @apply basis-auto text-left;

        .space-x-2 {
          @apply flex gap-2;
        }
      }
    }
  }
}
</style>
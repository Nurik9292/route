<template>
  <div ref="wrapper" class="stop-list-wrap">
    <!-- Header with sorting -->
    <div class="stop-list-header flex items-center h-[48px] px-2 text-k-text-secondary bg-k-bg-secondary border-b border-k-border">
      <span class="track-number cursor-pointer flex items-center justify-center gap-2" @click="sort('displayOrder')" >
        <span class="truncate">ПОРЯДОК</span>
        <Icon v-if="sortField === 'displayOrder'" :icon="getSortIcon()" class="text-xs flex-shrink-0" />
      </span>
      <span class="title-stop cursor-pointer flex items-center gap-2" @click="sort('stopName')" >
        <span class="truncate">НАЗВАНИЕ</span>
        <Icon v-if="sortField === 'stopName'" :icon="getSortIcon()" class="text-xs flex-shrink-0" />
      </span>
      <span class="turkmen-name hidden md:block" >ТУРКМЕНСКИЙ</span>
      <span class="english-name hidden lg:block" >АНГЛИЙСКИЙ</span>
      <span class="city-name hidden lg:block" >ГОРОД</span>
      <span class="coordinates hidden md:block" >КООРДИНАТЫ</span>
      <span class="type hidden md:block">ТИП</span>
      <span class="status" >СТАТУС</span>
      <span class="action">ДЕЙСТВИЯ</span>
    </div>

    <VirtualScroller
        ref="scroller"
        v-slot="{ item }"
        :item-height="80"
        :items="rows"
        @click="onClick(item, $event)"
        @scroll="onScroll"
        @scrolled-to-end="$emit('scrolled-to-end')"
    >
      <ListItem
          :key="`stop-${item.stop.id}`"
          :item="item"
          @click="onClick(item, $event)"
          @edit="$emit('edit', item.stop)"
          @delete="$emit('delete', item.stop)"
      />
    </VirtualScroller>

    <div v-if="isLoading" class="loading-indicator flex justify-center py-4">
      <div class="spinner-border" role="status">
        <span class="sr-only">Загрузка...</span>
      </div>
    </div>

    <div v-if="hasMoreData" class="load-more-section p-4 text-center border-t border-k-border">
      <BtnComponent
          @click="$emit('load-more')"
          :disabled="isLoading"
          class="load-more-button"
      >
        <Icon v-if="isLoading" :icon="['fas', 'spinner']" class="animate-spin mr-2" />
        <Icon v-else :icon="['fas', 'chevron-down']" class="mr-2" />
        {{ isLoading ? 'Загрузка...' : 'Загрузить ещё' }}
      </BtnComponent>
    </div>

    <div v-if="stops.length > 0" class="pagination-info px-4 py-3 border-t border-k-border bg-k-bg-secondary">
      <p class="text-sm text-k-text-secondary">
        Показано <span class="font-medium text-k-accent">{{ stops.length }}</span>
        из <span class="font-medium text-k-accent">{{ totalCount }}</span> остановок
      </p>
      <div v-if="hasMoreData" class="progress-bar mt-2 w-full h-2 bg-k-bg-primary rounded-full overflow-hidden">
        <div
            class="progress-fill h-full bg-gradient-to-r from-k-accent to-orange-400 transition-all duration-300 ease-out"
            :style="{ width: progressPercentage + '%' }"
        ></div>
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
import BtnComponent from '../Ui/Form/BtnComponent.vue';

export default {
  name: 'StopsTableList',

  components: {
    VirtualScroller,
    ListItem,
    BtnComponent
  },

  props: {
    stops: {
      type: Array,
      default: () => []
    },
    selectedStops: {
      type: Array,
      default: () => []
    },
    config: {
      type: Object,
      default: () => ({})
    },
    sortField: {
      type: String,
      default: 'stopName'
    },
    sortOrder: {
      type: String,
      default: 'asc'
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    hasMoreData: {
      type: Boolean,
      default: false
    },
    totalCount: {
      type: Number,
      default: 0
    }
  },

  emits: ['sort', 'scroll-breakpoint', 'scrolled-to-end', 'resize', 'edit', 'delete', 'load-more'],

  data() {
    return {
      wrapper: null,
      rows: [],
      lastScrollTop: 0,
      throttledResize: null
    };
  },

  computed: {
    progressPercentage() {
      if (!this.totalCount || this.totalCount === 0) return 0;
      return Math.round((this.stops.length / this.totalCount) * 100);
    }
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
    stops: {
      handler() {
        this.render();
      },
      deep: true
    },
    selectedStops: {
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
      const selectedIds = this.selectedStops.map(stop => stop.id);
      return this.stops.map(stop => ({
        stop,
        selected: selectedIds.includes(stop.id)
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
      // Handle click for editing
      this.$emit('edit', row.stop);
    },

    toggleRow(row) {
      row.selected = !row.selected;
    }
  }
};
</script>

<style lang="postcss">
.stop-list-wrap {
  min-width: 90rem;
  overflow-x: auto;
}

.stop-list-header > span, .stop-item > span {
  @apply text-left p-3 align-middle;

  &.track-number {
    @apply basis-20 flex-shrink-0 min-w-0 text-center;
    min-width: 5rem;
    max-width: 5rem;
  }

  &.title-stop {
    @apply flex-1 min-w-0;
    min-width: 16rem;
    max-width: none; /* Убираем ограничение для названия */
  }

  &.turkmen-name {
    @apply basis-40 flex-shrink-0 min-w-0;
    min-width: 10rem;
    max-width: 12rem;
  }

  &.english-name {
    @apply basis-40 flex-shrink-0 min-w-0;
    min-width: 10rem;
    max-width: 12rem;
  }

  &.city-name {
    @apply basis-32 flex-shrink-0 min-w-0;
    min-width: 8rem;
    max-width: 10rem;
  }

  &.coordinates {
    @apply basis-40 flex-shrink-0 min-w-0;
    min-width: 10rem;
    max-width: 12rem;
  }

  &.type {
    @apply basis-20 flex-shrink-0 text-center;
    min-width: 5rem;
    max-width: 5rem;
  }

  &.status {
    @apply basis-24 flex-shrink-0 text-center;
    min-width: 6rem;
    max-width: 6rem;
  }

  &.action {
    @apply basis-56 flex-shrink-0 text-center;
    min-width: 14rem;
    max-width: 16rem;
  }
}

.stop-list-header {
  @apply tracking-wide uppercase cursor-pointer font-medium text-sm;
  background-color: var(--color-bg-primary);
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);

  span {
    @apply transition-colors duration-200;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      color: var(--color-text-primary);
    }
  }

  .text-xs {
    @apply opacity-60;
  }
}

@media (max-width: 1200px) {
  .stop-list-wrap {
    min-width: 80rem;
  }
}

@media (max-width: 1024px) {
  .stop-list-header > span, .stop-item > span {
    &.english-name {
      display: none !important;
    }
  }

  .stop-list-wrap {
    min-width: 70rem;
  }
}

@media (max-width: 768px) {
  .stop-list-wrap {
    min-width: auto;
    overflow-x: scroll;
  }

  .stop-list-header > span, .stop-item > span {
    &.turkmen-name,
    &.city-name,
    &.coordinates,
    &.type {
      display: none !important;
    }

    &.title-stop {
      min-width: 12rem;
      flex: 2;
    }

    &.action {
      min-width: 10rem;
      max-width: 12rem;
    }

    &.status {
      min-width: 5rem;
    }

    &.track-number {
      min-width: 4rem;
      max-width: 4rem;
    }
  }
}
</style>
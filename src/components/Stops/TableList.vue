<template>
  <div ref="wrapper" class="stop-list-wrap">
    <!-- Header with sorting -->
    <div class="stop-list-header flex items-center h-[48px] px-2 text-k-text-secondary bg-k-bg-secondary border-b border-k-border">
      <span class="track-number cursor-pointer flex items-center justify-center gap-2" @click="sort('displayOrder')" style="min-width: 7rem; max-width: 7rem;">
        <span class="truncate">ПОРЯДОК</span>
        <Icon v-if="sortField === 'displayOrder'" :icon="getSortIcon()" class="text-xs flex-shrink-0" />
      </span>
      <span class="title-stop cursor-pointer flex items-center gap-2" @click="sort('stopName')" style="flex: 1; max-width: 30%;">
        <span class="truncate">НАЗВАНИЕ</span>
        <Icon v-if="sortField === 'stopName'" :icon="getSortIcon()" class="text-xs flex-shrink-0" />
      </span>
      <span class="turkmen-name hidden md:block" style="min-width: 9rem; max-width: 9rem;">ТУРКМЕНСКИЙ</span>
      <span class="english-name hidden lg:block" style="min-width: 9rem; max-width: 9rem;">АНГЛИЙСКИЙ</span>
      <span class="city-name hidden lg:block" style="min-width: 7rem; max-width: 7rem;">ГОРОД</span>
      <span class="coordinates hidden md:block" style="min-width: 9rem; max-width: 9rem;">КООРДИНАТЫ</span>
      <span class="status" style="min-width: 5rem; max-width: 5rem; text-align: center;">СТАТУС</span>
      <span class="action" style="min-width: 13rem; text-align: center;">ДЕЙСТВИЯ</span>
    </div>

    <!-- Virtual Scroller for performance -->
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

    <!-- Loading indicator -->
    <div v-if="isLoading" class="loading-indicator flex justify-center py-4">
      <div class="spinner-border" role="status">
        <span class="sr-only">Загрузка...</span>
      </div>
    </div>

    <!-- Load more section -->
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

    <!-- Pagination info -->
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
  .virtual-scroller {
    @apply flex-1;
  }

  &.dragging .stop-item * {
    @apply pointer-events-none;
  }

  /* КОЛОНКИ ДЛЯ ОСТАНОВОК */
  .stop-list-header > span, .stop-item > span {
    @apply text-left p-3 align-middle text-ellipsis overflow-hidden;

    &.track-number {
      @apply basis-28 flex-shrink-0 min-w-0 text-center;
      max-width: 7rem; /* Увеличили для "ПОРЯДОК" */
    }

    &.title-stop {
      @apply flex-1 min-w-0;
      max-width: 30%; /* Ограничиваем максимальную ширину названия */
    }

    &.turkmen-name {
      @apply basis-36 flex-shrink-0 min-w-0;
      max-width: 9rem;
    }

    &.english-name {
      @apply basis-36 flex-shrink-0 min-w-0;
      max-width: 9rem;
    }

    &.city-name {
      @apply basis-28 flex-shrink-0 min-w-0;
      max-width: 7rem;
    }

    &.coordinates {
      @apply basis-36 flex-shrink-0 min-w-0;
      max-width: 9rem;
    }

    &.status {
      @apply basis-20 flex-shrink-0 text-center; /* Уменьшили ширину статуса */
      max-width: 5rem;
    }

    &.action {
      @apply basis-52 flex-shrink-0 text-center;
      min-width: 13rem;
    }
  }

  .stop-list-header {
    @apply tracking-wide uppercase cursor-pointer font-medium text-sm;
    background-color: var(--color-bg-primary);
    color: var(--color-text-secondary);
    border-bottom: 1px solid var(--color-border);

    span {
      @apply transition-colors duration-200;

      &:hover {
        color: var(--color-text-primary);
      }

      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .text-xs {
      @apply opacity-60;
    }

    /* Дополнительное ограничение ширины для заголовков */
    .track-number {
      min-width: 7rem !important;
    }

    .status {
      min-width: 5rem !important;
      max-width: 5rem !important;
    }
  }

  .loading-indicator {
    @apply border-t;
    background-color: var(--color-bg-secondary);
    border-color: var(--color-border);
  }

  .spinner-border {
    @apply inline-block w-6 h-6 border-2 border-solid border-r-transparent rounded-full animate-spin;
    border-color: var(--color-accent) transparent var(--color-accent) transparent;
  }

  .sr-only {
    @apply absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0;
    clip: rect(0, 0, 0, 0);
  }

  .load-more-button {
    @apply inline-flex items-center px-6 py-3 rounded-lg transition-all duration-200;
    background-color: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
  }

  .load-more-button:hover {
    background-color: color-mix(in srgb, var(--color-bg-secondary) 80%, transparent);
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .pagination-info {
    background-color: var(--color-bg-primary);
  }

  /* Mobile responsiveness */
  @media only screen and (max-width: 768px) {
    .stop-list-header {
      display: none;
    }

    .stop-item {
      @apply p-4;
      flex-direction: column;
      align-items: stretch;
      height: auto;
      min-height: 80px;
      border-bottom: 1px solid var(--color-border);
    }

    .stop-item > span {
      padding: 0;

      &.track-number {
        @apply absolute top-2 right-2 basis-auto;
      }

      &.title-stop {
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
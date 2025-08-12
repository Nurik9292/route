<template>
  <div ref="wrapper" class="banner-list-wrap">
    <!-- Header with sorting -->
    <div class="banner-list-header flex items-center h-[48px] px-2 text-k-text-secondary bg-k-bg-secondary border-b border-k-border">
      <span class="track-number cursor-pointer flex items-center justify-center gap-2" @click="sort('displayOrder')">
        <span class="truncate">ПОРЯДОК</span>
        <Icon v-if="sortField === 'displayOrder'" :icon="getSortIcon()" class="text-xs flex-shrink-0" />
      </span>
      <span class="title-banner cursor-pointer flex items-center gap-2" @click="sort('title')">
        <span class="truncate">НАЗВАНИЕ</span>
        <Icon v-if="sortField === 'title'" :icon="getSortIcon()" class="text-xs flex-shrink-0" />
      </span>
      <span class="image-preview hidden md:block">ИЗОБРАЖЕНИЕ</span>
      <span class="target-url hidden lg:block">ССЫЛКА</span>
      <span class="dates hidden lg:block">ДАТЫ</span>
      <span class="status">СТАТУС</span>
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
          :key="`banner-${item.banner.id}`"
          :item="item"
          @click="onClick(item, $event)"
          @edit="$emit('edit', item.banner)"
          @delete="$emit('delete', item.banner)"
          @toggle-status="$emit('toggle-status', item.banner)"
      />
    </VirtualScroller>

    <div v-if="isLoading" class="loading-indicator flex justify-center py-4">
      <div class="spinner-border animate-spin" role="status">
        <Icon :icon="['fas', 'spinner']" class="text-k-accent" />
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

    <div v-if="banners.length > 0" class="pagination-info px-4 py-3 border-t border-k-border bg-k-bg-secondary">
      <p class="text-sm text-k-text-secondary">
        Показано <span class="font-medium text-k-accent">{{ banners.length }}</span>
        из <span class="font-medium text-k-accent">{{ totalCount }}</span> баннеров
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
  name: 'BannersTableList',

  components: {
    VirtualScroller,
    ListItem,
    BtnComponent
  },

  props: {
    banners: {
      type: Array,
      default: () => []
    },
    selectedBanners: {
      type: Array,
      default: () => []
    },
    config: {
      type: Object,
      default: () => ({})
    },
    sortField: {
      type: String,
      default: 'displayOrder'
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

  emits: ['sort', 'scroll-breakpoint', 'scrolled-to-end', 'resize', 'edit', 'delete', 'toggle-status', 'load-more'],

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
      return Math.round((this.banners.length / this.totalCount) * 100);
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
    banners: {
      handler() {
        this.render();
      },
      deep: true
    },
    selectedBanners: {
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
      const selectedIds = this.selectedBanners.map(banner => banner.id);
      return this.banners.map(banner => ({
        banner,
        selected: selectedIds.includes(banner.id)
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
      this.$emit('edit', row.banner);
    },

    toggleRow(row) {
      row.selected = !row.selected;
    }
  }
};
</script>

<style lang="postcss">
.banner-list-wrap {
  width: 100% !important;
  overflow-x: auto;
}

.banner-list-header > span, .banner-item > span {
  @apply text-left p-3 align-middle;

  &.track-number {
    @apply basis-24 flex-shrink-0 min-w-0 text-center;
    min-width: 7rem !important;
    width: 7rem;
  }

  &.title-banner {
    @apply flex-1 min-w-0;
    min-width: 14rem !important;
  }

  &.image-preview {
    @apply basis-40 flex-shrink-0 min-w-0;
    min-width: 12rem !important;
    width: 12rem;
  }

  &.target-url {
    @apply basis-40 flex-shrink-0 min-w-0;
    min-width: 10rem !important;
    width: 10rem;
  }

  &.dates {
    @apply basis-40 flex-shrink-0 min-w-0;
    min-width: 10rem !important;
    width: 10rem;
  }

  &.status {
    @apply basis-40 flex-shrink-0 text-center;
    min-width: 10rem !important;
    width: 12rem;
  }

  &.action {
    @apply flex-1 flex-shrink-0 text-center;
    min-width: 18rem !important;
  }
}

.banner-list-header {
  @apply tracking-wide uppercase cursor-pointer font-medium text-sm;
  background-color: var(--color-bg-primary);
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
  width: 100% !important;

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
  .banner-list-wrap {
    width: 100% !important;
  }
}

@media (max-width: 1024px) {
  .banner-list-header > span, .banner-item > span {
    &.target-url {
      display: none !important;
    }
  }

  .banner-list-wrap {
    width: 100% !important;
  }
}

@media (max-width: 768px) {
  .banner-list-wrap {
    width: 100% !important;
    overflow-x: scroll;
  }

  .banner-list-header > span, .banner-item > span {
    &.image-preview,
    &.dates {
      display: none !important;
    }

    &.title-banner {
      min-width: 12rem !important;
      flex: 2;
    }

    &.action {
      min-width: 10rem !important;
    }

    &.status {
      min-width: 5rem !important;
    }

    &.track-number {
      min-width: 4rem !important;
    }
  }
}
</style>
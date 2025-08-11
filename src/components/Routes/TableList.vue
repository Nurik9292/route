<template>
  <div
      ref="wrapper"
      class="route-list-wrap relative flex flex-col flex-1 overflow-auto py-0 px-3 md:p-0"
      data-testid="route-list"
      tabindex="0"
      @keydown.delete.prevent="handleDelete"
      @keydown.enter.prevent="handleEnter"
      @keydown.a.prevent="handleA"
  >
    <!-- Table Header -->
    <div
        :class="config.sortable ? 'sortable' : 'unsortable'"
        class="route-list-header flex z-[2] bg-k-bg-secondary sticky top-0"
    >
      <span
          class="track-number"
          data-testid="header-track-number"
          role="button"
          title="Сортировать по номеру"
          @click="sort('routeNumber')"
      >
        №
        <template v-if="config.sortable">
          <Icon v-if="sortField === 'routeNumber' && sortOrder === 'asc'" :icon="['fas', 'caret-up']" class="text-k-highlight" />
          <Icon v-if="sortField === 'routeNumber' && sortOrder === 'desc'" :icon="['fas', 'caret-down']" class="text-k-highlight" />
        </template>
      </span>

      <span class="title-route">
        Название маршрута
        <template v-if="config.sortable">
          <Icon v-if="sortField === 'routeName' && sortOrder === 'asc'" :icon="['fas', 'caret-up']" class="text-k-highlight" />
          <Icon v-if="sortField === 'routeName' && sortOrder === 'desc'" :icon="['fas', 'caret-down']" class="text-k-highlight" />
        </template>
      </span>

      <span class="route-color text-center">
        Цвет
      </span>

      <span
          class="status text-center"
          role="button"
          title="Сортировать по статусу"
          @click="sort('isActive')"
      >
        Статус
        <template v-if="config.sortable">
          <Icon v-if="sortField === 'isActive' && sortOrder === 'asc'" :icon="['fas', 'caret-up']" class="text-k-highlight" />
          <Icon v-if="sortField === 'isActive' && sortOrder === 'desc'" :icon="['fas', 'caret-down']" class="text-k-highlight" />
        </template>
      </span>

      <span class="action text-center">
        Действия
      </span>
    </div>

    <!-- Routes List -->
    <VirtualScroller
        v-slot="{ item }"
        :item-height="80"
        :items="rows"
        @click="onClick(item, $event)"
        @scroll="onScroll"
        @scrolled-to-end="$emit('scrolled-to-end')"
    >
      <ListItem
          :key="item.route.id"
          :item="item"
          :selected="item.selected"
          draggable="true"
          @click="onClick(item, $event)"
          @edit="$emit('edit', item.route)"
          @delete="$emit('delete', item.route)"
          @toggle-geometry="handleToggleGeometry(item.route)"
          @view-stops="handleViewStops(item.route)"
      />
    </VirtualScroller>

    <!-- Load More Button -->
    <div v-if="hasMoreData" class="load-more-section p-4 text-center border-t border-k-border bg-k-bg-secondary">
      <BtnComponent
          @click="$emit('load-more')"
          :loading="isLoading"
          white
      >
        {{ isLoading ? 'Загрузка...' : 'Загрузить ещё' }}
      </BtnComponent>
    </div>

    <!-- Pagination Info -->
    <div v-if="routes.length > 0" class="pagination-info px-4 py-3 border-t border-k-border bg-k-bg-secondary">
      <div class="flex justify-between items-center">
        <p class="text-sm text-k-text-secondary">
          Показано <span class="font-medium text-k-accent">{{ routes.length }}</span>
          из <span class="font-medium text-k-accent">{{ totalCount }}</span> маршрутов
        </p>

        <div v-if="activeRoutes > 0" class="text-xs text-k-text-secondary">
          <Icon :icon="['fas', 'check-circle']" class="text-green-500 mr-1" />
          Активных: {{ activeRoutes }}
        </div>
      </div>

      <div v-if="hasMoreData" class="progress-bar mt-2 w-full h-2 bg-k-bg-primary rounded-full overflow-hidden">
        <div
            class="progress-fill h-full bg-gradient-to-r from-k-accent to-blue-400 transition-all duration-300 ease-out"
            :style="{ width: progressPercentage + '%' }"
        ></div>
      </div>
    </div>



    <RouteGeometryModal
      v-if="showGeometryModal"
      :route="selectedRoute"
      @close="showGeometryModal = false"
      @geometry-updated="handleGeometryUpdated"
    />


    <!-- Route Stops Modal -->
    <!-- Commented out until RouteStopsModal is implemented -->
    <!--
    <RouteStopsModal
      v-if="showStopsModal"
      :route="selectedRoute"
      @close="showStopsModal = false"
    />
    -->
  </div>
</template>

<script>
import isMobile from 'ismobilejs';
import { nextTick, ref } from 'vue';
import { throttle } from 'lodash';
import { useMessageToaster } from '@/composables';

import VirtualScroller from '../Ui/VirtualScroller.vue';
import ListItem from './ListItem.vue';
import BtnComponent from '../Ui/Form/BtnComponent.vue';
import RouteGeometryModal from './RouteGeometryModal.vue';
// import RouteStopsModal from './RouteStopsModal.vue';

export default {
  name: 'RoutesTableList',

  components: {
    VirtualScroller,
    ListItem,
    BtnComponent,
    RouteGeometryModal,
    // RouteStopsModal
  },

  props: {
    routes: {
      type: Array,
      default: () => []
    },
    selectedRoutes: {
      type: Array,
      default: () => []
    },
    config: {
      type: Object,
      default: () => ({})
    },
    sortField: {
      type: String,
      default: 'routeNumber'
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

  emits: [
    'sort',
    'scroll-breakpoint',
    'scrolled-to-end',
    'resize',
    'edit',
    'delete',
    'load-more',
    'geometry-updated'
  ],

  setup() {
    const { toastSuccess } = useMessageToaster();
    const showGeometryModal = ref(false);
    const showStopsModal = ref(false);
    const selectedRoute = ref(null);

    return {
      toastSuccess,
      showGeometryModal,
      showStopsModal,
      selectedRoute
    };
  },

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
      return Math.round((this.routes.length / this.totalCount) * 100);
    },

    activeRoutes() {
      return this.routes.filter(route => route.isActive).length;
    }
  },

  watch: {
    routes: {
      immediate: true,
      handler() {
        this.buildRows();
      }
    },

    selectedRoutes() {
      this.updateRowSelection();
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
  },

  beforeUnmount() {
    if (this.throttledResize) {
      window.removeEventListener('resize', this.throttledResize);
    }
  },

  methods: {
    buildRows() {
      this.rows = this.routes.map(route => ({
        route,
        selected: this.selectedRoutes.includes(route.id)
      }));
    },

    updateRowSelection() {
      this.rows.forEach(row => {
        row.selected = this.selectedRoutes.includes(row.route.id);
      });
    },

    sort(field) {
      if (!this.config.sortable) return;

      const newSortOrder = this.sortField === field && this.sortOrder === 'asc' ? 'desc' : 'asc';
      this.$emit('sort', field, newSortOrder);
    },

    onClick(row, event) {
      if (isMobile.any) {
        this.toggleRow(row);
        return;
      }

      // Handle click for editing on desktop
      this.$emit('edit', row.route);
    },

    toggleRow(row) {
      row.selected = !row.selected;
    },

    onScroll(event) {
      const { scrollTop } = event.target;

      // Emit scroll breakpoint for infinite loading
      if (scrollTop > this.lastScrollTop && scrollTop > 100) {
        this.$emit('scroll-breakpoint');
      }

      this.lastScrollTop = scrollTop;
    },

    handleDelete() {
      const selectedRows = this.rows.filter(row => row.selected);
      if (selectedRows.length > 0) {
        selectedRows.forEach(row => {
          this.$emit('delete', row.route);
        });
      }
    },

    handleEnter() {
      const selectedRows = this.rows.filter(row => row.selected);
      if (selectedRows.length === 1) {
        this.$emit('edit', selectedRows[0].route);
      }
    },

    handleA(event) {
      if (event.ctrlKey || event.metaKey) {
        // Select all routes
        this.rows.forEach(row => {
          row.selected = true;
        });
      }
    },

    handleToggleGeometry(route) {
      // TODO: Implement geometry modal when RouteGeometryModal is ready
      this.toastSuccess('Редактирование геометрии маршрута будет реализовано');
      // this.selectedRoute = route;
      //  this.showGeometryModal = true;
    },

    handleViewStops(route) {
      // TODO: Implement stops modal when RouteStopsModal is ready
      this.toastSuccess('Просмотр остановок маршрута будет реализован');
      // this.selectedRoute = route;
      // this.showStopsModal = true;
    },

    handleGeometryUpdated() {
      this.showGeometryModal = false;
      this.selectedRoute = null;
      this.toastSuccess('Геометрия маршрута обновлена');
      this.$emit('geometry-updated');
    },

    getRouteTypeText(routeType) {
      const types = {
        'regular': 'Обычный',
        'express': 'Экспресс',
        'circular': 'Кольцевой',
        'night': 'Ночной',
        'suburban': 'Пригородный'
      };
      return types[routeType] || routeType;
    },

    formatTime(time) {
      if (!time) return '';
      return time.substring(0, 5);
    },

    formatPrice(price) {
      if (price === null || price === undefined) return '';
      return `${price} ман`;
    }
  }
};
</script>

<style lang="postcss">
.route-list-wrap {
  min-width: 90rem;
  overflow-x: auto;
}

.route-list-header > span, .route-item > span {
  @apply text-left p-3 align-middle;

  &.track-number {
    @apply basis-16 flex-shrink-0 min-w-0 text-center font-mono;
    min-width: 4rem;
    max-width: 4rem;
  }

  &.title-route {
    @apply flex-1 min-w-0;
    min-width: 20rem;
    max-width: none;
  }

  &.route-color {
    @apply basis-16 flex-shrink-0 text-center;
    min-width: 4rem;
    max-width: 4rem;
  }

  &.status {
    @apply basis-24 flex-shrink-0 text-center;
    min-width: 6rem;
    max-width: 8rem;
  }

  &.action {
    @apply basis-64 flex-shrink-0 text-center;
    min-width: 16rem;
    max-width: 18rem;
  }
}

.route-list-header {
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
}

/* Progress bar animation */
.progress-fill {
  transition: width 0.3s ease-out;
}

/* Responsive design */
@media (max-width: 1200px) {
  .route-list-wrap {
    min-width: 70rem;
  }
}

@media (max-width: 1024px) {
  .route-list-wrap {
    min-width: 60rem;
  }

  .route-list-header > span, .route-item > span {
    &.title-route {
      min-width: 15rem;
    }

    &.action {
      min-width: 12rem;
      max-width: 14rem;
    }
  }
}

@media (max-width: 768px) {
  .route-list-wrap {
    min-width: auto;
    overflow-x: scroll;
  }

  .route-list-header > span, .route-item > span {
    &.route-color {
      display: none !important;
    }

    &.title-route {
      min-width: 12rem;
      flex: 2;
    }

    &.action {
      min-width: 8rem;
      max-width: 10rem;
    }

    &.status {
      min-width: 5rem;
    }

    &.track-number {
      min-width: 3rem;
      max-width: 3rem;
    }
  }
}

/* Loading states */
.load-more-section {
  transition: all 0.2s ease;
}

.load-more-section:hover {
  background-color: var(--color-bg-primary);
}
</style>
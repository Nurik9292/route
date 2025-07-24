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
        <div
            :class="config.sortable ? 'sortable' : 'unsortable'"
            class="route-list-header flex z-[2] bg-k-bg-secondary"
        >
            <span
                class="track-number"
                data-testid="header-track-number"
                role="button"
                title="Sort by track number"
                @click="sort('id')"
            >
                #
                <template v-if="config.sortable">
                    <Icon v-if="sortField === 'id' && sortOrder === 'asc'" :icon="['fas', 'caret-up']" class="text-k-highlight" />
                    <Icon v-if="sortField === 'id' && sortOrder === 'desc'" :icon="['fas', 'caret-down']" class="text-k-highlight" />
                </template>
            </span>
            
            <span 
                class="title-route"
                data-testid="header-title"
                role="button"
                title="Sort by title"
                @click="sort('title')"
            >
                Title
                <template v-if="config.sortable">
                    <Icon v-if="sortField === 'title' && sortOrder === 'asc'" :icon="['fas', 'caret-up']" class="text-k-highlight" />
                    <Icon v-if="sortField === 'title' && sortOrder === 'desc'" :icon="['fas', 'caret-down']" class="text-k-highlight" />
                </template>
            </span>

            <span
              class="number-route"
              data-testid="header-number"
              role="button"
              title="Sort by number"
              @click="sort('number')"
            >
              Number
              <template v-if="config.sortable">
                  <Icon v-if="sortField === 'number' && sortOrder === 'asc'" :icon="['fas', 'caret-up']" class="text-k-highlight" />
                  <Icon v-if="sortField === 'number' && sortOrder === 'desc'" :icon="['fas', 'caret-down']" class="text-k-highlight" />
              </template>
            </span>

          <span class="action">
            Actions
          </span>
        </div>

        <VirtualScroller
          v-slot="{ item }"
          :item-height="64"
          :items="rows"
          @click="onClick(item, $event)"
          @scroll="onScroll"
          @scrolled-to-end="$emit('scrolled-to-end')"
         >
        <ListItem
          :key="item.route.id"
          :item="item"
          draggable="true"
          @click="onClick(item, $event)"
        />
      </VirtualScroller>
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
      ListItem
    },

    props: {
      routes: {
        type: Array,
        default: []
      },
      selectedRoutes: {
        type: Array,
        default: []
      },
      config: {
        type: Object,
        default: {}
      },
      sortField: {
        type: String,
        default: 'title'
      },
      sortOrder: {
        
      }
    },

    data() {
        return {
            wrapper: null,
            lastSelectedRow: null,
            sortFields: [],
            rows: [],
            lastScrollTop: 0,
            throttledResize: null,

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
      this.render()
    },

    beforeUnmount() {
      window.removeEventListener('resize', this.throttledResize);
    },

    watch: {
      routes: {
          handler() {
            this.render();
          },
          deep: true,
      },
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
        if (!this.config.sortable)
          this.sortFields = [];

        this.rows = this.generateRows();
      },

      generateRows() {        
        const selectedIds = this.selectedRoutes.map(route => route.id);
        return this.routes.map(route => ({
          route,
          selected: selectedIds.includes(route.id)
        }));
      },
        
      sort(field) {
          if (!this.config.sortable) return;
          const newSortField = field;
          const newSortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
          this.$emit('sort',newSortField, newSortOrder);
      },

      onClick (row, event) {
        
        if (isMobile.any) {
          toggleRow(row)
          return;
        }
      },

      toggleRow (row) {
        row.selected = !row.selected;
        this.lastSelectedRow = row;
      }
      
  }

}
</script>



<style lang="postcss">
.route-list-wrap {
  .virtual-scroller {
    @apply flex-1;
  }

  &.dragging .route-item * {
    @apply pointer-events-none;
  }

  .route-list-header > span, .route-item > span {
    @apply text-left p-2 align-middle text-ellipsis overflow-hidden whitespace-nowrap;


    &.track-number {
      @apply basis-16 pl-6;
    }

    &.collaborator {
      @apply basis-[72px] text-center;
    }


    &.added-at {
      @apply basis-36 text-left;
    }

    &.extra {
      @apply basis-12 text-center;
    }

    &.title-route {
      @apply flex-1;
    }

    &.action {
      @apply basis-56 text-center;
    }


    &.number-route {
      @apply basis-[27%];
    }
  }

  .route-list-header {
    @apply tracking-widest uppercase cursor-pointer text-k-text-secondary;

    .extra {
      @apply px-0;
    }
  }

  .unsortable span {
    @apply cursor-default;
  }

  @media only screen and (max-width: 768px) {
    .scroller {
      top: 0;

      .item-container {
        left: 12px;
        right: 12px;
        width: calc(200vw - 24px);
      }
    }

    .route-item {
      padding: 8px 12px;
      position: relative;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 200%;
    }

    .route-item :is(.track-number, .title-route, .number-route, .action, .added-at),
    .route-list-header :is(.track-number, .title-route, .number-route, .action, .added-at) {
      display: none;
    }

    .route-item span {
      padding: 0;
      vertical-align: bottom;
    }
  }
}
</style>

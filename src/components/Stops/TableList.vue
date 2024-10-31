<template>
    <div
        ref="wrapper"
        class="stop-list-wrap relative flex flex-col flex-1 overflow-auto py-0 px-3 md:p-0"
        data-testid="stop-list"
        tabindex="0"
        @keydown.delete.prevent.stop="handleDelete"
        @keydown.enter.prevent.stop="handleEnter"
        @keydown.a.prevent="handleA"
    >
        <div
            :class="config.sortable ? 'sortable' : 'unsortable'"
            class="stop-list-header flex z-[2] bg-k-bg-secondary"
        >
            <span
                class="track-number"
                data-testid="header-track-number"
                role="button"
                title="Sort by track number"
                @click="sort('track')"
            >
                #
                <template v-if="config.sortable">
                    <Icon v-if="sortField === 'track' && sortOrder === 'asc'" :icon="['fas', 'caret-up']" class="text-k-highlight" />
                    <Icon v-if="sortField === 'track' && sortOrder === 'desc'" :icon="['fas', 'caret-down']" class="text-k-highlight" />
                </template>
            </span>
            
            <span 
                class="title-stop"
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

            <template v-if="config.collaborative">
              <span class="collaborator">User</span>
              <span class="added-at">Added</span>
            </template>        
        </div>

        <VirtualScroller
          :item-height="64"
          :items="rows"
         >
        <ListItem/>
      </VirtualScroller>
    </div>
</template>

<script>
import { StopListConfigKey, StopListSortFieldKey, StopListSortOrderKey, SelectedStopsKey } from '@/symbols';
import { requireInjection } from '@/utils';

import VirtualScroller from '../Ui/VirtualScroller.vue';
import ListItem from './ListItem.vue';


export default {
    name: 'TableList',

    components: {
      VirtualScroller,
      ListItem
    },

    data() {
      const [selectedStops, setSelectedStops] = requireInjection(SelectedStopsKey);
      const [sortField, setSortField] = requireInjection(StopListSortFieldKey);
      const [sortOrder, setSortOrder] = requireInjection(StopListSortOrderKey);
      const [config] = requireInjection(StopListConfigKey, [{}]);

        return {
            wrapper: null,
            lastSelectedRow: null,
            sortFields: [],
            rows: [],
            lastScrollTop: 0,
            sortField,
            setSortField,
            config,
            sortOrder,
            setSortOrder,
            selectedStops,
            setSelectedStops

        }
    },


    mounted() {
      
    },

    methods: {

      render() {
        if (!this.config.sortable)
          this.sortFields = [];

        this.rows = generateRows();
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
          this.setSortField(field);
          this.setSortOrder(this.sortOrder === 'asc' ? 'desc' : 'asc');
          this.$emit('sort', field, this.sortOrder);
      },
    }

}
</script>



<style lang="postcss">
.stop-list-wrap {
  .virtual-scroller {
    @apply flex-1;
  }

  &.dragging .stop-item * {
    @apply pointer-events-none;
  }

  .stop-list-header > span, .stop-item > span {
    @apply text-left p-2 align-middle text-ellipsis overflow-hidden whitespace-nowrap;

    &.time {
      @apply basis-20 overflow-visible;
    }

    &.track-number {
      @apply basis-16 pl-6;
    }

    &.album {
      @apply basis-[27%];
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

    &.play {
      @apply hidden no-hover:block;
    }

    &.title-stop {
      @apply flex-1;
    }
  }

  .stop-list-header {
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

    .stop-item {
      padding: 8px 12px;
      position: relative;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 200%;
    }

    .stop-item :is(.track-number, .album, .time, .added-at),
    .stop-list-header :is(.track-number, .album, .time, .added-at) {
      display: none;
    }

    .stop-item span {
      padding: 0;
      vertical-align: bottom;

      &.thumbnail {
        display: block;
        padding-right: 12px;
      }
    }
  }
}
</style>

<template>
    <BaseView>
        <template #header>
            <ScreenHeader layout="collapsed">
                Остановки

                <template v-if="stops.length > 0" #meta>
                    <span>{{ pluralizes() }}</span>
                </template>

                <template #controls>
                    <div class="controls w-full min-h-[32px] flex justify-between items-center gap-4">
                        <ListFilter v-if="stops.length > 0 && !isPhone"  @change="onFilterChanged"/>
                    </div>
                    <BtnGroup uppercase>
                        <BtnComponent success @click="showAddStopForm">
                            <Icon :icon="['fas', 'plus']" />
                            Добавить
                        </BtnComponent>
                    </BtnGroup>
                </template>
            </ScreenHeader>
        
        </template>

        <ListSkeleton v-if="showSkeletons" class="-m-6" />
       
        <template v-else>
            <TableList 
                v-if="stops.length > 0" 
                ref="stopList" class="-m-6" 
                :stops="filteredStops"
                :config="config"
                :sortField="sortField"
                :sortOrder="sortOrder"
                @sort="sort"
                @scroll-breakpoint="onScrollBreakpoint" 
                @press:enter="onPressEnter" 
                @scrolled-to-end="fetchStops" 
            />
            <EmptyState v-else>
                <template #icon>
                    <Icon :icon="['fas', 'shop-slash']" />
                </template>
                Список остановок пуст

            </EmptyState>
        </template>
    </BaseView>
</template>

<script>
import BaseView from './BaseView.vue';
import ScreenHeader from '@/components/Ui/ScreenHeader.vue';
import ListFilter from '@/components/Ui/ListFilter.vue';
import BtnGroup from '@/components/Ui/Form/BtnGroup.vue';
import BtnComponent from '@/components/Ui/Form/BtnComponent.vue';
import ListSkeleton from '@/components/Ui/Skeletons/ListSkeleton.vue';
import TableList from '@/components/Stops/TableList.vue';
import EmptyState from '@/components/Ui/EmptyState.vue';

import { pluralize, eventBus } from '@/utils';
import isMobile from 'ismobilejs';
import { useErrorHandler, useRouter, useFuzzySearch } from '@/composables';
import { mapActions, mapGetters } from 'vuex';
import { orderBy, throttle } from 'lodash';


export default {
    name: 'StopsView',

    components: {
        BaseView,
        ScreenHeader,
        ListFilter,
        BtnGroup,
        BtnComponent,
        ListSkeleton,
        TableList,
        EmptyState
    },

    setup() {
        const { go, onScreenActivated } = useRouter();
        return {
            go,
            onScreenActivated
        }
    },

    data() {
        return {
            fuzzy: null,
            stops: [],
            filterKeywords: '',
            stopList: null,
            isPhone: isMobile.any,
            selectedStops: [],
            headerLayout: 'expanded',
            sortField: 'name',
            sortOrder: 'asc',
            loading: false,
            page: 1,
            initialized: false,
            config: {
                filterable: false,
                sortable: true,
                reorderable: false,
                collaborative: false,
                hasCustomOrderSort: false
            } 
        }
    },

    computed: {
        ...mapGetters('stops', ['getStops']),

        moreStopsAvailable() {
            return this.page !== null;
        },

        showSkeletons() {
            return this.loading && this.filteredStops.length === 0;
        },

        filteredStops() {            
            if (!this.filterKeywords) return this.stops;
            return this.sortField
                ? orderBy(this.fuzzy.search(this.filterKeywords), this.extendedSortFields, this.sortOrder)
                : this.fuzzy.search(this.filterKeywords);
        },

        extendedSortFields() {
            if (!this.sortField) return null;
            let extended = [this.sortField];
            if (this.sortField === 'id') {
                extended = ['id', 'title'];
            }
            return extended;
        },

        
    },

    async created() {
      await  this.fetchInitialStops();
    },


    watch: {
        getStops: {
            immediate: true,
            handler(newStops) {                
                this.stops = newStops;
                
            }
        }
    },

    methods: {
        ...mapActions('stops', ['paginate']),

        pluralizes() {
            pluralize(this.stops.length, 'stops');
        },

        async fetchInitialStops() {            
            if (this.loading || this.initialized) return;  
            try {
                this.initialized = true;
                await this.fetchStops();
                this.fuzzy = useFuzzySearch(this.stops, ['name']);
            } catch (error) {
                useErrorHandler().handleHttpError(error);
            }
        },

        async fetchStops() { 

            if (!this.moreStopsAvailable || this.loading) return;
            
            this.loading = true;    
            try {
                this.page = await this.paginate({
                    sort: this.sortField,
                    order: this.sortOrder,
                    page: this.page
                });
                
            } catch (error) {
                useErrorHandler().handleHttpError(error);
            } finally {
                this.loading = false;
            }
        },

        async sort(field, order) {        
            
            this.page = 1;
            this.sortField = field;
            this.sortOrder = order;
            
            await this.fetchStops();
        },

        showAddStopForm() {
            eventBus.emit('MODAL_SHOW_ADD_STOP_FORM');
        },

        onFilterChanged(value) {
            this.filterKeywords = value;
        },

        onScrollBreakpoint: throttle(function (direction) {
            this.headerLayout = direction === 'down' ? 'collapsed' : 'expanded';
        }, 200)

  }

}
</script>

<style lang="postcss" scoped>
.collapsed .controls {
    @apply w-auto;
}

.invited-heading-decoration {
    @apply relative flex-1 before:absolute before:top-1/2;
    @apply before:left-0 before:right-0 before:h-px before:opacity-20 before:bg-k-text-secondary;
  }
</style>
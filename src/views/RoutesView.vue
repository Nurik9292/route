<template>
    <BaseView>
        <template #header>
            <ScreenHeader layout="collapsed">
                Маршруты

                <template v-if="routes.length > 0" #meta>
                    <span>{{ pluralizes() }}</span>
                </template>


                <template #controls>
                    <div class="controls w-full min-h-[32px] flex justify-between items-center gap-4">
                        <ListFilter v-if="routes.length > 0 && !isPhone" />
                    </div>
                    <BtnGroup uppercase>
                        <BtnComponent success @click="showAddRouteForm">
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
                v-if="routes.length > 0" 
                ref="routeList" class="-m-6" 
                :routes="filteredRoutes"
                :config="config"
                :sortField="sortField"
                :sortOrder="sortOrder"
                @sort="sort"
                @scroll-breakpoint="onScrollBreakpoint" 
                @press:enter="onPressEnter" 
                @scrolled-to-end="fetchRoutes" 
            />  
            <EmptyState v-else>
                <template #icon>
                    <Icon :icon="['fas', 'circle-exclamation']" />
                </template>
                Список маршрутов пуст

            </EmptyState>
        </template>
    </BaseView>
</template>


<script>
import { useErrorHandler, useRouter, useFuzzySearch } from '@/composables';
import { pluralize, eventBus } from '@/utils';
import { mapActions, mapGetters } from 'vuex';
import { orderBy, throttle } from 'lodash';
import isMobile from 'ismobilejs';

import BaseView from './BaseView.vue';
import ScreenHeader from '@/components/Ui/ScreenHeader.vue';
import EmptyState from '@/components/Ui/EmptyState.vue';
import ListFilter from '@/components/Ui/ListFilter.vue';
import BtnGroup from '@/components/Ui/Form/BtnGroup.vue';
import BtnComponent from '@/components/Ui/Form/BtnComponent.vue';
import ListSkeleton from '@/components/Ui/Skeletons/ListSkeleton.vue';
import TableList from '@/components/Routes/TableList.vue';


export default {
    name: 'RoutesView',

    components: {
        BaseView,
        ScreenHeader,
        EmptyState,
        ListFilter,
        BtnGroup,
        BtnComponent,
        ListSkeleton,
        TableList
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
            routes: [],
            filterKeywords: '',
            routeList: null,
            isPhone: isMobile.any,
            selectedRoutes: [],
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

        ...mapGetters('routes', ['getRoutes']),

        moreRoutesAvailable() {
            return this.page !== null;
        },

        showSkeletons() {
            return this.loading && this.filteredRoutes.length === 0;
        },

        filteredRoutes() {            
            if (!this.fuzzy) return this.routes;
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
        this.fuzzy = this.config.filterable ? useFuzzySearch(this.routes, ['title']) : null;
        this.fetchInitialRoutes();
    },


    watch: {
        getRoutes: {
            immediate: true,
            handler(newRoutes) {                
                this.routes = newRoutes;
            }
        }
    },


    methods: {

        ...mapActions('routes', ['paginate']),

        pluralizes() {
            pluralize(this.routes.length, 'routes');
        },

        async fetchInitialRoutes() {            
            if (this.loading || this.initialized) return;
            try {
                this.initialized = true;
                await this.fetchRoutes();
            } catch (error) {
                useErrorHandler().handleHttpError(error);
            }
        },

        async fetchRoutes() { 

            if (!this.moreRoutesAvailable || this.loading) return;

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
            
            await this.fetchRoutes();
        },

        showAddRouteForm() {
            eventBus.emit('MODAL_SHOW_ADD_ROUTE_FORM');
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
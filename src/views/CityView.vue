<template>
    <BaseView>
        <template #header>
            <ScreenHeader layout="collapsed"> 
                Города

                <template v-if="cities.length > 0" #meta>
                    <span>{{ pluralizes() }}</span>
                </template>

                <template #controls>
                    <div class="controls w-full min-h-[32px] flex justify-between items-center gap-4">
                        <ListFilter v-if="cities.length > 0 && !isPhone"  @change="onFilterChanged"/>
                    </div>
                    <BtnGroup uppercase>
                        <BtnComponent success @click="showAddCitiyForm">
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
                v-if="cities.length > 0" 
                ref="cityList" class="-m-6" 
                :cities="filteredCities"
                :config="config"
                :sortField="sortField"
                :sortOrder="sortOrder"
                @sort="sort"
                @scroll-breakpoint="onScrollBreakpoint" 
                @press:enter="onPressEnter" 
                @scrolled-to-end="fetchCities" 
            />
            <EmptyState v-else>
                <template #icon>
                    <Icon :icon="['fas', 'building-circle-exclamation']" />
                </template>
                Список городов пуст

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
import TableList from '@/components/City/TableList.vue';
import EmptyState from '@/components/Ui/EmptyState.vue';

import { pluralize, eventBus } from '@/utils';
import isMobile from 'ismobilejs';
import { useErrorHandler, useRouter, useFuzzySearch } from '@/composables';
import { mapActions, mapGetters } from 'vuex';
import { orderBy, throttle } from 'lodash';

export default {
    name: 'CityView',

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
            cities: [],
            filterKeywords: '',
            cityList: null,
            isPhone: isMobile.any,
            selectedCities: [],
            headerLayout: 'expanded',
            sortField: 'title',
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

        ...mapGetters('cities', ['getCities']),

        moreCitiesAvailable() {
            return this.page !== null;
        },

        showSkeletons() {
            return this.loading && this.filteredCities.length === 0;
        },

        filteredCities() {
            if (!this.filterKeywords) return this.cities;
            return this.sortField
                ? orderBy(this.fuzzy.search(this.filterKeywords), this.extendedCityFields, this.sortOrder)
                : this.fuzzy.search(this.filterKeywords);
        },

        extendedCityFields() {
            if (!this.sortField) return null;
            let extended = [this.sortField];
            if (this.sortField === 'id') {
                extended = ['id', 'title'];
            }
            return extended;
        },
    },

    async created() {
        this.fetchInitialCities();
    },


    watch: {
        getCities: {
            immediate: true,
            handler(newCities) {             
                this.cities = newCities;
            }
        },

    },

    methods: {

        ...mapActions('cities', ['paginate']),

        pluralizes() {
            pluralize(this.cities.length, 'cities');
        },

        async fetchInitialCities() {            
            if (this.loading || this.initialized) return;
            try {
                this.initialized = true;
                await this.fetchCities();
                this.fuzzy = useFuzzySearch(this.cities, ['title']);

            } catch (error) {
                useErrorHandler().handleHttpError(error);
            }
        },

        async fetchCities() { 
          
            if (!this.moreCitiesAvailable || this.loading) return;
         
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
            
            await this.fetchCities();
        },

        showAddCitiyForm() {
            eventBus.emit('MODAL_SHOW_ADD_CITY_FORM');
        },

        onFilterChanged(value) {
            this.filterKeywords = value;
        },

        onScrollBreakpoint: throttle(function (direction) {
            this.headerLayout = direction === 'down' ? 'collapsed' : 'expanded';
        }, 200)

  },

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
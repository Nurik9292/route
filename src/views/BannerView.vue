<template>
    <BaseView>
        <template #header>
            <ScreenHeader layout="collapsed"> 
                Баннеры

                <template v-if="banners.length > 0" #meta>
                    <span>{{ pluralizes() }}</span>
                </template>

                <template #controls>
                    <BtnGroup uppercase>
                        <BtnComponent success @click="showAddBannerForm">
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
                v-if="banners.length > 0" 
                ref="bannerList" class="-m-6" 
                :banners="filteredBanners"
                :config="config"
                :sortField="sortField"
                :sortOrder="sortOrder"
                @sort="sort"
                @scroll-breakpoint="onScrollBreakpoint" 
                @press:enter="onPressEnter" 
                @scrolled-to-end="fetchBanners" 
            />
            <EmptyState v-else>
                <template #icon>
                    <Icon :icon="['fas', 'square-xmark']" />
                </template>
                Список баннеров пуст
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
import TableList from '@/components/Banners/TableList.vue';
import EmptyState from '@/components/Ui/EmptyState.vue';

import { pluralize, eventBus } from '@/utils';
import isMobile from 'ismobilejs';
import { useErrorHandler, useRouter, useFuzzySearch } from '@/composables';
import { mapActions, mapGetters } from 'vuex';
import { orderBy, throttle } from 'lodash';

export default {
    name: 'BannerView',

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
            banners: [],
            filterKeywords: '',
            bannerList: null,
            isPhone: isMobile.any,
            selectedBanners: [],
            headerLayout: 'expanded',
            sortField: 'id',
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

        ...mapGetters('banners', ['getBanners']),

        moreBannersAvailable() {
            return this.page !== null;
        },

        showSkeletons() {
            return this.loading && this.filteredBanners.length === 0;
        },

        filteredBanners() {
            if (!this.filterKeywords) return this.banners;
            return this.sortField
                ? orderBy(this.fuzzy.search(this.filterKeywords), this.extendedCityFields, this.sortOrder)
                : this.fuzzy.search(this.filterKeywords);
        },

        extendedBannerFields() {
            if (!this.sortField) return null;
            let extended = [this.sortField];
            if (this.sortField === 'id') {
                extended = ['id'];
            }
            return extended;
        },
    },

    async created() {
        this.fetchInitialBanners();
    },


    watch: {
        getBanners: {
            immediate: true,
            handler(newBanners) {             
                this.banners = newBanners || [];
            }
        },

    },

    methods: {

        ...mapActions('banners', ['paginate']),

        pluralizes() {
            pluralize(this.banners.length, 'banners');
        },

        async fetchInitialBanners() {            
            if (this.loading || this.initialized) return;
            try {
                this.initialized = true;
                await this.fetchBanners();
                this.fuzzy = useFuzzySearch(this.banners, ['id']);

            } catch (error) {
                useErrorHandler().handleHttpError(error);
            }
        },

        async fetchBanners() { 
          
            if (!this.moreBannersAvailable || this.loading) return;
         
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
            
            await this.fetchBanners();
        },

        showAddBannerForm() {
            eventBus.emit('MODAL_SHOW_ADD_BANNER_FORM');
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
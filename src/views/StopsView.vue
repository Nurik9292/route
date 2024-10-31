<template>
    <BaseView>
        <template #header>
            <ScreenHeader layout="collapsed">
                Остановки

                <template v-if="totalStopCount" #meta>
                    <span>{{ pluralize(totalStopCount, 'stops') }}</span>
                </template>

                <template #controls>
                    <div class="controls w-full min-h-[32px] flex justify-between items-center gap-4">
                        <ListFilter  v-if="totalStopCount && !isPhone" />
                    </div>
                    <BtnGroup uppercase>
                        <BtnComponent success @click="showAddUserForm">
                          <Icon :icon="['fas', 'plus']" />
                          Добавить
                        </BtnComponent>
                      </BtnGroup>
                </template>
            </ScreenHeader>
        </template>

        <ListSkeleton v-if="showSkeletons" class="-m-6"/>
        <template v-else>
            <TableList
                ref="stopList"
                class="-m-6"
                @sort="sort"
                @scroll-breakpoint="onScrollBreakpoint"
                @press:enter="onPressEnter"
                @scrolled-to-end="fetchStops"
            />
        </template>
    </BaseView>
</template>

<script>
import BaseView from './BaseView.vue';
import ScreenHeader from '@/components/Ui/ScreenHeader.vue';
import ThumbnailStack from '@/components/Ui/ThumbnailStack.vue';
import ListFilter from '@/components/Ui/ListFilter.vue';
import BtnGroup from '@/components/Ui/Form/BtnGroup.vue';
import BtnComponent from '@/components/Ui/Form/BtnComponent.vue';
import ListSkeleton from '@/components/Ui/Skeletons/ListSkeleton.vue';
import TableList from '@/components/Stops/TableList.vue';

import { pluralize } from '@/utils';
import { useStopList, useErrorHandler } from '@/composables';
import { mapActions } from 'vuex';

export default {
    name: 'StopsView',

    components: {
        BaseView,
        ScreenHeader,
        ThumbnailStack,
        ListFilter,
        BtnGroup,
        BtnComponent,
        ListSkeleton,
        TableList
    },

    data() {
        const { stops, stopList, isPhone, onScrollBreakpoint } = useStopList([], { type: 'Stops' }, { filterable: false, sortable: true })

        return {
            totalStopCount: 1,
            page: 1,
            initialized: false,
            loading: false,
            sortField: 'title',
            sortOrder: 'asc',
            thumbnails: [],
            isPhone,
            stops,
            showSkeletons: false
        }
    },

    computed: {
        showSkeletons()  {
            return this.loading && this.stops.length === 0;
        },

        moreStopsAvailable() {
        return this.page !== null
      },
    },

    

    methods: {

        ...mapActions('stops', ['paginate']),
        
        pluralize(count, singular) {
            return pluralize(count, singular);
        },

    
        async sort(field, order) {
            this.page = 1;
            this.stops = [];
            this.sortField = field;
            this.sortOrder = order;
            await this.fetchStops();
        },

        async fetchStops() {
            if (!this.moreSongsAvailable || this.loading) return
            this.loading = true
            try {
                this.page = this.paginate({
                    sort: this.sortField,
                    order: this.sortOrder,
                    page: this.page,
                 });
            } catch (error) {
                useErrorHandler().handleHttpError(error)
            } finally {
                this.loading = false
            }
        },
    }
}
</script>

<style lang="postcss" scoped>
.collapsed .controls {
  @apply w-auto;
}
</style>